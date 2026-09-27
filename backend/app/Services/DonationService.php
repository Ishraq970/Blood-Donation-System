<?php

namespace App\Services;

use App\Models\BloodRequest;
use App\Models\Donation;
use App\Models\DonorAvailability;
use App\Models\DonorProfile;
use App\Models\RequestEvent;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class DonationService
{
    public function __construct(
        protected NotificationService $notificationService,
        protected BloodRequestService $bloodRequestService
    ) {}

    /**
     * Record an initial donation confirmation step.
     */
    public function recordDonation(
        BloodRequest $request,
        DonorProfile $donor,
        User $actor,
        string $actorRole = 'DONOR',
        ?string $gratitudeNote = null
    ): Donation {
        return DB::transaction(function () use ($request, $donor, $actor, $actorRole, $gratitudeNote) {
            $donation = Donation::firstOrCreate(
                [
                    'blood_request_id' => $request->id,
                    'donor_profile_id' => $donor->id,
                ],
                [
                    'donated_at' => now(),
                    'component' => $request->component,
                    'units' => 1,
                    'facility_name' => $request->facility_name,
                    'status' => 'PENDING_CONFIRMATION',
                ]
            );

            return $this->confirmDonation($donation, $actor, $gratitudeNote, $actorRole);
        });
    }

    /**
     * Confirm a donation by donor, requester, or volunteer.
     */
    public function confirmDonation(
        Donation $donation,
        User $actor,
        ?string $gratitudeNote = null,
        ?string $overrideRole = null
    ): Donation {
        return DB::transaction(function () use ($donation, $actor, $gratitudeNote, $overrideRole) {
            $donor = $donation->donorProfile;
            $request = $donation->bloodRequest;

            $isDonor = ($overrideRole === 'DONOR') || ($donor->user_id === $actor->id);
            $isRequester = ($overrideRole === 'REQUESTER') || ($request->requester_id === $actor->id);
            $isVolunteerOrAdmin = ($overrideRole === 'VOLUNTEER') || $actor->isAdmin() || ($request->primary_volunteer_id === $actor->id);

            if ($isDonor) {
                $donation->donor_confirmed = true;
            }

            if ($isRequester) {
                $donation->requester_confirmed = true;
                if ($gratitudeNote) {
                    $donation->gratitude_note = trim($gratitudeNote);
                }
            }

            if ($isVolunteerOrAdmin) {
                $donation->volunteer_verified = true;
            }

            $donation->save();

            // Check if mutually confirmed (donor + requester, or donor + volunteer/admin)
            $isMutuallyConfirmed = $donation->donor_confirmed && ($donation->requester_confirmed || $donation->volunteer_verified);

            if ($isMutuallyConfirmed && $donation->status !== 'CONFIRMED') {
                $this->finalizeDonation($donation, $actor);
            }

            return $donation->fresh(['donorProfile.user', 'bloodRequest.requester']);
        });
    }

    /**
     * Finalize confirmed donation, pause donor availability, and award digital certificate.
     */
    protected function finalizeDonation(Donation $donation, User $actor): void
    {
        $donation->update(['status' => 'CONFIRMED']);

        $donor = $donation->donorProfile;
        $request = $donation->bloodRequest;

        // 1. Update donor's last donation date
        $donor->update(['last_donation_at' => $donation->donated_at->toDateString()]);

        // 2. Pause donor availability (90 days medical recovery cooldown)
        DonorAvailability::create([
            'donor_profile_id' => $donor->id,
            'status' => 'UNAVAILABLE',
            'available_from' => now(),
            'available_until' => now()->addDays(90),
            'radius_km' => $donor->preferred_radius_km,
        ]);

        // 3. Increment completed units on request
        $request->increment('units_completed');

        // 4. Record audit event
        RequestEvent::create([
            'blood_request_id' => $request->id,
            'actor_user_id' => $actor->id,
            'actor_type' => $actor->id === $donor->user_id ? 'DONOR' : ($actor->id === $request->requester_id ? 'REQUESTER' : 'VOLUNTEER'),
            'event_type' => 'DONATION_MUTUALLY_CONFIRMED',
            'metadata' => [
                'certificate_code' => $donation->certificate_code,
                'donor_code' => $donor->public_donor_code,
                'units_completed' => $request->fresh()->units_completed,
            ],
            'ip_address' => request()->ip(),
        ]);

        // 5. Advance blood request status if applicable
        if ($request->status !== 'FULFILLED') {
            if ($request->fresh()->units_completed >= $request->units_required) {
                $this->bloodRequestService->transitionStatus(
                    $request,
                    'FULFILLED',
                    $actor,
                    'SYSTEM',
                    "All {$request->units_required} unit(s) verified as successfully donated."
                );
            } elseif ($request->status === 'DONOR_ACCEPTED') {
                $this->bloodRequestService->transitionStatus(
                    $request,
                    'DONOR_CONFIRMED',
                    $actor,
                    'SYSTEM',
                    "Donation step confirmed for {$donor->public_donor_code}."
                );
            }
        }

        // 6. Push notification to donor with Certificate Link
        $this->notificationService->sendPushNotification(
            $donor->user,
            '🏅 Lifesaver Recognition Certificate Issued!',
            "Thank you for saving lives! Your Digital Recognition Certificate ({$donation->certificate_code}) is now ready.",
            [
                'type' => 'CERTIFICATE_ISSUED',
                'certificate_code' => $donation->certificate_code,
                'url' => route('certificates.show', $donation->certificate_code),
            ]
        );
    }

    /**
     * Retrieve a donation by certificate code for verification.
     */
    public function getCertificate(string $code): ?Donation
    {
        return Donation::where('certificate_code', strtoupper($code))
            ->where('status', 'CONFIRMED')
            ->with(['donorProfile.user', 'bloodRequest.location', 'bloodRequest.requester'])
            ->first();
    }
}
