<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/*
   BloodDonationSeeder
   ====================
   This seeder creates a realistic, deterministic test dataset designed to
   demonstrate all SQL concepts: JOIN, LEFT JOIN, COUNT, SUM, AVG, MIN, MAX,
   GROUP BY, HAVING, Subqueries, and Correlated Subqueries.

   The dataset is intentionally structured so you can verify query results:
   - User 1 (Rahim Islam)     = Donor A+ — 5 donations
   - User 2 (Nusrat Begum)    = Donor B+ — 3 donations
   - User 3 (Karim Hossain)   = Donor O+ — 1 donation
   - User 4 (Sumaiya Khan)    = Donor AB+ — 0 donations (tests LEFT JOIN)
   - User 5 (Tariq Ahmed)     = Donor A+ — 2 donations
   - 2 Blood Banks
   - 3 Recipients with Blood Requests
*/
class BloodDonationSeeder extends Seeder
{
    public function run(): void
    {
        /* --- Step 1: Create Users --- */
        $users = [
            ['FullName' => 'Rahim Islam',    'Email' => 'rahim@example.com',   'Gender' => 'Male',   'Phone' => '01711111111'],
            ['FullName' => 'Nusrat Begum',   'Email' => 'nusrat@example.com',  'Gender' => 'Female', 'Phone' => '01711111112'],
            ['FullName' => 'Karim Hossain',  'Email' => 'karim@example.com',   'Gender' => 'Male',   'Phone' => '01711111113'],
            ['FullName' => 'Sumaiya Khan',   'Email' => 'sumaiya@example.com', 'Gender' => 'Female', 'Phone' => '01711111114'],
            ['FullName' => 'Tariq Ahmed',    'Email' => 'tariq@example.com',   'Gender' => 'Male',   'Phone' => '01711111115'],
            /* Bank Admin users */
            ['FullName' => 'Dhaka Bank Admin',   'Email' => 'dhaka.bank@example.com',   'Gender' => 'Male', 'Phone' => '01799999991'],
            ['FullName' => 'Ctg Bank Admin',     'Email' => 'ctg.bank@example.com',     'Gender' => 'Male', 'Phone' => '01799999992'],
            /* Recipient users */
            ['FullName' => 'Fatema Akter',   'Email' => 'fatema@example.com',  'Gender' => 'Female', 'Phone' => '01722222221'],
            ['FullName' => 'Hasib Rahman',   'Email' => 'hasib@example.com',   'Gender' => 'Male',   'Phone' => '01722222222'],
            ['FullName' => 'Riya Chowdhury', 'Email' => 'riya@example.com',    'Gender' => 'Female', 'Phone' => '01722222223'],
        ];

        $userIds = [];
        foreach ($users as $user) {
            $userIds[] = DB::table('users')->insertGetId([
                'FullName'      => $user['FullName'],
                'Email'         => $user['Email'],
                'PasswordHash'  => Hash::make('password123'),
                'Phone'         => $user['Phone'],
                'Gender'        => $user['Gender'],
                'AccountStatus' => 'Active',
            ]);
        }

        /* --- Step 2: Create Donors (first 5 users become donors) --- */
        $donorData = [
            /* UserID index, BloodGroup, WeightKg, City, IsEligible */
            [$userIds[0], 'A+', 75.5, 'Dhaka',      1],  // Rahim  — heavy, eligible
            [$userIds[1], 'B+', 62.0, 'Chittagong', 1],  // Nusrat — lighter, eligible
            [$userIds[2], 'O+', 80.0, 'Sylhet',     1],  // Karim  — heaviest, eligible
            [$userIds[3], 'AB+',55.0, 'Rajshahi',   0],  // Sumaiya — ineligible, no donations
            [$userIds[4], 'A+', 70.0, 'Dhaka',      1],  // Tariq  — A+, lighter than Rahim
        ];

        $donorIds = [];
        foreach ($donorData as $d) {
            $donorIds[] = DB::table('Donors')->insertGetId([
                'UserID'    => $d[0],
                'BloodGroup'=> $d[1],
                'WeightKg'  => $d[2],
                'City'      => $d[3],
                'IsEligible'=> $d[4],
            ]);
        }

        /* --- Step 3: Create Blood Banks --- */
        $bankIds = [];
        $bankIds[0] = DB::table('BloodBanks')->insertGetId([
            'UserID'              => $userIds[5],
            'BankName'            => 'Dhaka Central Blood Bank',
            'Address'             => '12 Motijheel',
            'City'                => 'Dhaka',
            'ContactPhone'        => '02-9999001',
            'StorageCapacityUnits'=> 500,
        ]);
        $bankIds[1] = DB::table('BloodBanks')->insertGetId([
            'UserID'              => $userIds[6],
            'BankName'            => 'Chittagong Blood Center',
            'Address'             => '45 Agrabad',
            'City'                => 'Chittagong',
            'ContactPhone'        => '031-9999002',
            'StorageCapacityUnits'=> 300,
        ]);

        /* --- Step 4: Create Donations (the key test data) ---
           Rahim (Donor 0)  → 5 donations  (above average)
           Nusrat (Donor 1) → 3 donations  (at/above average)
           Karim  (Donor 2) → 1 donation   (below average)
           Sumaiya (Donor 3)→ 0 donations  (LEFT JOIN test)
           Tariq  (Donor 4) → 2 donations  (below average)
           Average = (5+3+1+2) / 4 donors who donated = 2.75
           So above-average donors are: Rahim (5) and Nusrat (3)
        */
        $donations = [
            /* DonorID, BankID, Date, Volume */
            [$donorIds[0], $bankIds[0], '2024-01-10', 450],
            [$donorIds[0], $bankIds[0], '2024-04-15', 450],
            [$donorIds[0], $bankIds[1], '2024-07-20', 400],
            [$donorIds[0], $bankIds[0], '2024-09-05', 450],
            [$donorIds[0], $bankIds[1], '2025-01-11', 450], // Rahim 5 total

            [$donorIds[1], $bankIds[1], '2024-02-14', 350],
            [$donorIds[1], $bankIds[1], '2024-06-18', 350],
            [$donorIds[1], $bankIds[0], '2025-02-20', 400], // Nusrat 3 total

            [$donorIds[2], $bankIds[0], '2024-03-25', 500], // Karim 1 total

            [$donorIds[4], $bankIds[0], '2024-05-10', 430],
            [$donorIds[4], $bankIds[1], '2024-11-15', 430], // Tariq 2 total
        ];

        foreach ($donations as $don) {
            DB::table('Donations')->insert([
                'DonorID'          => $don[0],
                'BankID'           => $don[1],
                'DonationDate'     => $don[2],
                'VolumeCollectedML'=> $don[3],
                'Remarks'          => 'Routine donation',
            ]);
        }

        /* --- Step 5: Create Recipients --- */
        $recipientIds = [];
        $recipientIds[0] = DB::table('Recipients')->insertGetId([
            'UserID'       => $userIds[7],
            'BloodGroup'   => 'A+',
            'HospitalName' => 'Dhaka Medical College',
            'IsEmergency'  => 1,
        ]);
        $recipientIds[1] = DB::table('Recipients')->insertGetId([
            'UserID'       => $userIds[8],
            'BloodGroup'   => 'B+',
            'HospitalName' => 'Square Hospital',
            'IsEmergency'  => 0,
        ]);
        $recipientIds[2] = DB::table('Recipients')->insertGetId([
            'UserID'       => $userIds[9],
            'BloodGroup'   => 'O+',
            'HospitalName' => 'Popular Hospital',
            'IsEmergency'  => 0,
        ]);

        /* --- Step 6: Create Blood Requests (intentionally varied quantities) ---
           Average quantity = (5+2+8+3) / 4 = 4.5
           Above-average requests: Fatema's 5-unit request and Fatema's 8-unit request
        */
        $requests = [
            [$recipientIds[0], 'A+', 5,  'Critical'],   // above average
            [$recipientIds[0], 'A+', 2,  'Normal'],     // below average
            [$recipientIds[1], 'B+', 8,  'Emergency'],  // above average
            [$recipientIds[2], 'O+', 3,  'Normal'],     // below average
        ];

        foreach ($requests as $req) {
            DB::table('BloodRequests')->insert([
                'RecipientID'  => $req[0],
                'BloodGroup'   => $req[1],
                'QuantityUnits'=> $req[2],
                'UrgencyLevel' => $req[3],
                'RequestStatus'=> 'Pending',
                'RequestedAt'  => now(),
            ]);
        }
    }
}
