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
}
