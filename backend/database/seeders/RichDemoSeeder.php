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

/**
 * RichDemoSeeder — Creates a comprehensive realistic dataset:
 * - 22 verified donors across all 8 blood groups
 * - 12 blood requests (mix of statuses)
 * - 30+ confirmed donations with Wall of Lifesavers entries
 * - 4 approved volunteers
 * - Gratitude notes from families
 *
 * SAFETY: Uses firstOrCreate — safe to run multiple times.
 */
class RichDemoSeeder extends Seeder
{
    public function run(): void
    {
        // ─── 1. RICH DONOR DATASET (22 donors across all blood groups) ───────
        $donors = [
            // A+
            ['name' => 'Rahim Islam',        'email' => 'rahim.islam@roktolink.test',        'phone' => '01711100001', 'bg' => 'A+',  'radius' => 15, 'donations' => 5],
            ['name' => 'Nilufar Sultana',     'email' => 'nilufar.sultana@roktolink.test',    'phone' => '01711100002', 'bg' => 'A+',  'radius' => 10, 'donations' => 2],
            ['name' => 'Mizan Rahman',        'email' => 'mizan.rahman@roktolink.test',       'phone' => '01711100003', 'bg' => 'A+',  'radius' => 20, 'donations' => 3],

            // A-
            ['name' => 'Tariq Ahmed',         'email' => 'tariq.ahmed@roktolink.test',        'phone' => '01711100004', 'bg' => 'A-',  'radius' => 20, 'donations' => 2],

            // B+
            ['name' => 'Nusrat Begum',        'email' => 'nusrat.begum@roktolink.test',       'phone' => '01711100005', 'bg' => 'B+',  'radius' => 10, 'donations' => 4],
            ['name' => 'Shafiqul Islam',      'email' => 'shafiqul.islam@roktolink.test',     'phone' => '01711100006', 'bg' => 'B+',  'radius' => 25, 'donations' => 1],
            ['name' => 'Ruhul Kabir',         'email' => 'ruhul.kabir@roktolink.test',        'phone' => '01711100007', 'bg' => 'B+',  'radius' => 12, 'donations' => 3],

            // B-
            ['name' => 'Tanvir Hasan',        'email' => 'tanvir.hasan@roktolink.test',       'phone' => '01711100008', 'bg' => 'B-',  'radius' => 8,  'donations' => 1],

            // AB+
            ['name' => 'Sumaiya Khan',        'email' => 'sumaiya.khan@roktolink.test',       'phone' => '01711100009', 'bg' => 'AB+', 'radius' => 5,  'donations' => 0],
            ['name' => 'Arif Hossain',        'email' => 'arif.hossain@roktolink.test',       'phone' => '01711100010', 'bg' => 'AB+', 'radius' => 18, 'donations' => 2],

            // AB-
            ['name' => 'Farhana Yasmin',      'email' => 'farhana.yasmin@roktolink.test',     'phone' => '01711100011', 'bg' => 'AB-', 'radius' => 30, 'donations' => 2],

            // O+
            ['name' => 'Karim Hossain',       'email' => 'karim.hossain@roktolink.test',      'phone' => '01711100012', 'bg' => 'O+',  'radius' => 25, 'donations' => 6],
            ['name' => 'Rubina Akter',        'email' => 'rubina.akter@roktolink.test',       'phone' => '01711100013', 'bg' => 'O+',  'radius' => 10, 'donations' => 4],
            ['name' => 'Jahangir Alam',       'email' => 'jahangir.alam@roktolink.test',      'phone' => '01711100014', 'bg' => 'O+',  'radius' => 20, 'donations' => 3],
            ['name' => 'Sharmin Akter',       'email' => 'sharmin.akter@roktolink.test',      'phone' => '01711100015', 'bg' => 'O+',  'radius' => 15, 'donations' => 2],

            // O-
            ['name' => 'Sadia Afrin',         'email' => 'sadia.afrin@roktolink.test',        'phone' => '01711100016', 'bg' => 'O-',  'radius' => 12, 'donations' => 5],
            ['name' => 'Monir Hossain',       'email' => 'monir.hossain@roktolink.test',      'phone' => '01711100017', 'bg' => 'O-',  'radius' => 8,  'donations' => 3],

            // Extra active donors for search visibility
            ['name' => 'Delwar Hossain',      'email' => 'delwar.hossain@roktolink.test',     'phone' => '01711100018', 'bg' => 'A+',  'radius' => 15, 'donations' => 1],
            ['name' => 'Nasrin Sultana',      'email' => 'nasrin.sultana@roktolink.test',     'phone' => '01711100019', 'bg' => 'B+',  'radius' => 10, 'donations' => 2],
            ['name' => 'Ripon Ahmed',         'email' => 'ripon.ahmed@roktolink.test',        'phone' => '01711100020', 'bg' => 'O+',  'radius' => 20, 'donations' => 1],
            ['name' => 'Mitu Khatun',         'email' => 'mitu.khatun@roktolink.test',        'phone' => '01711100021', 'bg' => 'AB+', 'radius' => 15, 'donations' => 1],
            ['name' => 'Zakir Hossain',       'email' => 'zakir.hossain@roktolink.test',      'phone' => '01711100022', 'bg' => 'A-',  'radius' => 25, 'donations' => 2],
        ];

        // ─── 2. REQUESTERS ────────────────────────────────────────────────────
        $requesters = [
            ['name' => 'Fatema Akter',    'email' => 'fatema.akter@roktolink.test',    'phone' => '01722200001'],
            ['name' => 'Hasib Rahman',    'email' => 'hasib.rahman@roktolink.test',    'phone' => '01722200002'],
            ['name' => 'Riya Chowdhury',  'email' => 'riya.chowdhury@roktolink.test',  'phone' => '01722200003'],
            ['name' => 'Parvez Hossain',  'email' => 'parvez.hossain@roktolink.test',  'phone' => '01722200004'],
            ['name' => 'Salma Begum',     'email' => 'salma.begum@roktolink.test',     'phone' => '01722200005'],
        ];

        // ─── 3. HOSPITALS ─────────────────────────────────────────────────────
        $hospitals = [
            'Dhaka Medical College Hospital',
            'Mitford Hospital, Dhaka',
            'National Heart Foundation Hospital',
            'BSMMU (PG Hospital), Dhaka',
            'Chattogram Medical College Hospital',
            'Sylhet MAG Osmani Medical College',
            'Rajshahi Medical College Hospital',
            'Khulna Medical College Hospital',
            'Suhrawardy Medical College Hospital',
            'Birdem General Hospital, Dhaka',
        ];

        // ─── 4. GRATITUDE NOTES ───────────────────────────────────────────────
        $gratitudeNotes = [
            'My father is alive today because of your blood. We will forever pray for your long life and health.',
            'You were a stranger, but you gave the most precious gift. Thank you from the bottom of our hearts.',
            'The doctors said we had only 30 minutes. You arrived in time. Our family owes you everything.',
            'My baby is healthy and home because of your donation. May Allah bless you abundantly.',
            'My mother survived her surgery. We are eternally grateful for your selfless act.',
            'Three bags of blood. Three chances at life. Thank you for being our family\'s guardian angel.',
            'Your donation gave my husband a second chance. Our children still have their father.',
            'We did not know you, but you became our hero. Thank you, lifesaver.',
            'Emergency surgery at midnight — and you came. We will never forget this kindness.',
            'RoktoLinkBD connected us in minutes. You arrived in an hour. My sister is alive.',
            'You are the reason our family is complete today. Thank you for your sacrifice.',
            'A simple act for you, an entire world for us. Our family sends endless gratitude.',
            'Your blood now flows through my veins. You are part of our family forever.',
            'আপনার রক্ত আমার মায়ের প্রাণ বাঁচিয়েছে। আপনার জন্য সারাজীবন দোয়া করব।',
            'ধন্যবাদ। আপনার মতো মানুষ আছেন বলেই আমরা আশায় বেঁচে থাকি।',
        ];

        // ─────────────────────────────────────────────────────────────────────
        // CREATE DONOR PROFILES
        // ─────────────────────────────────────────────────────────────────────
        $donorProfiles = [];

        foreach ($donors as $d) {
            $user = User::firstOrCreate(
                ['email' => $d['email']],
                [
                    'name'             => $d['name'],
                    'phone'            => $d['phone'],
                    'password'         => Hash::make('password123'),
                    'status'           => 'ACTIVE',
                    'email_verified_at'=> now(),
                ]
            );

            $profile = DonorProfile::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'public_donor_code'    => 'DNR-26-' . strtoupper(Str::random(6)),
                    'blood_group'          => $d['bg'],
                    'preferred_radius_km'  => $d['radius'],
                    'profile_status'       => 'ACTIVE',
                    'emergency_alerts_enabled' => true,
                    'last_donation_at'     => $d['donations'] > 0 ? now()->subDays(rand(95, 300)) : null,
                ]
            );

            DonorAvailability::firstOrCreate(
                ['donor_profile_id' => $profile->id],
                [
                    'status'    => 'AVAILABLE_NOW',
                    'radius_km' => $d['radius'],
                ]
            );

            $donorProfiles[] = [
                'profile' => $profile,
                'user'    => $user,
                'count'   => $d['donations'],
                'bg'      => $d['bg'],
            ];
        }

        // ─────────────────────────────────────────────────────────────────────
        // CREATE REQUESTERS
        // ─────────────────────────────────────────────────────────────────────
        $requesterUsers = [];
        foreach ($requesters as $r) {
            $requesterUsers[] = User::firstOrCreate(
                ['email' => $r['email']],
                [
                    'name'             => $r['name'],
                    'phone'            => $r['phone'],
                    'password'         => Hash::make('password123'),
                    'status'           => 'ACTIVE',
                    'email_verified_at'=> now(),
                ]
            );
        }

        // ─────────────────────────────────────────────────────────────────────
        // CREATE BLOOD REQUESTS (FULFILLED ones used for donations)
        // ─────────────────────────────────────────────────────────────────────
        $requestData = [
            ['code' => 'RLB-26-DEMO01', 'bg' => 'O-',  'comp' => 'Red Cells',   'units' => 2, 'urg' => 'EMERGENCY_NOW',    'hosp' => 'Dhaka Medical College Hospital',     'requester' => 0, 'status' => 'FULFILLED'],
            ['code' => 'RLB-26-DEMO02', 'bg' => 'B+',  'comp' => 'Platelets',   'units' => 1, 'urg' => 'TODAY',            'hosp' => 'Chattogram Medical College Hospital', 'requester' => 1, 'status' => 'FULFILLED'],
            ['code' => 'RLB-26-DEMO03', 'bg' => 'A+',  'comp' => 'Whole Blood', 'units' => 3, 'urg' => 'EMERGENCY_NOW',    'hosp' => 'Sylhet MAG Osmani Medical College',   'requester' => 2, 'status' => 'FULFILLED'],
            ['code' => 'RLB-26-DEMO04', 'bg' => 'AB-', 'comp' => 'Plasma',      'units' => 1, 'urg' => 'WITHIN_6_HOURS',  'hosp' => 'Rajshahi Medical College Hospital',   'requester' => 3, 'status' => 'FULFILLED'],
            ['code' => 'RLB-26-DEMO05', 'bg' => 'O+',  'comp' => 'Red Cells',   'units' => 2, 'urg' => 'TODAY',            'hosp' => 'Mitford Hospital, Dhaka',             'requester' => 4, 'status' => 'FULFILLED'],
            ['code' => 'RLB-26-DEMO06', 'bg' => 'B-',  'comp' => 'Red Cells',   'units' => 1, 'urg' => 'NORMAL',           'hosp' => 'Khulna Medical College Hospital',     'requester' => 0, 'status' => 'FULFILLED'],
            ['code' => 'RLB-26-DEMO07', 'bg' => 'A-',  'comp' => 'Red Cells',   'units' => 1, 'urg' => 'TODAY',            'hosp' => 'National Heart Foundation Hospital',  'requester' => 1, 'status' => 'FULFILLED'],
            ['code' => 'RLB-26-DEMO08', 'bg' => 'AB+', 'comp' => 'Whole Blood', 'units' => 1, 'urg' => 'WITHIN_6_HOURS',  'hosp' => 'BSMMU (PG Hospital), Dhaka',          'requester' => 2, 'status' => 'FULFILLED'],
            ['code' => 'RLB-26-DEMO09', 'bg' => 'O-',  'comp' => 'Whole Blood', 'units' => 2, 'urg' => 'EMERGENCY_NOW',    'hosp' => 'Suhrawardy Medical College Hospital', 'requester' => 3, 'status' => 'FULFILLED'],
            ['code' => 'RLB-26-DEMO10', 'bg' => 'A+',  'comp' => 'Platelets',   'units' => 2, 'urg' => 'TODAY',            'hosp' => 'Birdem General Hospital, Dhaka',      'requester' => 4, 'status' => 'FULFILLED'],
            ['code' => 'RLB-26-DEMO11', 'bg' => 'B+',  'comp' => 'Red Cells',   'units' => 1, 'urg' => 'WITHIN_6_HOURS',  'hosp' => 'Dhaka Medical College Hospital',      'requester' => 0, 'status' => 'FULFILLED'],
            ['code' => 'RLB-26-DEMO12', 'bg' => 'O+',  'comp' => 'Red Cells',   'units' => 1, 'urg' => 'EMERGENCY_NOW',    'hosp' => 'Mitford Hospital, Dhaka',             'requester' => 1, 'status' => 'FULFILLED'],
            // Active OPEN requests
            ['code' => 'RLB-26-LIVE01', 'bg' => 'O-',  'comp' => 'Red Cells',   'units' => 2, 'urg' => 'EMERGENCY_NOW',    'hosp' => 'Dhaka Medical College Hospital',      'requester' => 2, 'status' => 'SEARCHING'],
            ['code' => 'RLB-26-LIVE02', 'bg' => 'B+',  'comp' => 'Platelets',   'units' => 1, 'urg' => 'TODAY',            'hosp' => 'Chattogram Medical College Hospital', 'requester' => 3, 'status' => 'SEARCHING'],
            ['code' => 'RLB-26-LIVE03', 'bg' => 'A+',  'comp' => 'Whole Blood', 'units' => 3, 'urg' => 'EMERGENCY_NOW',    'hosp' => 'Sylhet MAG Osmani Medical College',   'requester' => 4, 'status' => 'SEARCHING'],
            ['code' => 'RLB-26-LIVE04', 'bg' => 'AB-', 'comp' => 'Plasma',      'units' => 1, 'urg' => 'WITHIN_6_HOURS',  'hosp' => 'Rajshahi Medical College Hospital',   'requester' => 0, 'status' => 'SEARCHING'],
            ['code' => 'RLB-26-LIVE05', 'bg' => 'O+',  'comp' => 'Red Cells',   'units' => 2, 'urg' => 'TODAY',            'hosp' => 'National Heart Foundation Hospital',  'requester' => 1, 'status' => 'SEARCHING'],
            ['code' => 'RLB-26-LIVE06', 'bg' => 'B-',  'comp' => 'Red Cells',   'units' => 1, 'urg' => 'NORMAL',           'hosp' => 'BSMMU (PG Hospital), Dhaka',          'requester' => 2, 'status' => 'SEARCHING'],
        ];

        $createdRequests = [];
        foreach ($requestData as $r) {
            $requester = $requesterUsers[$r['requester']];
            $req = BloodRequest::firstOrCreate(
                ['request_code' => $r['code']],
                [
                    'requester_id'     => $requester->id,
                    'blood_group'      => $r['bg'],
                    'component'        => $r['comp'],
                    'units_required'   => $r['units'],
                    'units_completed'  => $r['status'] === 'FULFILLED' ? $r['units'] : 0,
                    'urgency'          => $r['urg'],
                    'facility_name'    => $r['hosp'],
                    'address_text'     => 'Bangladesh',
                    'requester_phone'  => $requester->phone,
                    'required_at'      => now()->addHours(4),
                    'status'           => $r['status'],
                    'closed_at'        => $r['status'] === 'FULFILLED' ? now()->subDays(rand(10, 200)) : null,
                ]
            );
            $createdRequests[] = $req;
        }

        // ─────────────────────────────────────────────────────────────────────
        // CREATE DONATIONS (with Wall of Lifesavers entries)
        // ─────────────────────────────────────────────────────────────────────

        // Map blood group compatibility for donations
        $compatibility = [
            'A+'  => ['A+', 'A-', 'O+', 'O-'],
            'A-'  => ['A-', 'O-'],
            'B+'  => ['B+', 'B-', 'O+', 'O-'],
            'B-'  => ['B-', 'O-'],
            'AB+' => ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
            'AB-' => ['AB-', 'A-', 'B-', 'O-'],
            'O+'  => ['O+', 'O-'],
            'O-'  => ['O-'],
        ];

        // Only fulfilled requests (first 12) should have donations
        $fulfilledRequests = array_slice($createdRequests, 0, 12);
        $noteIdx = 0;

        foreach ($donorProfiles as $donorItem) {
            $profile = $donorItem['profile'];
            $count   = $donorItem['count'];
            $bg      = $donorItem['bg'];
            if ($count === 0) continue;

            $donated = 0;
            foreach ($fulfilledRequests as $req) {
                if ($donated >= $count) break;

                // Check blood compatibility
                $compatibleForRequest = $compatibility[$req->blood_group] ?? [];
                if (!in_array($bg, $compatibleForRequest)) continue;

                // Check same-donor-same-request uniqueness
                $alreadyDonated = Donation::where('donor_profile_id', $profile->id)
                    ->where('blood_request_id', $req->id)
                    ->exists();
                if ($alreadyDonated) continue;

                $monthsAgo = rand(2, 30);
                Donation::create([
                    'uuid'                => (string) Str::uuid(),
                    'blood_request_id'    => $req->id,
                    'donor_profile_id'    => $profile->id,
                    'facility_name'       => $req->facility_name,
                    'component'           => $req->component ?? 'Red Cells',
                    'units'               => 1,
                    'donated_at'          => now()->subMonths($monthsAgo)->subDays(rand(0, 28)),
                    'status'              => 'CONFIRMED',
                    'donor_confirmed'     => true,
                    'requester_confirmed' => true,
                    'volunteer_verified'  => true,
                    'is_public_wall'      => true,
                    'certificate_code'    => 'CERT-' . strtoupper(Str::random(10)),
                    'gratitude_note'      => $gratitudeNotes[$noteIdx % count($gratitudeNotes)],
                ]);

                $donated++;
                $noteIdx++;
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // CREATE VOLUNTEERS
        // ─────────────────────────────────────────────────────────────────────
        $volunteersData = [
            ['name' => 'Mehedi Hasan',      'email' => 'mehedi.vol@roktolink.test',   'phone' => '01733300001'],
            ['name' => 'Anika Tabassum',    'email' => 'anika.vol@roktolink.test',    'phone' => '01733300002'],
            ['name' => 'Zubair Al Mahmud',  'email' => 'zubair.vol@roktolink.test',   'phone' => '01733300003'],
            ['name' => 'Shapna Akter',      'email' => 'shapna.vol@roktolink.test',   'phone' => '01733300004'],
        ];

        foreach ($volunteersData as $v) {
            $u = User::firstOrCreate(
                ['email' => $v['email']],
                [
                    'name'             => $v['name'],
                    'phone'            => $v['phone'],
                    'password'         => Hash::make('password123'),
                    'status'           => 'ACTIVE',
                    'email_verified_at'=> now(),
                ]
            );

            VolunteerProfile::firstOrCreate(
                ['user_id' => $u->id],
                [
                    'volunteer_code'           => 'VOL-' . strtoupper(Str::random(6)),
                    'emergency_contact_phone'  => $v['phone'],
                    'verification_status'      => 'APPROVED',
                    'verified_at'              => now()->subDays(rand(10, 90)),
                ]
            );
        }

        $this->command->info('✅ RichDemoSeeder complete!');
        $this->command->info('   → ' . count($donorProfiles) . ' donors created (all blood groups)');
        $this->command->info('   → ' . count($createdRequests) . ' blood requests (12 FULFILLED + 6 SEARCHING)');
        $this->command->info('   → Donations seeded with Wall of Lifesavers entries');
        $this->command->info('   → 4 approved volunteers created');
    }
}
