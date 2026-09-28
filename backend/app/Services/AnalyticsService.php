<?php

namespace App\Services;

use App\Models\BloodRequest;
use App\Models\Donation;
use App\Models\DonorProfile;
use App\Models\Location;
use App\Models\RequestMatch;
use App\Models\User;
use App\Models\VolunteerProfile;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    /**
     * Get high-level mission control KPIs.
     *
     * @return array<string, mixed>
     */
    public function getOverviewKPIs(string $timeRange = 'all'): array
    {
        $startDate = $this->resolveStartDate($timeRange);

        $requestQuery = BloodRequest::query();
        $donationQuery = Donation::query();

        if ($startDate) {
            $requestQuery->where('created_at', '>=', $startDate);
            $donationQuery->where('created_at', '>=', $startDate);
        }

        $totalRequests = (clone $requestQuery)->count();
        $fulfilledRequests = (clone $requestQuery)->where('status', 'FULFILLED')->count();
        $activeRequests = BloodRequest::active()->count();

        $fulfillmentRate = $totalRequests > 0
            ? round(($fulfilledRequests / $totalRequests) * 100, 1)
            : 0.0;

        $totalDonors = DonorProfile::active()->count();
        $availableDonorsCount = DonorProfile::active()->get()->filter->isAvailableNow()->count();

        $totalVolunteers = VolunteerProfile::approved()->count();
        $totalDonations = (clone $donationQuery)->confirmed()->count();
        $totalUnits = (clone $donationQuery)->confirmed()->sum('units');

        // Calculate average response SLA (portable: works on SQLite and MySQL)
        // SQLite: (julianday(responded_at) - julianday(created_at)) * 1440
        // MySQL: TIMESTAMPDIFF(MINUTE, created_at, responded_at)
        $driver = \Illuminate\Support\Facades\DB::getDriverName();
        $diffExpr = $driver === 'sqlite'
            ? '(julianday(responded_at) - julianday(created_at)) * 1440'
            : 'TIMESTAMPDIFF(MINUTE, created_at, responded_at)';

        $avgResponseMinutes = RequestMatch::where('response_status', 'ACCEPTED')
            ->whereNotNull('responded_at')
            ->selectRaw("AVG({$diffExpr}) as avg_minutes")
            ->value('avg_minutes');

        return [
            'total_requests' => $totalRequests,
            'active_requests' => $activeRequests,
            'fulfilled_requests' => $fulfilledRequests,
            'fulfillment_rate' => $fulfillmentRate,
            'total_donors' => $totalDonors,
            'available_donors' => $availableDonorsCount,
            'total_volunteers' => $totalVolunteers,
            'total_donations' => $totalDonations,
            'total_units' => $totalUnits,
            'avg_response_minutes' => $avgResponseMinutes ? round((float) $avgResponseMinutes, 1) : null,
        ];
    }

    /**
     * Get district-level shortage radar ranking districts facing highest demand vs supply pressure.
     *
     * @return array<int, array{district: string, division: string, requests: int, available_donors: int, pressure_index: float}>
     */
    public function getDistrictShortageRadar(int $limit = 10): array
    {
        $districts = Location::where('type', 'DISTRICT')->where('is_active', true)->with('parent')->get();

        $radar = [];

        foreach ($districts as $district) {
            $districtId = $district->id;

            // Requests originating in this district (or its child upazilas)
            $requestsCount = BloodRequest::active()
                ->where(function ($q) use ($districtId) {
                    $q->where('location_id', $districtId)
                      ->orWhereHas('location', fn($lq) => $lq->where('parent_id', $districtId));
                })
                ->count();

            // Available donors residing in this district (or child upazilas)
            $allDonors = DonorProfile::active()
                ->where(function ($q) use ($districtId) {
                    $q->where('location_id', $districtId)
                      ->orWhereHas('location', fn($lq) => $lq->where('parent_id', $districtId));
                })
                ->with('availabilities')
                ->get();

            $availableDonorsCount = $allDonors->filter->isAvailableNow()->count();

            // Calculate Pressure Index: (Requests * 2) - Available Donors
            $pressure = ($requestsCount * 2) - $availableDonorsCount;

            $radar[] = [
                'id' => $district->id,
                'district' => $district->name_en,
                'district_bn' => $district->name_bn,
                'division' => $district->parent ? $district->parent->name_en : 'Bangladesh',
                'requests' => $requestsCount,
                'available_donors' => $availableDonorsCount,
                'pressure_index' => max(0, $pressure),
            ];
        }

        usort($radar, fn($a, $b) => $b['pressure_index'] <=> $a['pressure_index']);

        return array_slice($radar, 0, $limit);
    }

    /**
     * Compare blood group demand vs available supply.
     *
     * @return array<string, array{group: string, requests_count: int, available_count: int, deficit_alert: bool}>
     */
    public function getBloodGroupDistribution(): array
    {
        $groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        $stats = [];

        $allAvailableDonors = DonorProfile::active()->with('availabilities')->get()->filter->isAvailableNow();

        foreach ($groups as $group) {
            $reqCount = BloodRequest::active()->where('blood_group', $group)->count();
            $availCount = $allAvailableDonors->where('blood_group', $group)->count();

            $stats[$group] = [
                'group' => $group,
                'requests_count' => $reqCount,
                'available_count' => $availCount,
                'deficit_alert' => ($reqCount > $availCount) || (str_ends_with($group, '-') && $availCount === 0),
            ];
        }

        return $stats;
    }

    /**
     * Resolve start date carbon instance from string key.
     */
    protected function resolveStartDate(string $range): ?Carbon
    {
        return match ($range) {
            'today' => now()->startOfDay(),
            '7_days' => now()->subDays(7),
            '30_days' => now()->subDays(30),
            'this_month' => now()->startOfMonth(),
            default => null,
        };
    }
}
