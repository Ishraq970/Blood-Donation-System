<?php

namespace App\Services;

use App\Models\BloodRequest;
use App\Models\DonorProfile;
use App\Models\RequestEvent;
use App\Models\RequestMatch;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class BloodMatchingService
{
    /**
     * Standard red blood cell compatibility matrix.
     * Recipient Blood Group => List of compatible Donor Blood Groups.
     *
     * @var array<string, array<string>>
     */
    public const COMPATIBILITY_MATRIX = [
        'A+' => ['A+', 'A-', 'O+', 'O-'],
        'A-' => ['A-', 'O-'],
        'B+' => ['B+', 'B-', 'O+', 'O-'],
        'B-' => ['B-', 'O-'],
        'AB+' => ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
        'AB-' => ['AB-', 'A-', 'B-', 'O-'],
        'O+' => ['O+', 'O-'],
        'O-' => ['O-'],
    ];

    public function __construct(
        protected MapService $mapService,
        protected BloodRequestService $requestService
    ) {}

    /**
     * Get compatible donor blood groups for a given recipient group.
     */
    public function getCompatibleDonorGroups(string $recipientGroup): array
    {
        return self::COMPATIBILITY_MATRIX[$recipientGroup] ?? [$recipientGroup];
    }

    /**
     * Find eligible available donors for an emergency blood request.
     *
     * @return Collection<int, array{donor: DonorProfile, distance_km: float, score: int, tier: string}>
     */
    public function findEligibleDonors(
        BloodRequest $request,
        float $maxRadiusKm = 35.0,
        int $limit = 20,
        bool $exactOnly = false
    ): Collection {
        // Use medical ABO/Rh compatibility for candidate discovery. A licensed
        // blood bank must still perform final typing and cross-matching.
        $compatibleGroups = $exactOnly
            ? [$request->blood_group]
            : $this->getCompatibleDonorGroups($request->blood_group);

        // Fetch candidate donors with eager loading
        $candidates = DonorProfile::query()
            ->active()
            ->whereIn('blood_group', $compatibleGroups)
            ->where('emergency_alerts_enabled', true)
            ->where('user_id', '!=', $request->requester_id)
            ->where(function ($query) {
                $query->whereNull('last_donation_at')
                      ->orWhere('last_donation_at', '<=', now()->subDays(90));
            })
            ->whereHas('user', function ($query) {
                $query->where('status', 'ACTIVE')
                      ->whereNotNull('email_verified_at');
            })
            ->with(['user', 'location', 'availabilities'])
            ->get();

        $matchedDonors = collect();

        foreach ($candidates as $donor) {
            // Must be available right now
            if (!$donor->isAvailableNow()) {
                continue;
            }

            // Calculate distance
            $distanceKm = $this->calculateDistance($request, $donor);

            // Filter by donor's preferred radius and search max radius
            $allowedRadius = min($donor->preferred_radius_km ?? 25, $maxRadiusKm);
            if ($distanceKm > $allowedRadius) {
                continue;
            }

            // Determine search tier
            $tier = match (true) {
                $distanceKm <= 5.0 => 'IMMEDIATE_0_5KM',
                $distanceKm <= 15.0 => 'LOCAL_5_15KM',
                $distanceKm <= 25.0 => 'REGIONAL_15_25KM',
                default => 'EXTENDED_25_35KM',
            };

            // Compute composite match score
            $score = $this->calculateMatchScore($request, $donor, $distanceKm);

            $matchedDonors->push([
                'donor' => $donor,
                'distance_km' => round($distanceKm, 2),
                'score' => $score,
                'tier' => $tier,
            ]);
        }

        // Sort by highest score first, then closest distance
        return $matchedDonors
            ->sortByDesc('score')
            ->values()
            ->take($limit);
    }

    /**
     * Dispatch matches for an emergency blood request.
     * Generates RequestMatch records and transitions request to DONORS_NOTIFIED if appropriate.
     *
     * @return Collection<int, RequestMatch>
     */
    public function dispatchMatchesForRequest(
        BloodRequest $request,
        float $maxRadiusKm = 35.0,
        int $limit = 15,
        bool $exactOnly = false
    ): Collection {
        $eligible = $this->findEligibleDonors($request, $maxRadiusKm, $limit, $exactOnly);

        $createdMatches = collect();

        DB::transaction(function () use ($request, $eligible, &$createdMatches) {
            foreach ($eligible as $item) {
                /** @var DonorProfile $donor */
                $donor = $item['donor'];

                $match = RequestMatch::updateOrCreate(
                    [
                        'blood_request_id' => $request->id,
                        'donor_profile_id' => $donor->id,
                    ],
                    [
                        'distance_km' => $item['distance_km'],
                        'match_score' => $item['score'],
                        'match_reason' => [
                            'exact_group' => $donor->blood_group === $request->blood_group,
                            'compatible_group' => in_array($donor->blood_group, $this->getCompatibleDonorGroups($request->blood_group), true),
                            'donor_group' => $donor->blood_group,
                            'recipient_group' => $request->blood_group,
                            'tier' => $item['tier'],
                            'distance_km' => $item['distance_km'],
                        ],
                        'notification_status' => 'SENT',
                        'notified_at' => now(),
                    ]
                );

                $createdMatches->push($match);

                try {
                    app(NotificationService::class)->notifyEligibleDonor($donor->user, $request, $match);
                } catch (\Throwable $e) {
                    report($e);
                }
            }

            // Transition request status if currently SEARCHING
            if ($createdMatches->isNotEmpty() && $request->status === 'SEARCHING') {
                $this->requestService->transitionStatus(
                    $request,
                    'DONORS_NOTIFIED',
                    null,
                    'SYSTEM',
                    "Dispatched emergency matches to {$createdMatches->count()} available donor(s)."
                );
            }
        });

        return $createdMatches;
    }

    /**
     * Record a donor's response to an emergency match.
     */
    public function recordDonorResponse(RequestMatch $match, string $response, ?string $reason = null): RequestMatch
    {
        $response = strtoupper($response);

        if (!in_array($response, ['ACCEPTED', 'DECLINED'], true)) {
            throw new InvalidArgumentException("Invalid response status: {$response}");
        }

        return DB::transaction(function () use ($match, $response, $reason) {
            $now = now();
            $donor = $match->donorProfile;
            $request = $match->bloodRequest;

            if ($response === 'ACCEPTED') {
                $match->update([
                    'response_status' => 'ACCEPTED',
                    'responded_at' => $now,
                    'accepted_at' => $now,
                ]);

                // Increment committed units on request
                $request->increment('units_committed');

                // Log acceptance event
                RequestEvent::create([
                    'blood_request_id' => $request->id,
                    'actor_user_id' => $donor->user_id,
                    'actor_type' => 'DONOR',
                    'event_type' => 'DONOR_ACCEPTED',
                    'metadata' => [
                        'donor_code' => $donor->public_donor_code,
                        'distance_km' => (float) $match->distance_km,
                        'units_committed' => $request->fresh()->units_committed,
                    ],
                    'ip_address' => request()->ip(),
                ]);

                // If blood request is in SEARCHING or DONORS_NOTIFIED, transition to DONOR_ACCEPTED
                if (in_array($request->status, ['SEARCHING', 'DONORS_NOTIFIED'], true)) {
                    $this->requestService->transitionStatus(
                        $request,
                        'DONOR_ACCEPTED',
                        $donor->user,
                        'DONOR',
                        "Donor {$donor->public_donor_code} accepted the request."
                    );
                }

                // Send notification to requester
                try {
                    app(NotificationService::class)->notifyDonorAccepted($request->requester, $request, $donor);
                } catch (\Throwable $e) {
                    report($e);
                }

                // Add donor to coordination chat
                try {
                    $chatService = app(\App\Services\ChatService::class);
                    $conversation = $chatService->getOrCreateConversation($request);
                    $chatService->addParticipant($conversation, $donor->user, 'DONOR');
                    $chatService->sendSystemNotice($conversation, "🩸 Donor {$donor->public_donor_code} stepped forward and joined coordination.");
                } catch (\Throwable $e) {
                    report($e);
                }
            } else {
                $match->update([
                    'response_status' => 'DECLINED',
                    'responded_at' => $now,
                ]);

                // Log decline event
                RequestEvent::create([
                    'blood_request_id' => $request->id,
                    'actor_user_id' => $donor->user_id,
                    'actor_type' => 'DONOR',
                    'event_type' => 'DONOR_DECLINED',
                    'metadata' => [
                        'donor_code' => $donor->public_donor_code,
                        'reason' => $reason,
                    ],
                    'ip_address' => request()->ip(),
                ]);
            }

            return $match->fresh(['bloodRequest', 'donorProfile.user']);
        });
    }

    /**
     * Calculate geodesic or regional distance between request and donor.
     */
    protected function calculateDistance(BloodRequest $request, DonorProfile $donor): float
    {
        if ($request->latitude && $request->longitude && $donor->latitude && $donor->longitude) {
            return $this->mapService->calculateDistanceKm(
                $request->latitude,
                $request->longitude,
                $donor->latitude,
                $donor->longitude
            );
        }

        // If coordinates not directly set, approximate by location relation
        if ($request->location_id && $donor->location_id) {
            if ($request->location_id === $donor->location_id) {
                return 3.0; // Same village/union/upazila
            }

            // Check if same district/division through location hierarchy
            $reqLoc = $request->location;
            $donorLoc = $donor->location;

            if ($reqLoc && $donorLoc) {
                if ($reqLoc->parent_id && $reqLoc->parent_id === $donorLoc->parent_id) {
                    return 8.0; // Same Upazila
                }
            }
        }

        return 15.0; // General regional default
    }

    /**
     * Compute composite match score (0 - 100).
     */
    protected function calculateMatchScore(BloodRequest $request, DonorProfile $donor, float $distanceKm): int
    {
        $score = 50;

        // Exact blood group bonus
        if ($donor->blood_group === $request->blood_group) {
            $score += 25;
        } else {
            $score += 10;
        }

        // Proximity bonus (closer = up to 20 pts)
        $proximityBonus = max(0, 20 - ($distanceKm * 0.8));
        $score += (int) $proximityBonus;

        // Emergency urgency bonus
        if ($request->urgency === 'EMERGENCY_NOW') {
            $score += 10;
        }

        // Verified blood group status bonus
        if ($donor->blood_group_verification_status === 'VERIFIED') {
            $score += 5;
        }

        return min(100, max(1, (int) round($score)));
    }
}
