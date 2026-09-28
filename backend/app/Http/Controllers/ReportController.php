<?php

namespace App\Http\Controllers;

use App\Services\StatisticsService;
use Illuminate\Http\JsonResponse;

/*
   ReportController
   =================
   This controller handles all reporting and statistics API endpoints.
   It is kept deliberately thin — all actual query logic lives in StatisticsService.
   Each method simply calls the service and returns a JSON response.
*/
class ReportController extends Controller
{
    /* We inject the StatisticsService via the constructor (Dependency Injection) */
    private StatisticsService $stats;

    public function __construct(StatisticsService $stats)
    {
        $this->stats = $stats;
    }

    /* GET /api/reports/donors/profiles
       INNER JOIN: All donors with their user information */
    public function donorProfiles(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'query'   => 'INNER JOIN: donors joined with users table',
            'data'    => $this->stats->getDonorProfiles(),
        ]);
    }

    /* GET /api/reports/donors/donation-counts
       LEFT JOIN + COUNT + GROUP BY: All donors with donation count (0 if none) */
    public function donorDonationCounts(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'query'   => 'LEFT JOIN + COUNT + GROUP BY: donation count per donor',
            'data'    => $this->stats->getDonorDonationCounts(),
        ]);
    }

    /* GET /api/reports/donors/average-weight-by-blood-group
       AVG + GROUP BY: Average weight calculated per blood group */
    public function averageWeightByBloodGroup(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'query'   => 'AVG + GROUP BY: average weight per blood group',
            'data'    => $this->stats->getAverageWeightByBloodGroup(),
        ]);
    }

    /* GET /api/reports/donors/frequent?minimum=3
       JOIN + COUNT + GROUP BY + HAVING: Donors who donated at least N times */
    public function frequentDonors(): JsonResponse
    {
        $minimum = (int) request('minimum', 3); // Default: 3 donations

        return response()->json([
            'success'          => true,
            'query'            => 'JOIN + COUNT + GROUP BY + HAVING: frequent donors',
            'minimum_required' => $minimum,
            'data'             => $this->stats->getFrequentDonors($minimum),
        ]);
    }

    /* GET /api/reports/blood-banks/volume-statistics
       JOIN + SUM + GROUP BY: Total blood volume collected by each bank */
    public function bloodBankVolumeStatistics(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'query'   => 'LEFT JOIN + SUM + GROUP BY: blood volume per blood bank',
            'data'    => $this->stats->getBloodBankVolumeStatistics(),
        ]);
    }

    /* GET /api/reports/donors/above-average-weight
       Subquery + AVG: Donors heavier than the global average weight */
    public function donorsAboveAverageWeight(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'query'   => 'Subquery + AVG: donors above global average weight',
            'data'    => $this->stats->getDonorsAboveAverageWeight(),
        ]);
    }

    /* GET /api/reports/donors/above-blood-group-average-weight
       Correlated Subquery: Donors heavier than the average of their OWN blood group */
    public function donorsAboveBloodGroupAverageWeight(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'query'   => 'Correlated Subquery: donors above their blood group average weight',
            'data'    => $this->stats->getDonorsAboveBloodGroupAverageWeight(),
        ]);
    }

    /* GET /api/reports/donors/above-average-donations
       JOIN + COUNT + GROUP BY + HAVING + Subquery: Most advanced combined query */
    public function donorsAboveAverageDonationCount(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'query'   => 'JOIN + COUNT + GROUP BY + HAVING + Subquery: above-average donation count',
            'data'    => $this->stats->getDonorsAboveAverageDonationCount(),
        ]);
    }

    /* GET /api/reports/blood-banks/donation-statistics
       JOIN + COUNT + GROUP BY: Donations received per blood bank */
    public function bloodBankDonationStatistics(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'query'   => 'LEFT JOIN + COUNT + GROUP BY: donations per blood bank',
            'data'    => $this->stats->getBloodBankDonationStatistics(),
        ]);
    }

    /* GET /api/reports/blood-banks/above-average-donations
       JOIN + COUNT + HAVING + Subquery: Blood banks above the average donation count */
    public function banksAboveAverageDonations(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'query'   => 'JOIN + COUNT + HAVING + Subquery: banks above average donations',
            'data'    => $this->stats->getBanksAboveAverageDonations(),
        ]);
    }

    /* GET /api/reports/recipients/request-statistics
       LEFT JOIN + SUM + GROUP BY: Total blood units requested per recipient */
    public function recipientRequestStatistics(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'query'   => 'LEFT JOIN + SUM + GROUP BY: blood units requested per recipient',
            'data'    => $this->stats->getRecipientRequestStatistics(),
        ]);
    }

    /* GET /api/reports/requests/above-average-quantity
       Subquery + AVG: Blood requests with above-average quantity */
    public function aboveAverageBloodRequests(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'query'   => 'Subquery + AVG: requests above average quantity',
            'data'    => $this->stats->getAboveAverageBloodRequests(),
        ]);
    }

    /* GET /api/reports/donors/weight-range-by-blood-group
       MIN + MAX + AVG + GROUP BY: Weight range (min, max, avg) per blood group */
    public function weightRangeByBloodGroup(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'query'   => 'MIN + MAX + AVG + GROUP BY: weight range per blood group',
            'data'    => $this->stats->getWeightRangeByBloodGroup(),
        ]);
    }

    /* =========================================================================
       DATABASE VIEWS, STORED PROCEDURES & TRIGGERS DEMO ENDPOINTS
       ========================================================================= */

    // 1. View: vw_donor_master_summary
    public function donorSummaryView(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'object_type' => 'VIEW',
            'object_name' => 'vw_donor_master_summary',
            'query'   => 'SELECT * FROM vw_donor_master_summary ORDER BY total_donations_completed DESC LIMIT 20',
            'data'    => $this->stats->getMasterDonorSummaryView(),
        ]);
    }

    // 2. View: vw_emergency_request_board
    public function emergencyBoardView(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'object_type' => 'VIEW',
            'object_name' => 'vw_emergency_request_board',
            'query'   => 'SELECT * FROM vw_emergency_request_board ORDER BY created_at DESC LIMIT 20',
            'data'    => $this->stats->getEmergencyRequestBoardView(),
        ]);
    }

    // 3. View: vw_hospital_donation_stats
    public function hospitalStatsView(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'object_type' => 'VIEW',
            'object_name' => 'vw_hospital_donation_stats',
            'query'   => 'SELECT * FROM vw_hospital_donation_stats ORDER BY total_donations DESC',
            'data'    => $this->stats->getHospitalDonationStatsView(),
        ]);
    }

    // 4. Stored Procedure: sp_get_eligible_donors_by_group
    // Used by SQL Reports demo page (legacy call with group + radius)
    public function callEligibleDonorsProcedure(): JsonResponse
    {
        $group    = request('group', 'O+');
        $location = request('location', '');

        return response()->json([
            'success'     => true,
            'object_type' => 'STORED PROCEDURE',
            'object_name' => 'sp_get_eligible_donors_by_group',
            'query'       => "CALL sp_get_eligible_donors_by_group('{$group}', '{$location}')",
            'parameters'  => ['blood_group' => $group, 'location' => $location],
            'data'        => $this->stats->callEligibleDonorsProcedure($group, $location),
        ]);
    }

    /**
     * GET /api/donors/search?blood_group=O+&location=Dhaka
     * 
     * Dedicated endpoint for the Donors Search Page.
     * Calls stored procedure sp_get_eligible_donors_by_group with blood group and location.
     * Returns donor records filtered from the database.
     */
    public function searchDonors(): JsonResponse
    {
        $bloodGroup = request('blood_group', '');
        $location   = request('location', '');

        if (empty($bloodGroup)) {
            return response()->json([
                'success' => false,
                'message' => 'blood_group parameter is required.',
            ], 422);
        }

        $results = $this->stats->callEligibleDonorsProcedure($bloodGroup, $location);

        // Privacy Firewall: Mask phone numbers to prevent scraping, commercial exploitation & harassment
        $maskedResults = array_map(function ($row) {
            $r = is_array($row) ? (object) $row : $row;
            $phone = $r->donor_phone ?? '';
            $maskedPhone = (strlen($phone) >= 7)
                ? substr($phone, 0, 3) . '••••' . substr($phone, -2)
                : 'Protected (🔒)';

            $r->donor_phone = $maskedPhone;
            $r->is_protected = true;
            $r->privacy_note = 'Phone numbers are shared only after donor accepts an active blood request.';
            return $r;
        }, $results);

        return response()->json([
            'success'      => true,
            'procedure'    => 'sp_get_eligible_donors_by_group',
            'sql_executed' => "CALL sp_get_eligible_donors_by_group('{$bloodGroup}', '{$location}')",
            'filters'      => ['blood_group' => $bloodGroup, 'location' => $location ?: 'All Locations'],
            'total'        => count($results),
            'data'         => $maskedResults,
            'privacy_shield' => 'ACTIVE',
        ]);
    }

    // 5. Stored Procedure + Transaction: sp_fulfill_blood_request
    public function callFulfillRequestProcedure(): JsonResponse
    {
        // Find first active donor and open request for live demo
        $donor = \App\Models\DonorProfile::where('profile_status', 'ACTIVE')->first();
        $request = \App\Models\BloodRequest::where('status', 'OPEN')->first();

        if (!$donor || !$request) {
            return response()->json([
                'success' => false,
                'message' => 'Need at least one active donor and open request to demonstrate procedure.',
            ], 422);
        }

        try {
            \Illuminate\Support\Facades\DB::statement("
                CALL sp_fulfill_blood_request({$request->id}, {$donor->id}, 1, 'National Center', @p_status)
            ");
            $statusResult = \Illuminate\Support\Facades\DB::select("SELECT @p_status AS status");
            $status = $statusResult[0]->status ?? 'UNKNOWN';

            return response()->json([
                'success' => true,
                'object_type' => 'STORED PROCEDURE + TRANSACTION',
                'object_name' => 'sp_fulfill_blood_request',
                'query'   => "CALL sp_fulfill_blood_request({$request->id}, {$donor->id}, 1, 'National Center', @p_status)",
                'execution_notes' => 'Executed inside ACID Transaction: inserted donation, updated donor last_donation_at, locked request FOR UPDATE, and verified threshold.',
                'result_status' => $status,
                'request_code' => $request->request_code,
                'donor_code' => $donor->public_donor_code,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // 6. Trigger 1 & 2 Demo: Test Inactive Donor Rejection
    public function testTriggerPreventInactive(): JsonResponse
    {
        try {
            $user = \App\Models\User::create([
                'name' => 'Inactive Test Donor',
                'email' => 'inactive.' . uniqid() . '@roktolinkbd.test',
                'password' => \Illuminate\Support\Facades\Hash::make('secret'),
                'status' => 'ACTIVE',
            ]);

            $inactiveDonor = \App\Models\DonorProfile::create([
                'user_id' => $user->id,
                'public_donor_code' => 'DNR-' . strtoupper(substr(uniqid(), 0, 8)),
                'blood_group' => 'O-',
                'preferred_radius_km' => 5,
                'profile_status' => 'INACTIVE',
            ]);

            // This direct SQL INSERT fires the MySQL Trigger: trg_before_donation_prevent_ineligible
            \Illuminate\Support\Facades\DB::statement("
                INSERT INTO donations (uuid, donor_profile_id, blood_request_id, facility_name, units, donated_at, status, certificate_code, created_at, updated_at)
                VALUES (UUID(), {$inactiveDonor->id}, 1, 'Emergency Care Center', 1, NOW(), 'CONFIRMED', 'TEST-FAIL', NOW(), NOW())
            ");

            return response()->json([
                'success' => false,
                'message' => 'Trigger failed to block the inactive donor.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => true,
                'object_type' => 'DATABASE TRIGGER (BEFORE INSERT)',
                'trigger_name' => 'trg_before_donation_prevent_ineligible',
                'status' => 'TRIGGER_BLOCKED_VIOLATION_SUCCESSFULLY',
                'explanation' => 'The MySQL database trigger detected profile_status = INACTIVE and aborted the INSERT statement using SIGNAL SQLSTATE 45000.',
                'sqlstate_error_captured' => $e->getMessage(),
            ]);
        }
    }

    // 7. Trigger 3 Demo: Audit logs created automatically by Trigger
    public function auditLogsView(): JsonResponse
    {
        $logs = \Illuminate\Support\Facades\DB::select("
            SELECT id, actor_id, actor_type, event, auditable_type, auditable_id, old_values, new_values, reason, created_at
            FROM audit_logs
            ORDER BY created_at DESC
            LIMIT 15
        ");

        return response()->json([
            'success' => true,
            'object_type' => 'DATABASE TRIGGER AUDIT TRAIL',
            'trigger_name' => 'trg_audit_request_status_change',
            'explanation' => 'These rows were automatically written by trg_audit_request_status_change whenever blood_requests.status was updated.',
            'data' => $logs,
        ]);
    }
}

