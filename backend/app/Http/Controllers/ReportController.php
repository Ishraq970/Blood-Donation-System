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
}
