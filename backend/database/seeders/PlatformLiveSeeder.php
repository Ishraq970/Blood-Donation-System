<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\DonorProfile;
use App\Models\DonorAvailability;
use App\Models\BloodRequest;
use App\Models\Donation;
use App\Models\VolunteerProfile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PlatformLiveSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Donors Dataset
        $donorsData = [
            ['name' => 'Rahim Islam', 'email' => 'rahim@roktolinkbd.test', 'phone' => '01711000001', 'blood_group' => 'A+', 'radius' => 15, 'donations' => 5],
            ['name' => 'Nusrat Begum', 'email' => 'nusrat@roktolinkbd.test', 'phone' => '01711000002', 'blood_group' => 'B+', 'radius' => 10, 'donations' => 3],
            ['name' => 'Karim Hossain', 'email' => 'karim@roktolinkbd.test', 'phone' => '01711000003', 'blood_group' => 'O+', 'radius' => 25, 'donations' => 1],
            ['name' => 'Sumaiya Khan', 'email' => 'sumaiya@roktolinkbd.test', 'phone' => '01711000004', 'blood_group' => 'AB+', 'radius' => 5, 'donations' => 0], // tests LEFT JOIN
            ['name' => 'Tariq Ahmed', 'email' => 'tariq@roktolinkbd.test', 'phone' => '01711000005', 'blood_group' => 'A-', 'radius' => 20, 'donations' => 2],
            ['name' => 'Sadia Afrin', 'email' => 'sadia@roktolinkbd.test', 'phone' => '01711000006', 'blood_group' => 'O-', 'radius' => 12, 'donations' => 4],
            ['name' => 'Tanvir Hasan', 'email' => 'tanvir@roktolinkbd.test', 'phone' => '01711000007', 'blood_group' => 'B-', 'radius' => 8, 'donations' => 1],
            ['name' => 'Farhana Yasmin', 'email' => 'farhana@roktolinkbd.test', 'phone' => '01711000008', 'blood_group' => 'AB-', 'radius' => 30, 'donations' => 2],
        ];

        // 2. Facilities
        $facilities = [
            'Dhaka Medical College Hospital',
            'Mitford Hospital, Dhaka',
            'Chattogram Medical College Hospital',
            'Sylhet MAG Osmani Medical College',
            'Rajshahi Medical College Hospital',
        ];

        $createdDonors = [];

        foreach ($donorsData as $idx => $d) {
            $user = User::firstOrCreate(
                ['email' => $d['email']],
                [
                    'name' => $d['name'],
                    'phone' => $d['phone'],
                    'password' => Hash::make('password123'),
                    'status' => 'ACTIVE',
                    'email_verified_at' => now(),
                ]
            );

            $donor = DonorProfile::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'public_donor_code' => 'DNR-' . strtoupper(Str::random(8)),
                    'blood_group' => $d['blood_group'],
                    'preferred_radius_km' => $d['radius'],
                    'profile_status' => 'ACTIVE',
                    'last_donation_at' => $d['donations'] > 0 ? now()->subMonths(4) : null,
                ]
            );

            DonorAvailability::firstOrCreate(
                ['donor_profile_id' => $donor->id],
                [
                    'status' => 'AVAILABLE_NOW',
                    'radius_km' => $d['radius'],
                ]
            );

            $createdDonors[] = [
                'donor' => $donor,
                'user' => $user,
                'target_donations' => $d['donations'],
            ];
        }

        // 3. Urgent Blood Requests
        $requestsData = [
            ['code' => 'RLB-26-04821', 'group' => 'O-', 'comp' => 'Red Cells', 'units' => 2, 'urg' => 'EMERGENCY_NOW', 'hosp' => 'Mitford Hospital, Dhaka'],
            ['code' => 'RLB-26-04815', 'group' => 'B+', 'comp' => 'Platelets', 'units' => 1, 'urg' => 'TODAY', 'hosp' => 'Chattogram Medical College Hospital'],
            ['code' => 'RLB-26-04798', 'group' => 'A+', 'comp' => 'Whole Blood', 'units' => 3, 'urg' => 'EMERGENCY_NOW', 'hosp' => 'Sylhet MAG Osmani Medical College'],
            ['code' => 'RLB-26-04792', 'group' => 'AB-', 'comp' => 'Plasma', 'units' => 1, 'urg' => 'WITHIN_6_HOURS', 'hosp' => 'Rajshahi Medical College Hospital'],
            ['code' => 'RLB-26-04788', 'group' => 'O+', 'comp' => 'Red Cells', 'units' => 2, 'urg' => 'TODAY', 'hosp' => 'Dhaka Medical College Hospital'],
            ['code' => 'RLB-26-04781', 'group' => 'B-', 'comp' => 'Red Cells', 'units' => 1, 'urg' => 'NORMAL', 'hosp' => 'Khulna Medical College Hospital'],
        ];

        $requesterUser = User::firstOrCreate(
            ['email' => 'requester@roktolinkbd.test'],
            [
                'name' => 'Fatema Akter',
                'phone' => '01722222221',
                'password' => Hash::make('password123'),
                'status' => 'ACTIVE',
                'email_verified_at' => now(),
            ]
        );

        $createdRequests = [];
        foreach ($requestsData as $r) {
            $req = BloodRequest::firstOrCreate(
                ['request_code' => $r['code']],
                [
                    'requester_id' => $requesterUser->id,
                    'blood_group' => $r['group'],
                    'component' => $r['comp'],
                    'units_required' => $r['units'],
                    'urgency' => $r['urg'],
                    'facility_name' => $r['hosp'],
                    'address_text' => 'Bangladesh',
                    'required_at' => now()->addHours(6),
                    'status' => 'OPEN',
                ]
            );
            $createdRequests[] = $req;
        }

        // 4. Create Donations for the Donors
        foreach ($createdDonors as $item) {
            $donor = $item['donor'];
            $count = $item['target_donations'];

            for ($i = 0; $i < $count; $i++) {
                $req = $createdRequests[$i % count($createdRequests)];
                $fac = $facilities[($donor->id + $i) % count($facilities)];

                Donation::create([
                    'blood_request_id' => $req->id,
                    'donor_profile_id' => $donor->id,
                    'facility_name' => $fac,
                    'component' => 'Red Cells',
                    'units' => 1,
                    'status' => 'CONFIRMED',
                    'donated_at' => now()->subMonths(3 * ($i + 1)),
                    'donor_confirmed' => true,
                    'requester_confirmed' => true,
                    'volunteer_verified' => true,
                ]);
            }
        }

        // 5. Create Volunteers
        $volunteersData = [
            ['name' => 'Mehedi Hasan', 'email' => 'mehedi.vol@roktolinkbd.test', 'phone' => '01733333331'],
            ['name' => 'Anika Tabassum', 'email' => 'anika.vol@roktolinkbd.test', 'phone' => '01733333332'],
            ['name' => 'Zubair Al Mahmud', 'email' => 'zubair.vol@roktolinkbd.test', 'phone' => '01733333333'],
        ];

        foreach ($volunteersData as $v) {
            $u = User::firstOrCreate(
                ['email' => $v['email']],
                [
                    'name' => $v['name'],
                    'phone' => $v['phone'],
                    'password' => Hash::make('password123'),
                    'status' => 'ACTIVE',
                    'email_verified_at' => now(),
                ]
            );

            VolunteerProfile::firstOrCreate(
                ['user_id' => $u->id],
                [
                    'volunteer_code' => 'VOL-' . strtoupper(Str::random(6)),
                    'emergency_contact_phone' => $v['phone'],
                    'verification_status' => 'APPROVED',
                    'verified_at' => now(),
                ]
            );
        }
    }
}
