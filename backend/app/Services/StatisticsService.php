<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

/*
   StatisticsService
   ==================
   This service contains the SQL reporting query logic for the Blood Donation System.
   Organizing queries in a dedicated service layer keeps controllers thin and adheres
   to clean architecture and the Single Responsibility Principle.
*/
class StatisticsService
{
    /* ========================================================================
       QUERY 1 — INNER JOIN
       SQL Concept: INNER JOIN
       Question: Show every donor with their full name, blood group, and details.
       
       An INNER JOIN returns rows where BOTH tables have matching records.
       Here, Donors.UserID matches users.UserID.

       Generated SQL:
       SELECT users.UserID, users.FullName, users.Email, users.Gender,
              Donors.DonorID, Donors.BloodGroup, Donors.WeightKg,
              Donors.City, Donors.IsEligible, Donors.LastDonationDate
       FROM Donors
       INNER JOIN users ON Donors.UserID = users.UserID
       ORDER BY users.FullName ASC
    ======================================================================== */
    public function getDonorProfiles(): array
    {
        $results = DB::table('Donors')
            ->join('users', 'Donors.UserID', '=', 'users.UserID') // INNER JOIN
            ->select(
                'users.UserID',
                'users.FullName',
                'users.Email',
                'users.Gender',
                'Donors.DonorID',
                'Donors.BloodGroup',
                'Donors.WeightKg',
                'Donors.City',
                'Donors.IsEligible',
                'Donors.LastDonationDate'
            )
            ->orderBy('users.FullName', 'asc')
            ->get();

        return $results->toArray();
    }


    /* ========================================================================
       QUERY 2 — LEFT JOIN + COUNT + GROUP BY
       SQL Concepts: LEFT JOIN, COUNT(), GROUP BY
       Question: Show ALL donors and how many donations each has made,
                 INCLUDING donors who have never donated (they show 0).
       
       A LEFT JOIN keeps ALL rows from the LEFT table (Donors) even if
       there is NO matching row in the RIGHT table (Donations).

       Generated SQL:
       SELECT users.FullName, Donors.DonorID, Donors.BloodGroup,
              COUNT(Donations.DonationID) AS total_donations
       FROM Donors
       LEFT JOIN Donations ON Donors.DonorID = Donations.DonorID
       INNER JOIN users ON Donors.UserID = users.UserID
       GROUP BY Donors.DonorID, users.FullName, Donors.BloodGroup
       ORDER BY total_donations DESC
    ======================================================================== */
    public function getDonorDonationCounts(): array
    {
        $results = DB::table('Donors')
            ->leftJoin('Donations', 'Donors.DonorID', '=', 'Donations.DonorID') // LEFT JOIN keeps donors with 0 donations
            ->join('users', 'Donors.UserID', '=', 'users.UserID')
            ->select(
                'Donors.DonorID',
                'users.FullName',
                'Donors.BloodGroup',
                DB::raw('COUNT(Donations.DonationID) AS total_donations') // COUNT aggregate function
            )
            ->groupBy('Donors.DonorID', 'users.FullName', 'Donors.BloodGroup') // GROUP BY to count per donor
            ->orderByDesc('total_donations')
            ->get();

        return $results->toArray();
    }


    /* ========================================================================
       QUERY 3 — AVG + GROUP BY
       SQL Concepts: AVG(), GROUP BY
       Question: Find the average donor weight for each blood group.
       
       AVG() calculates the mathematical average of a numeric column.
       GROUP BY creates separate groups so AVG is computed per blood group.

       Generated SQL:
       SELECT BloodGroup,
              ROUND(AVG(WeightKg), 2) AS average_weight,
              COUNT(*) AS donor_count
       FROM Donors
       WHERE WeightKg IS NOT NULL
       GROUP BY BloodGroup
       ORDER BY BloodGroup ASC
    ======================================================================== */
    public function getAverageWeightByBloodGroup(): array
    {
        $results = DB::table('Donors')
            ->whereNotNull('WeightKg') // only include donors with a recorded weight
            ->select(
                'BloodGroup',
                DB::raw('ROUND(AVG(WeightKg), 2) AS average_weight'), // AVG aggregate function
                DB::raw('COUNT(*) AS donor_count')
            )
            ->groupBy('BloodGroup') // GROUP BY blood group so we get one row per group
            ->orderBy('BloodGroup', 'asc')
            ->get();

        return $results->toArray();
    }
}
