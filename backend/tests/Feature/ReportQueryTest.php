<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/*
   ReportQueryTest
   ================
   This test file verifies that every SQL concept works correctly:
   - INNER JOIN
   - LEFT JOIN
   - COUNT, SUM, AVG, MIN, MAX
   - GROUP BY
   - HAVING
   - Subqueries
   - Correlated Subqueries

   Each test creates its own deterministic data, runs the query via the API,
   and then verifies EXACT values — not just HTTP status 200.

   The tests use SQLite in-memory database (configured in phpunit.xml) so
   they NEVER touch your real MySQL database. They are completely safe.
*/
class ReportQueryTest extends TestCase
{
    /* RefreshDatabase wipes the in-memory SQLite DB before each test */
    use RefreshDatabase;

    /* -----------------------------------------------------------------------
       Helper: Creates a standard set of users, donors, banks, and donations.
       Returns an array of IDs so each test can reference specific records.
    ----------------------------------------------------------------------- */
    private function seedTestData(): array
    {
        /* Create Users */
        $user1 = DB::table('users')->insertGetId(['FullName' => 'Rahim Islam',   'Email' => 'rahim@test.com',   'PasswordHash' => Hash::make('pass'), 'AccountStatus' => 'Active', 'Gender' => 'Male']);
        $user2 = DB::table('users')->insertGetId(['FullName' => 'Nusrat Begum',  'Email' => 'nusrat@test.com',  'PasswordHash' => Hash::make('pass'), 'AccountStatus' => 'Active', 'Gender' => 'Female']);
        $user3 = DB::table('users')->insertGetId(['FullName' => 'Karim Hossain', 'Email' => 'karim@test.com',   'PasswordHash' => Hash::make('pass'), 'AccountStatus' => 'Active', 'Gender' => 'Male']);
        $user4 = DB::table('users')->insertGetId(['FullName' => 'Sumaiya Khan',  'Email' => 'sumaiya@test.com', 'PasswordHash' => Hash::make('pass'), 'AccountStatus' => 'Active', 'Gender' => 'Female']);
        $userB = DB::table('users')->insertGetId(['FullName' => 'Bank Admin',    'Email' => 'bank@test.com',    'PasswordHash' => Hash::make('pass'), 'AccountStatus' => 'Active', 'Gender' => 'Male']);
        $userR = DB::table('users')->insertGetId(['FullName' => 'Fatema Akter',  'Email' => 'fatema@test.com',  'PasswordHash' => Hash::make('pass'), 'AccountStatus' => 'Active', 'Gender' => 'Female']);

        /* Create Donors */
        $donor1 = DB::table('Donors')->insertGetId(['UserID' => $user1, 'BloodGroup' => 'A+', 'WeightKg' => 75.0, 'IsEligible' => 1]);
        $donor2 = DB::table('Donors')->insertGetId(['UserID' => $user2, 'BloodGroup' => 'B+', 'WeightKg' => 62.0, 'IsEligible' => 1]);
        $donor3 = DB::table('Donors')->insertGetId(['UserID' => $user3, 'BloodGroup' => 'A+', 'WeightKg' => 80.0, 'IsEligible' => 1]);
        $donor4 = DB::table('Donors')->insertGetId(['UserID' => $user4, 'BloodGroup' => 'B+', 'WeightKg' => 55.0, 'IsEligible' => 0]); // 0 donations

        /* Create Blood Bank */
        $bank1 = DB::table('BloodBanks')->insertGetId(['UserID' => $userB, 'BankName' => 'Dhaka Blood Bank', 'City' => 'Dhaka', 'StorageCapacityUnits' => 300]);

        /* Create Donations:
           Donor1 → 5 donations
           Donor2 → 3 donations
           Donor3 → 1 donation
           Donor4 → 0 donations (LEFT JOIN test!)
           Average count = (5+3+1) / 3 donors with donations = 3.0
           Above average = Donor1 (5 > 3.0)
        */
        for ($i = 0; $i < 5; $i++) {
            DB::table('Donations')->insert(['DonorID' => $donor1, 'BankID' => $bank1, 'DonationDate' => '2024-01-0' . ($i + 1), 'VolumeCollectedML' => 450]);
        }
        for ($i = 0; $i < 3; $i++) {
            DB::table('Donations')->insert(['DonorID' => $donor2, 'BankID' => $bank1, 'DonationDate' => '2024-02-0' . ($i + 1), 'VolumeCollectedML' => 350]);
        }
        DB::table('Donations')->insert(['DonorID' => $donor3, 'BankID' => $bank1, 'DonationDate' => '2024-03-01', 'VolumeCollectedML' => 500]);

        /* Create Recipient and Blood Requests */
        $recipient1 = DB::table('Recipients')->insertGetId(['UserID' => $userR, 'BloodGroup' => 'A+', 'IsEmergency' => 1]);
        DB::table('BloodRequests')->insert(['RecipientID' => $recipient1, 'BloodGroup' => 'A+', 'QuantityUnits' => 5, 'UrgencyLevel' => 'Critical', 'RequestStatus' => 'Pending', 'RequestedAt' => now()]);
        DB::table('BloodRequests')->insert(['RecipientID' => $recipient1, 'BloodGroup' => 'A+', 'QuantityUnits' => 2, 'UrgencyLevel' => 'Normal',   'RequestStatus' => 'Pending', 'RequestedAt' => now()]);

        return compact('user1', 'user2', 'user3', 'user4', 'donor1', 'donor2', 'donor3', 'donor4', 'bank1', 'recipient1');
    }


    /* -----------------------------------------------------------------------
       TEST 1 — INNER JOIN: Donor profiles endpoint
    ----------------------------------------------------------------------- */
    public function test_inner_join_returns_donor_profiles_with_user_data(): void
    {
        $ids = $this->seedTestData();

        $response = $this->getJson('/api/reports/donors/profiles');

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);

        /* Verify INNER JOIN returned correct data — Rahim should appear */
        $response->assertJsonFragment([
            'FullName'   => 'Rahim Islam',
            'BloodGroup' => 'A+',
        ]);

        /* Verify all 4 donors are returned */
        $data = $response->json('data');
        $this->assertCount(4, $data);
    }


    /* -----------------------------------------------------------------------
       TEST 2 — LEFT JOIN: ALL donors appear, even those with 0 donations
    ----------------------------------------------------------------------- */
    public function test_left_join_includes_donors_with_zero_donations(): void
    {
        $ids = $this->seedTestData();

        $response = $this->getJson('/api/reports/donors/donation-counts');

        $response->assertStatus(200);

        $data = $response->json('data');

        /* All 4 donors must appear (including Sumaiya with 0 donations) */
        $this->assertCount(4, $data);

        /* Find Sumaiya's row and verify she has 0 donations */
        $sumaiyaRow = collect($data)->firstWhere('FullName', 'Sumaiya Khan');
        $this->assertNotNull($sumaiyaRow, 'Sumaiya should appear in LEFT JOIN result');
        $this->assertEquals(0, $sumaiyaRow['total_donations'], 'Sumaiya should have 0 donations');

        /* Verify Rahim has 5 donations */
        $rahimRow = collect($data)->firstWhere('FullName', 'Rahim Islam');
        $this->assertEquals(5, $rahimRow['total_donations']);
    }


    /* -----------------------------------------------------------------------
       TEST 3 — COUNT: Correct donation counts per donor
    ----------------------------------------------------------------------- */
    public function test_count_returns_correct_donation_total_per_donor(): void
    {
        $ids = $this->seedTestData();

        $response = $this->getJson('/api/reports/donors/donation-counts');
        $response->assertStatus(200);

        $data = collect($response->json('data'));

        $this->assertEquals(5, $data->firstWhere('FullName', 'Rahim Islam')['total_donations']);
        $this->assertEquals(3, $data->firstWhere('FullName', 'Nusrat Begum')['total_donations']);
        $this->assertEquals(1, $data->firstWhere('FullName', 'Karim Hossain')['total_donations']);
    }


    /* -----------------------------------------------------------------------
       TEST 4 — AVG + GROUP BY: Average weight per blood group is correct
    ----------------------------------------------------------------------- */
    public function test_avg_returns_correct_average_weight_per_blood_group(): void
    {
        $this->seedTestData();

        $response = $this->getJson('/api/reports/donors/average-weight-by-blood-group');
        $response->assertStatus(200);

        $data = collect($response->json('data'));

        /* A+ donors: Rahim (75) and Karim (80) → average = 77.5 */
        $aPlus = $data->firstWhere('BloodGroup', 'A+');
        $this->assertNotNull($aPlus);
        $this->assertEquals(77.50, (float) $aPlus['average_weight']);

        /* B+ donors: Nusrat (62) and Sumaiya (55) → average = 58.5 */
        $bPlus = $data->firstWhere('BloodGroup', 'B+');
        $this->assertNotNull($bPlus);
        $this->assertEquals(58.50, (float) $bPlus['average_weight']);
    }


    /* -----------------------------------------------------------------------
       TEST 5 — HAVING: Only donors with >= 3 donations are returned
    ----------------------------------------------------------------------- */
    public function test_having_filters_donors_below_minimum_donations(): void
    {
        $this->seedTestData();

        /* Ask for donors with minimum 3 donations */
        $response = $this->getJson('/api/reports/donors/frequent?minimum=3');
        $response->assertStatus(200);

        $data = collect($response->json('data'));

        /* Rahim (5) and Nusrat (3) should appear. Karim (1) and Sumaiya (0) should NOT. */
        $this->assertCount(2, $data);
        $this->assertNotNull($data->firstWhere('FullName', 'Rahim Islam'));
        $this->assertNotNull($data->firstWhere('FullName', 'Nusrat Begum'));
        $this->assertNull($data->firstWhere('FullName', 'Karim Hossain'));
        $this->assertNull($data->firstWhere('FullName', 'Sumaiya Khan'));
    }


    /* -----------------------------------------------------------------------
       TEST 6 — Subquery + AVG: Donors above global average weight
    ----------------------------------------------------------------------- */
    public function test_subquery_returns_only_donors_above_global_average_weight(): void
    {
        $this->seedTestData();

        $response = $this->getJson('/api/reports/donors/above-average-weight');
        $response->assertStatus(200);

        $data = collect($response->json('data'));

        /* Weights: Rahim 75, Nusrat 62, Karim 80, Sumaiya 55. Average = 68.0
           Above average: Rahim (75) and Karim (80) */
        $names = $data->pluck('FullName')->toArray();
        $this->assertContains('Rahim Islam', $names);
        $this->assertContains('Karim Hossain', $names);
        $this->assertNotContains('Nusrat Begum', $names);   // 62 < 68
        $this->assertNotContains('Sumaiya Khan', $names);   // 55 < 68
    }


    /* -----------------------------------------------------------------------
       TEST 7 — Correlated Subquery: Donors above their blood group's average weight
    ----------------------------------------------------------------------- */
    public function test_correlated_subquery_compares_against_own_blood_group_average(): void
    {
        $this->seedTestData();

        $response = $this->getJson('/api/reports/donors/above-blood-group-average-weight');
        $response->assertStatus(200);

        $data = collect($response->json('data'));

        /* A+ group: Rahim (75) and Karim (80), average = 77.5
           → Only Karim (80 > 77.5) qualifies from A+
           B+ group: Nusrat (62) and Sumaiya (55), average = 58.5
           → Only Nusrat (62 > 58.5) qualifies from B+ */
        $names = $data->pluck('FullName')->toArray();
        $this->assertContains('Karim Hossain', $names);   // 80 > A+ average 77.5
        $this->assertContains('Nusrat Begum', $names);    // 62 > B+ average 58.5
        $this->assertNotContains('Rahim Islam', $names);  // 75 < A+ average 77.5
        $this->assertNotContains('Sumaiya Khan', $names); // 55 < B+ average 58.5
    }


    /* -----------------------------------------------------------------------
       TEST 8 — JOIN + COUNT + HAVING + Subquery: Above-average donation count
    ----------------------------------------------------------------------- */
    public function test_advanced_query_finds_donors_above_average_donation_count(): void
    {
        $this->seedTestData();

        $response = $this->getJson('/api/reports/donors/above-average-donations');
        $response->assertStatus(200);

        $data = collect($response->json('data'));

        /* Donors with donations: Rahim (5), Nusrat (3), Karim (1).
           Average = (5+3+1)/3 = 3.0
           Above average (> 3.0): only Rahim with 5 */
        $names = $data->pluck('FullName')->toArray();
        $this->assertContains('Rahim Islam', $names);
        $this->assertNotContains('Nusrat Begum', $names); // 3 is not > 3.0
        $this->assertNotContains('Karim Hossain', $names);
    }


    /* -----------------------------------------------------------------------
       TEST 9 — Blood Bank Stats: Correct donation count per bank
    ----------------------------------------------------------------------- */
    public function test_blood_bank_statistics_returns_correct_donation_count(): void
    {
        $this->seedTestData();

        $response = $this->getJson('/api/reports/blood-banks/donation-statistics');
        $response->assertStatus(200);

        $data = collect($response->json('data'));

        /* All 9 donations (5+3+1) went to the same bank */
        $bank = $data->firstWhere('BankName', 'Dhaka Blood Bank');
        $this->assertNotNull($bank);
        $this->assertEquals(9, (int) $bank['total_donations']);
    }


    /* -----------------------------------------------------------------------
       TEST 10 — SUM: Total blood volume collected by blood bank
    ----------------------------------------------------------------------- */
    public function test_sum_returns_correct_total_volume_per_blood_bank(): void
    {
        $this->seedTestData();

        $response = $this->getJson('/api/reports/blood-banks/volume-statistics');
        $response->assertStatus(200);

        $data = collect($response->json('data'));

        /* 5 donations × 450mL + 3 donations × 350mL + 1 donation × 500mL
           = 2250 + 1050 + 500 = 3800 mL */
        $bank = $data->firstWhere('BankName', 'Dhaka Blood Bank');
        $this->assertEquals(3800, (int) $bank['total_volume_ml']);
    }


    /* -----------------------------------------------------------------------
       TEST 11 — Recipient Request Statistics (LEFT JOIN + SUM)
    ----------------------------------------------------------------------- */
    public function test_recipient_request_statistics_returns_correct_totals(): void
    {
        $this->seedTestData();

        $response = $this->getJson('/api/reports/recipients/request-statistics');
        $response->assertStatus(200);

        $data = collect($response->json('data'));

        /* Fatema made 2 requests: 5 units + 2 units = 7 total */
        $fatema = $data->firstWhere('FullName', 'Fatema Akter');
        $this->assertNotNull($fatema);
        $this->assertEquals(7, (int) $fatema['total_units_requested']);
        $this->assertEquals(2, (int) $fatema['total_requests']);
    }


    /* -----------------------------------------------------------------------
       TEST 12 — Above-Average Quantity Blood Requests (Subquery)
    ----------------------------------------------------------------------- */
    public function test_subquery_returns_only_above_average_blood_requests(): void
    {
        $this->seedTestData();

        $response = $this->getJson('/api/reports/requests/above-average-quantity');
        $response->assertStatus(200);

        $data = collect($response->json('data'));

        /* Requests: 5 units and 2 units. Average = 3.5
           Above average: only the 5-unit request */
        $this->assertCount(1, $data);
        $this->assertEquals(5, (int) $data[0]['QuantityUnits']);
    }


    /* -----------------------------------------------------------------------
       TEST 13 — MIN + MAX: Weight range per blood group
    ----------------------------------------------------------------------- */
    public function test_min_max_returns_correct_weight_range_per_blood_group(): void
    {
        $this->seedTestData();

        $response = $this->getJson('/api/reports/donors/weight-range-by-blood-group');
        $response->assertStatus(200);

        $data = collect($response->json('data'));

        /* A+ donors: Rahim 75, Karim 80 → min=75, max=80 */
        $aPlus = $data->firstWhere('BloodGroup', 'A+');
        $this->assertEquals(75.0, (float) $aPlus['min_weight']);
        $this->assertEquals(80.0, (float) $aPlus['max_weight']);

        /* B+ donors: Nusrat 62, Sumaiya 55 → min=55, max=62 */
        $bPlus = $data->firstWhere('BloodGroup', 'B+');
        $this->assertEquals(55.0, (float) $bPlus['min_weight']);
        $this->assertEquals(62.0, (float) $bPlus['max_weight']);
    }
}
