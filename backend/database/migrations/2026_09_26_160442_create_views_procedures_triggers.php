<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // -------------------------------------------------------------
        // 1. DATABASE VIEWS
        // -------------------------------------------------------------

        // View 1: Master Donor Summary (joins users, profiles & aggregates donations)
        DB::statement("DROP VIEW IF EXISTS vw_donor_master_summary;");
        DB::statement("
            CREATE VIEW vw_donor_master_summary AS
            SELECT 
                dp.id AS donor_id,
                dp.public_donor_code,
                u.name AS donor_name,
                u.email AS donor_email,
                u.phone AS donor_phone,
                dp.blood_group,
                dp.preferred_radius_km,
                dp.profile_status,
                dp.last_donation_at,
                COUNT(d.id) AS total_donations_completed,
                COALESCE(SUM(d.units), 0) AS total_units_donated
            FROM donor_profiles dp
            JOIN users u ON dp.user_id = u.id
            LEFT JOIN donations d ON dp.id = d.donor_profile_id
            GROUP BY dp.id, dp.public_donor_code, u.name, u.email, u.phone, 
                     dp.blood_group, dp.preferred_radius_km, dp.profile_status, dp.last_donation_at;
        ");

        // View 2: Emergency Request Board (priority tracking & fulfillment progress)
        DB::statement("DROP VIEW IF EXISTS vw_emergency_request_board;");
        DB::statement("
            CREATE VIEW vw_emergency_request_board AS
            SELECT 
                br.id AS request_id,
                br.request_code,
                u.name AS requester_name,
                br.blood_group,
                br.component,
                br.units_required,
                br.units_completed,
                (br.units_required - br.units_completed) AS units_remaining,
                br.urgency,
                br.status,
                br.facility_name,
                br.created_at
            FROM blood_requests br
            JOIN users u ON br.requester_id = u.id;
        ");

        // View 3: Hospital & Collection Facility Statistics
        DB::statement("DROP VIEW IF EXISTS vw_hospital_donation_stats;");
        DB::statement("
            CREATE VIEW vw_hospital_donation_stats AS
            SELECT 
                d.facility_name,
                COUNT(d.id) AS total_donations,
                COALESCE(SUM(d.units), 0) AS total_units_collected,
                MIN(d.donated_at) AS first_donation_date,
                MAX(d.donated_at) AS latest_donation_date
            FROM donations d
            WHERE d.facility_name IS NOT NULL
            GROUP BY d.facility_name;
        ");

        // -------------------------------------------------------------
        // 2. STORED PROCEDURES
        // -------------------------------------------------------------

        // Procedure 1: Find eligible donors by blood group AND location name
        // Updated to accept p_location (e.g. 'Dhaka') matched against locations.name_en
        DB::statement("DROP PROCEDURE IF EXISTS sp_get_eligible_donors_by_group;");
        DB::statement("
            CREATE PROCEDURE sp_get_eligible_donors_by_group(
                IN p_blood_group VARCHAR(10),
                IN p_location    VARCHAR(150)
            )
            BEGIN
                SELECT 
                    dp.id                  AS donor_id,
                    u.name                 AS donor_name,
                    u.phone                AS donor_phone,
                    u.email                AS donor_email,
                    dp.blood_group,
                    dp.profile_status,
                    dp.preferred_radius_km,
                    dp.last_donation_at,
                    dp.landmark,
                    dp.public_donor_code,
                    COALESCE(loc.name_en, 'Location not set') AS location_name
                FROM donor_profiles dp
                JOIN users u ON dp.user_id = u.id
                LEFT JOIN locations loc ON dp.location_id = loc.id
                WHERE dp.blood_group    = p_blood_group
                  AND dp.profile_status = 'ACTIVE'
                  AND (dp.last_donation_at IS NULL OR dp.last_donation_at <= DATE_SUB(NOW(), INTERVAL 90 DAY))
                  AND (
                      p_location = '' 
                      OR p_location IS NULL
                      OR loc.name_en LIKE CONCAT('%', p_location, '%')
                  )
                ORDER BY dp.last_donation_at ASC
                LIMIT 50;
            END
        ");

        // Procedure 2: Fulfill blood request with Transaction (START TRANSACTION, COMMIT, ROLLBACK)
        DB::statement("DROP PROCEDURE IF EXISTS sp_fulfill_blood_request;");
        DB::statement("
            CREATE PROCEDURE sp_fulfill_blood_request(
                IN p_request_id BIGINT,
                IN p_donor_id BIGINT,
                IN p_units INT,
                IN p_facility VARCHAR(150),
                OUT p_status VARCHAR(50)
            )
            BEGIN
                DECLARE v_req_units INT DEFAULT 0;
                DECLARE v_cur_units INT DEFAULT 0;
                DECLARE EXIT HANDLER FOR SQLEXCEPTION
                BEGIN
                    ROLLBACK;
                    SET p_status = 'ERROR_ROLLBACK';
                END;

                START TRANSACTION;

                -- Step 1: Record the donation
                INSERT INTO donations (
                    uuid,
                    donor_profile_id,
                    blood_request_id,
                    facility_name,
                    units,
                    donated_at,
                    status,
                    certificate_code,
                    created_at,
                    updated_at
                ) VALUES (
                    UUID(),
                    p_donor_id,
                    p_request_id,
                    p_facility,
                    p_units,
                    NOW(),
                    'CONFIRMED',
                    CONCAT('CERT-', UPPER(SUBSTRING(MD5(UUID()), 1, 8))),
                    NOW(),
                    NOW()
                );

                -- Step 2: Update donor profile last donation date
                UPDATE donor_profiles
                SET last_donation_at = NOW(),
                    updated_at = NOW()
                WHERE id = p_donor_id;

                -- Step 3: Check and update request fulfillment
                SELECT units_required, units_completed 
                INTO v_req_units, v_cur_units
                FROM blood_requests 
                WHERE id = p_request_id 
                FOR UPDATE;

                IF (v_cur_units + p_units) >= v_req_units THEN
                    UPDATE blood_requests
                    SET units_completed = v_cur_units + p_units,
                        status = 'FULFILLED',
                        updated_at = NOW()
                    WHERE id = p_request_id;
                    SET p_status = 'FULFILLED_COMPLETELY';
                ELSE
                    UPDATE blood_requests
                    SET units_completed = v_cur_units + p_units,
                        status = 'PARTIALLY_FULFILLED',
                        updated_at = NOW()
                    WHERE id = p_request_id;
                    SET p_status = 'PARTIALLY_FULFILLED';
                END IF;

                COMMIT;
            END
        ");

        // -------------------------------------------------------------
        // 3. DATABASE TRIGGERS
        // -------------------------------------------------------------

        // Trigger 1: Before inserting donation, prevent inactive donors
        DB::statement("DROP TRIGGER IF EXISTS trg_before_donation_prevent_ineligible;");
        DB::statement("
            CREATE TRIGGER trg_before_donation_prevent_ineligible
            BEFORE INSERT ON donations
            FOR EACH ROW
            BEGIN
                DECLARE v_status VARCHAR(50);
                SELECT profile_status INTO v_status 
                FROM donor_profiles 
                WHERE id = NEW.donor_profile_id;

                IF v_status = 'INACTIVE' THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Database Trigger Error: Inactive donor cannot make a donation.';
                END IF;
            END
        ");

        // Trigger 2: After inserting donation, automatically update request fulfillment & donor
        DB::statement("DROP TRIGGER IF EXISTS trg_after_donation_update_request;");
        DB::statement("
            CREATE TRIGGER trg_after_donation_update_request
            AFTER INSERT ON donations
            FOR EACH ROW
            BEGIN
                IF NEW.blood_request_id IS NOT NULL THEN
                    UPDATE blood_requests
                    SET units_completed = COALESCE(units_completed, 0) + NEW.units,
                        status = CASE 
                            WHEN (COALESCE(units_completed, 0) + NEW.units) >= units_required THEN 'FULFILLED'
                            ELSE 'PARTIALLY_FULFILLED'
                        END,
                        updated_at = NOW()
                    WHERE id = NEW.blood_request_id;
                END IF;

                UPDATE donor_profiles
                SET last_donation_at = NEW.donated_at,
                    updated_at = NOW()
                WHERE id = NEW.donor_profile_id;
            END
        ");

        // Trigger 3: After blood request status changes, record audit log
        DB::statement("DROP TRIGGER IF EXISTS trg_audit_request_status_change;");
        DB::statement("
            CREATE TRIGGER trg_audit_request_status_change
            AFTER UPDATE ON blood_requests
            FOR EACH ROW
            BEGIN
                IF OLD.status <> NEW.status THEN
                    INSERT INTO audit_logs (
                        actor_id,
                        actor_type,
                        event,
                        auditable_type,
                        auditable_id,
                        old_values,
                        new_values,
                        reason,
                        created_at
                    ) VALUES (
                        NEW.requester_id,
                        'SYSTEM',
                        'blood_request.status_changed',
                        'App\\\\Models\\\\BloodRequest',
                        NEW.id,
                        JSON_OBJECT('status', OLD.status, 'units_completed', OLD.units_completed),
                        JSON_OBJECT('status', NEW.status, 'units_completed', NEW.units_completed),
                        CONCAT('Trigger Audit: Request status changed from ', OLD.status, ' to ', NEW.status),
                        NOW()
                    );
                END IF;
            END
        ");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("DROP TRIGGER IF EXISTS trg_audit_request_status_change;");
        DB::statement("DROP TRIGGER IF EXISTS trg_after_donation_update_request;");
        DB::statement("DROP TRIGGER IF EXISTS trg_before_donation_prevent_ineligible;");
        DB::statement("DROP PROCEDURE IF EXISTS sp_fulfill_blood_request;");
        DB::statement("DROP PROCEDURE IF EXISTS sp_get_eligible_donors_by_group;");
        DB::statement("DROP VIEW IF EXISTS vw_hospital_donation_stats;");
        DB::statement("DROP VIEW IF EXISTS vw_emergency_request_board;");
        DB::statement("DROP VIEW IF EXISTS vw_donor_master_summary;");
    }
};
