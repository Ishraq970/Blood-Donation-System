<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * StatisticsService
 * ==================
 * This service executes pure Raw SQL queries demonstrating foundational DBMS concepts:
 * 1. INNER JOIN
 * 2. LEFT JOIN
 * 3. Aggregate Functions (COUNT, SUM, AVG, MIN, MAX)
 * 4. GROUP BY and HAVING clauses
 * 5. Scalar and Correlated Subqueries
 * 6. Database Views and Stored Procedures
 */
class StatisticsService
{
    private function hasLegacyTables(): bool
    {
        return Schema::hasTable('Donors');
    }

    /* ------------------------------------------------------------------------
       QUERY 1 — INNER JOIN
       Show donors joined with their personal user account details
       ------------------------------------------------------------------------ */
    public function getDonorProfiles(): array
    {
        if ($this->hasLegacyTables()) {
            $rawSql = "
                SELECT 
                    u.UserID,
                    u.FullName,
                    u.Email,
                    u.Gender,
                    d.DonorID,
                    d.BloodGroup,
                    d.WeightKg,
                    d.City,
                    d.IsEligible,
                    d.LastDonationDate
                FROM Donors d
                INNER JOIN users u ON d.UserID = u.UserID
                ORDER BY u.FullName ASC
            ";
            return DB::select($rawSql);
        }

        $rawSql = "
            SELECT 
                u.id AS UserID,
                u.name AS FullName,
                u.email AS Email,
                dp.public_donor_code AS DonorCode,
                dp.blood_group AS BloodGroup,
                dp.preferred_radius_km AS RadiusKm,
                dp.profile_status AS Status,
                dp.last_donation_at AS LastDonationDate
            FROM donor_profiles dp
            INNER JOIN users u ON dp.user_id = u.id
            ORDER BY u.name ASC
        ";
        return DB::select($rawSql);
    }

    /* ------------------------------------------------------------------------
       QUERY 2 — LEFT JOIN + COUNT + GROUP BY
       Count total donations per donor (including donors with 0 donations)
       ------------------------------------------------------------------------ */
    public function getDonorDonationCounts(): array
    {
        if ($this->hasLegacyTables()) {
            $rawSql = "
                SELECT 
                    d.DonorID,
                    u.FullName,
                    d.BloodGroup,
                    COUNT(dn.DonationID) AS total_donations
                FROM Donors d
                INNER JOIN users u ON d.UserID = u.UserID
                LEFT JOIN Donations dn ON d.DonorID = dn.DonorID
                GROUP BY d.DonorID, u.FullName, d.BloodGroup
                ORDER BY total_donations DESC
            ";
            return DB::select($rawSql);
        }

        $rawSql = "
            SELECT 
                dp.id AS DonorID,
                u.name AS FullName,
                dp.blood_group AS BloodGroup,
                COUNT(d.id) AS total_donations
            FROM donor_profiles dp
            INNER JOIN users u ON dp.user_id = u.id
            LEFT JOIN donations d ON dp.id = d.donor_profile_id
            GROUP BY dp.id, u.name, dp.blood_group
            ORDER BY total_donations DESC
        ";
        return DB::select($rawSql);
    }

    /* ------------------------------------------------------------------------
       QUERY 3 — AVG + GROUP BY
       Calculate average radius coverage / weight per blood group
       ------------------------------------------------------------------------ */
    public function getAverageWeightByBloodGroup(): array
    {
        if ($this->hasLegacyTables()) {
            $rawSql = "
                SELECT 
                    BloodGroup,
                    ROUND(AVG(WeightKg), 2) AS average_weight,
                    COUNT(*) AS donor_count
                FROM Donors
                WHERE WeightKg IS NOT NULL
                GROUP BY BloodGroup
                ORDER BY BloodGroup ASC
            ";
            return DB::select($rawSql);
        }

        $rawSql = "
            SELECT 
                blood_group AS BloodGroup,
                ROUND(AVG(preferred_radius_km), 2) AS average_radius_km,
                COUNT(*) AS donor_count
            FROM donor_profiles
            GROUP BY blood_group
            ORDER BY blood_group ASC
        ";
        return DB::select($rawSql);
    }

    /* ------------------------------------------------------------------------
       QUERY 4 — JOIN + COUNT + GROUP BY + HAVING
       Filter frequent donors who have completed at least N donations
       ------------------------------------------------------------------------ */
    public function getFrequentDonors(int $minimumDonations = 1): array
    {
        if ($this->hasLegacyTables()) {
            $rawSql = "
                SELECT 
                    d.DonorID,
                    u.FullName,
                    d.BloodGroup,
                    COUNT(dn.DonationID) AS total_donations
                FROM Donors d
                INNER JOIN Donations dn ON d.DonorID = dn.DonorID
                INNER JOIN users u ON d.UserID = u.UserID
                GROUP BY d.DonorID, u.FullName, d.BloodGroup
                HAVING COUNT(dn.DonationID) >= ?
                ORDER BY total_donations DESC
            ";
            return DB::select($rawSql, [$minimumDonations]);
        }

        $rawSql = "
            SELECT 
                dp.id AS DonorID,
                u.name AS FullName,
                dp.blood_group AS BloodGroup,
                COUNT(d.id) AS total_donations
            FROM donor_profiles dp
            INNER JOIN donations d ON dp.id = d.donor_profile_id
            INNER JOIN users u ON dp.user_id = u.id
            GROUP BY dp.id, u.name, dp.blood_group
            HAVING COUNT(d.id) >= ?
            ORDER BY total_donations DESC
        ";
        return DB::select($rawSql, [$minimumDonations]);
    }

    /* ------------------------------------------------------------------------
       QUERY 5 — JOIN + SUM + GROUP BY
       Total volume/units collected by each medical facility / blood bank
       ------------------------------------------------------------------------ */
    public function getBloodBankVolumeStatistics(): array
    {
        if ($this->hasLegacyTables() && Schema::hasTable('BloodBanks')) {
            $rawSql = "
                SELECT 
                    bb.BankID,
                    bb.BankName,
                    bb.City,
                    COALESCE(SUM(dn.VolumeCollectedML), 0) AS total_volume_ml,
                    COUNT(dn.DonationID) AS total_donations
                FROM BloodBanks bb
                LEFT JOIN Donations dn ON bb.BankID = dn.BankID
                GROUP BY bb.BankID, bb.BankName, bb.City
                ORDER BY total_volume_ml DESC
            ";
            return DB::select($rawSql);
        }

        $rawSql = "
            SELECT 
                facility_name AS BankName,
                COALESCE(SUM(units), 0) AS total_units,
                COUNT(id) AS total_donations
            FROM donations
            WHERE facility_name IS NOT NULL
            GROUP BY facility_name
            ORDER BY total_units DESC
        ";
        return DB::select($rawSql);
    }

    /* ------------------------------------------------------------------------
       QUERY 6 — SCALAR SUBQUERY IN WHERE CLAUSE
       Find donors whose coverage radius/weight is strictly above global average
       ------------------------------------------------------------------------ */
    public function getDonorsAboveAverageWeight(): array
    {
        if ($this->hasLegacyTables()) {
            $rawSql = "
                SELECT 
                    d.DonorID,
                    u.FullName,
                    d.BloodGroup,
                    d.WeightKg
                FROM Donors d
                INNER JOIN users u ON d.UserID = u.UserID
                WHERE d.WeightKg > (SELECT AVG(WeightKg) FROM Donors WHERE WeightKg IS NOT NULL)
                ORDER BY d.WeightKg DESC
            ";
            return DB::select($rawSql);
        }

        $rawSql = "
            SELECT 
                dp.id AS DonorID,
                u.name AS FullName,
                dp.blood_group AS BloodGroup,
                dp.preferred_radius_km AS RadiusKm
            FROM donor_profiles dp
            INNER JOIN users u ON dp.user_id = u.id
            WHERE dp.preferred_radius_km > (
                SELECT AVG(preferred_radius_km) FROM donor_profiles
            )
            ORDER BY dp.preferred_radius_km DESC
        ";
        return DB::select($rawSql);
    }

    /* ------------------------------------------------------------------------
       QUERY 7 — CORRELATED SUBQUERY
       Find donors whose metric is above their OWN blood group's average
       ------------------------------------------------------------------------ */
    public function getDonorsAboveBloodGroupAverageWeight(): array
    {
        if ($this->hasLegacyTables()) {
            $rawSql = "
                SELECT 
                    d.DonorID,
                    u.FullName,
                    d.BloodGroup,
                    d.WeightKg
                FROM Donors d
                INNER JOIN users u ON d.UserID = u.UserID
                WHERE d.WeightKg >= (
                    SELECT AVG(d2.WeightKg)
                    FROM Donors d2
                    WHERE d2.BloodGroup = d.BloodGroup
                      AND d2.WeightKg IS NOT NULL
                )
                ORDER BY d.BloodGroup ASC, d.WeightKg DESC
            ";
            return DB::select($rawSql);
        }

        $rawSql = "
            SELECT 
                d.id AS DonorID,
                u.name AS FullName,
                d.blood_group AS BloodGroup,
                d.preferred_radius_km AS RadiusKm
            FROM donor_profiles d
            INNER JOIN users u ON d.user_id = u.id
            WHERE d.preferred_radius_km >= (
                SELECT AVG(d2.preferred_radius_km)
                FROM donor_profiles d2
                WHERE d2.blood_group = d.blood_group
            )
            ORDER BY d.blood_group ASC, d.preferred_radius_km DESC
        ";
        return DB::select($rawSql);
    }

    /* ------------------------------------------------------------------------
       QUERY 8 — HAVING + SUBQUERY IN FROM CLAUSE
       Donors whose total donations exceed the average donation count of all donors
       ------------------------------------------------------------------------ */
    public function getDonorsAboveAverageDonationCount(): array
    {
        if ($this->hasLegacyTables()) {
            $rawSql = "
                SELECT 
                    d.DonorID,
                    u.FullName,
                    d.BloodGroup,
                    COUNT(dn.DonationID) AS total_donations
                FROM Donors d
                INNER JOIN Donations dn ON d.DonorID = dn.DonorID
                INNER JOIN users u ON d.UserID = u.UserID
                GROUP BY d.DonorID, u.FullName, d.BloodGroup
                HAVING COUNT(dn.DonationID) >= (
                    SELECT AVG(donation_count) FROM (
                        SELECT COUNT(DonationID) AS donation_count
                        FROM Donations
                        GROUP BY DonorID
                    ) AS donation_averages
                )
                ORDER BY total_donations DESC
            ";
            return DB::select($rawSql);
        }

        $rawSql = "
            SELECT 
                dp.id AS DonorID,
                u.name AS FullName,
                dp.blood_group AS BloodGroup,
                COUNT(d.id) AS total_donations
            FROM donor_profiles dp
            INNER JOIN donations d ON dp.id = d.donor_profile_id
            INNER JOIN users u ON dp.user_id = u.id
            GROUP BY dp.id, u.name, dp.blood_group
            HAVING COUNT(d.id) >= (
                SELECT COALESCE(AVG(sub.cnt), 1)
                FROM (
                    SELECT COUNT(id) AS cnt
                    FROM donations
                    GROUP BY donor_profile_id
                ) AS sub
            )
            ORDER BY total_donations DESC
        ";
        return DB::select($rawSql);
    }

    /* ------------------------------------------------------------------------
       QUERY 9 — DONATION COUNTS & UNITS BY FACILITY
       ------------------------------------------------------------------------ */
    public function getBloodBankDonationStatistics(): array
    {
        if ($this->hasLegacyTables() && Schema::hasTable('BloodBanks')) {
            $rawSql = "
                SELECT 
                    bb.BankID,
                    bb.BankName,
                    bb.City,
                    COUNT(dn.DonationID) AS total_donations
                FROM BloodBanks bb
                LEFT JOIN Donations dn ON bb.BankID = dn.BankID
                GROUP BY bb.BankID, bb.BankName, bb.City
                ORDER BY total_donations DESC
            ";
            return DB::select($rawSql);
        }

        $rawSql = "
            SELECT 
                facility_name AS BankName,
                COUNT(id) AS total_donations,
                SUM(units) AS total_units
            FROM donations
            WHERE facility_name IS NOT NULL
            GROUP BY facility_name
            ORDER BY total_donations DESC
        ";
        return DB::select($rawSql);
    }

    /* ------------------------------------------------------------------------
       QUERY 10 — HAVING CLAUSE WITH AGGREGATE SUBQUERY
       Facilities having donation counts above the facility average
       ------------------------------------------------------------------------ */
    public function getBanksAboveAverageDonations(): array
    {
        if ($this->hasLegacyTables() && Schema::hasTable('BloodBanks')) {
            $rawSql = "
                SELECT 
                    bb.BankID,
                    bb.BankName,
                    bb.City,
                    COUNT(dn.DonationID) AS total_donations
                FROM BloodBanks bb
                LEFT JOIN Donations dn ON bb.BankID = dn.BankID
                GROUP BY bb.BankID, bb.BankName, bb.City
                HAVING COUNT(dn.DonationID) >= (
                    SELECT AVG(donation_count) FROM (
                        SELECT COUNT(DonationID) AS donation_count
                        FROM Donations GROUP BY BankID
                    ) AS bank_averages
                )
                ORDER BY total_donations DESC
            ";
            return DB::select($rawSql);
        }

        $rawSql = "
            SELECT 
                facility_name AS BankName,
                COUNT(id) AS total_donations
            FROM donations
            WHERE facility_name IS NOT NULL
            GROUP BY facility_name
            HAVING COUNT(id) >= (
                SELECT COALESCE(AVG(sub.cnt), 1) FROM (
                    SELECT COUNT(id) AS cnt
                    FROM donations
                    GROUP BY facility_name
                ) AS sub
            )
            ORDER BY total_donations DESC
        ";
        return DB::select($rawSql);
    }

    /* ------------------------------------------------------------------------
       QUERY 11 — RECIPIENT / REQUESTER STATISTICS (LEFT JOIN + SUM + GROUP BY)
       ------------------------------------------------------------------------ */
    public function getRecipientRequestStatistics(): array
    {
        if ($this->hasLegacyTables() && Schema::hasTable('Recipients')) {
            $rawSql = "
                SELECT 
                    r.RecipientID,
                    u.FullName,
                    r.BloodGroup,
                    COUNT(br.RequestID) AS total_requests,
                    COALESCE(SUM(br.QuantityUnits), 0) AS total_units_requested
                FROM Recipients r
                INNER JOIN users u ON r.UserID = u.UserID
                LEFT JOIN BloodRequests br ON r.RecipientID = br.RecipientID
                GROUP BY r.RecipientID, u.FullName, r.BloodGroup
                ORDER BY total_units_requested DESC
            ";
            return DB::select($rawSql);
        }

        $rawSql = "
            SELECT 
                u.id AS RecipientID,
                u.name AS FullName,
                u.email AS Email,
                COUNT(br.id) AS total_requests,
                COALESCE(SUM(br.units_required), 0) AS total_units_requested
            FROM users u
            LEFT JOIN blood_requests br ON u.id = br.requester_id
            GROUP BY u.id, u.name, u.email
            ORDER BY total_units_requested DESC
        ";
        return DB::select($rawSql);
    }

    /* ------------------------------------------------------------------------
       QUERY 12 — ABOVE-AVERAGE BLOOD REQUESTS (SUBQUERY IN WHERE)
       ------------------------------------------------------------------------ */
    public function getAboveAverageBloodRequests(): array
    {
        if ($this->hasLegacyTables() && Schema::hasTable('BloodRequests')) {
            $rawSql = "
                SELECT 
                    br.RequestID,
                    u.FullName,
                    br.BloodGroup,
                    br.QuantityUnits,
                    br.UrgencyLevel,
                    br.RequestStatus
                FROM BloodRequests br
                INNER JOIN Recipients r ON br.RecipientID = r.RecipientID
                INNER JOIN users u ON r.UserID = u.UserID
                WHERE br.QuantityUnits > (SELECT AVG(QuantityUnits) FROM BloodRequests)
                ORDER BY br.QuantityUnits DESC
            ";
            return DB::select($rawSql);
        }

        $rawSql = "
            SELECT 
                br.id AS RequestID,
                br.request_code AS TrackingCode,
                u.name AS FullName,
                br.blood_group AS BloodGroup,
                br.units_required AS QuantityUnits,
                br.urgency AS UrgencyLevel,
                br.status AS RequestStatus
            FROM blood_requests br
            INNER JOIN users u ON br.requester_id = u.id
            WHERE br.units_required >= (
                SELECT AVG(units_required) FROM blood_requests
            )
            ORDER BY br.units_required DESC
        ";
        return DB::select($rawSql);
    }

    /* ------------------------------------------------------------------------
       BONUS — MIN, MAX, AVG RANGE SUMMARY
       ------------------------------------------------------------------------ */
    public function getWeightRangeByBloodGroup(): array
    {
        if ($this->hasLegacyTables()) {
            $rawSql = "
                SELECT 
                    BloodGroup,
                    MIN(WeightKg) AS min_weight,
                    MAX(WeightKg) AS max_weight,
                    AVG(WeightKg) AS avg_weight,
                    COUNT(*) AS donor_count
                FROM Donors
                WHERE WeightKg IS NOT NULL
                GROUP BY BloodGroup
                ORDER BY BloodGroup ASC
            ";
            return DB::select($rawSql);
        }

        $rawSql = "
            SELECT 
                blood_group AS BloodGroup,
                MIN(preferred_radius_km) AS min_radius_km,
                MAX(preferred_radius_km) AS max_radius_km,
                ROUND(AVG(preferred_radius_km), 2) AS avg_radius_km,
                COUNT(*) AS donor_count
            FROM donor_profiles
            GROUP BY blood_group
            ORDER BY blood_group ASC
        ";
        return DB::select($rawSql);
    }

    /* ========================================================================
       DATABASE OBJECTS DEMONSTRATION: VIEWS AND STORED PROCEDURES
       ======================================================================== */

    /**
     * Executes Stored Procedure: sp_get_eligible_donors_by_group
     * Accepts blood group (e.g. 'O+') and location name (e.g. 'Dhaka' or '' for all).
     */
    public function callEligibleDonorsProcedure(string $bloodGroup = 'O+', string $location = ''): array
    {
        return DB::select("CALL sp_get_eligible_donors_by_group(?, ?)", [$bloodGroup, $location]);
    }

    /**
     * Queries Database View: vw_donor_master_summary
     */
    public function getMasterDonorSummaryView(): array
    {
        return DB::select("SELECT * FROM vw_donor_master_summary ORDER BY total_donations_completed DESC LIMIT 20");
    }

    /**
     * Queries Database View: vw_emergency_request_board
     */
    public function getEmergencyRequestBoardView(): array
    {
        return DB::select("SELECT * FROM vw_emergency_request_board ORDER BY created_at DESC LIMIT 20");
    }

    /**
     * Queries Database View: vw_hospital_donation_stats
     */
    public function getHospitalDonationStatsView(): array
    {
        return DB::select("SELECT * FROM vw_hospital_donation_stats ORDER BY total_donations DESC");
    }
}
