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
}
