<?php

namespace Database\Seeders;

use App\Models\Location;
use Illuminate\Database\Seeder;

class BangladeshLocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Root Country: Bangladesh
        $country = Location::firstOrCreate(
            ['type' => 'COUNTRY', 'name_en' => 'Bangladesh'],
            [
                'name_bn' => 'বাংলাদেশ',
                'official_code' => 'BD',
                'latitude' => 23.684994,
                'longitude' => 90.356331,
                'is_active' => true,
                'sort_order' => 1,
            ]
        );

        // 2. All 8 Divisions
        $divisionsData = [
            'Dhaka' => [
                'name_bn' => 'ঢাকা',
                'lat' => 23.8103,
                'lng' => 90.4125,
                'districts' => [
                    ['Dhaka', 'ঢাকা', 23.8103, 90.4125, [
                        ['Dhanmondi', 'ধানমন্ডি', 23.7461, 90.3742],
                        ['Mirpur', 'মিরপুর', 23.8223, 90.3654],
                        ['Uttara', 'উত্তরা', 23.8759, 90.3795],
                        ['Gulshan', 'গুলশান', 23.7925, 90.4078],
                        ['Mohammadpur', 'মোহাম্মদপুর', 23.7658, 90.3584],
                        ['Savar', 'সাভার', 23.8583, 90.2667],
                        ['Keraniganj', 'কেরানীগঞ্জ', 23.6833, 90.3167],
                    ]],
                    ['Gazipur', 'গাজীপুর', 24.0023, 90.4264, [
                        ['Gazipur Sadar', 'গাজীপুর সদর', 24.0000, 90.4333],
                        ['Kaliakair', 'কালিয়াকৈর', 24.0667, 90.2333],
                        ['Kapasia', 'কাপাসিয়া', 24.1000, 90.5667],
                        ['Sreepur', 'শ্রীপুর', 24.2000, 90.4667],
                    ]],
                    ['Narayanganj', 'নারায়ণগঞ্জ', 23.6238, 90.5000, [
                        ['Narayanganj Sadar', 'নারায়ণগঞ্জ সদর', 23.6238, 90.5000],
                        ['Araihazar', 'আড়াইহাজার', 23.7833, 90.6500],
                        ['Sonargaon', 'সোনারগাঁ', 23.6500, 90.6000],
                    ]],
                    ['Tangail', 'টাঙ্গাইল', 24.2513, 89.9167, []],
                    ['Kishoreganj', 'কিশোরগঞ্জ', 24.4449, 90.7766, []],
                    ['Manikganj', 'মানিকগঞ্জ', 23.8644, 90.0047, []],
                    ['Munshiganj', 'মুন্সীগঞ্জ', 23.5422, 90.5305, []],
                    ['Narsingdi', 'নরসিংদী', 23.9193, 90.7202, []],
                    ['Faridpur', 'ফরিদপুর', 23.6071, 89.8429, []],
                    ['Gopalganj', 'গোপালগঞ্জ', 23.0051, 89.8266, []],
                    ['Madaripur', 'মাদারীপুর', 23.1641, 90.1897, []],
                    ['Rajbari', 'রাজবাড়ী', 23.7574, 89.6445, []],
                    ['Shariatpur', 'শরীয়তপুর', 23.2423, 90.4348, []],
                ],
            ],
            'Chattogram' => [
                'name_bn' => 'চট্টগ্রাম',
                'lat' => 22.3569,
                'lng' => 91.7832,
                'districts' => [
                    ['Chattogram', 'চট্টগ্রাম', 22.3569, 91.7832, [
                        ['Panchlaish', 'পাঁচলাইশ', 22.3667, 91.8333],
                        ['Kotwali', 'কোতোয়ালী', 22.3384, 91.8317],
                        ['Hathazari', 'হাটহাজারী', 22.5083, 91.8083],
                    ]],
                    ['Cox\'s Bazar', 'কক্সবাজার', 21.4272, 92.0058, [
                        ['Cox\'s Bazar Sadar', 'কক্সবাজার সদর', 21.4333, 91.9833],
                        ['Teknaf', 'টেকনাফ', 20.8667, 92.3000],
                    ]],
                    ['Cumilla', 'কুমিল্লা', 23.4607, 91.1809, []],
                    ['Feni', 'ফেনী', 23.0159, 91.3976, []],
                    ['Brahmanbaria', 'ব্রাহ্মণবাড়িয়া', 23.9571, 91.1119, []],
                    ['Noakhali', 'নোয়াখালী', 22.8696, 91.0998, []],
                    ['Chandpur', 'চাঁদপুর', 23.2333, 90.6667, []],
                    ['Lakshmipur', 'লক্ষ্মীপুর', 22.9425, 90.8412, []],
                    ['Rangamati', 'রাঙ্গামাটি', 22.6533, 92.1753, []],
                    ['Khagrachhari', 'খাগড়াছড়ি', 23.1193, 91.9847, []],
                    ['Bandarban', 'বান্দরবান', 22.1953, 92.2184, []],
                ],
            ],
            'Rajshahi' => [
                'name_bn' => 'রাজশাহী',
                'lat' => 24.3636,
                'lng' => 88.6241,
                'districts' => [
                    ['Rajshahi', 'রাজশাহী', 24.3636, 88.6241, [
                        ['Boalia', 'বোয়ালিয়া', 24.3667, 88.6000],
                        ['Paba', 'পবা', 24.4333, 88.6500],
                    ]],
                    ['Bogura', 'বগুড়া', 24.8465, 89.3777, []],
                    ['Pabna', 'পাবনা', 24.0064, 89.2372, []],
                    ['Sirajganj', 'সিরাজগঞ্জ', 24.4534, 89.7008, []],
                    ['Naogaon', 'নওগাঁ', 24.7936, 88.9318, []],
                    ['Natore', 'নাটোর', 24.4206, 88.9324, []],
                    ['Chapainawabganj', 'চাঁপাইনবাবগঞ্জ', 24.5965, 88.2775, []],
                    ['Joypurhat', 'জয়পুরহাট', 25.0968, 89.0227, []],
                ],
            ],
            'Khulna' => [
                'name_bn' => 'খুলনা',
                'lat' => 22.8456,
                'lng' => 89.5403,
                'districts' => [
                    ['Khulna', 'খুলনা', 22.8456, 89.5403, [
                        ['Khulna Sadar', 'খুলনা সদর', 22.8167, 89.5500],
                        ['Rupsha', 'রূপসা', 22.8333, 89.5833],
                    ]],
                    ['Jashore', 'যশোর', 23.1664, 89.2081, []],
                    ['Satkhira', 'সাতক্ষীরা', 22.7185, 89.0705, []],
                    ['Kushtia', 'কুষ্টিয়া', 23.9013, 89.1205, []],
                    ['Chuadanga', 'চুয়াডাঙ্গা', 23.6402, 88.8418, []],
                    ['Jhenaidah', 'ঝিনাইদহ', 23.5450, 89.1726, []],
                    ['Magura', 'মাগুরা', 23.4873, 89.4198, []],
                    ['Meherpur', 'মেহেরপুর', 23.7622, 88.6318, []],
                    ['Narail', 'নড়াইল', 23.1725, 89.5127, []],
                    ['Bagerhat', 'বাগেরহাট', 22.6516, 89.7859, []],
                ],
            ],
            'Barishal' => [
                'name_bn' => 'বরিশাল',
                'lat' => 22.7010,
                'lng' => 90.3535,
                'districts' => [
                    ['Barishal', 'বরিশাল', 22.7010, 90.3535, [
                        ['Barishal Sadar', 'বরিশাল সদর', 22.7000, 90.3667],
                        ['Babuganj', 'বাবুগঞ্জ', 22.8333, 90.3167],
                    ]],
                    ['Bhola', 'ভোলা', 22.6859, 90.6482, [
                        ['Bhola Sadar', 'ভোলা সদর', 22.6833, 90.6500],
                        ['Char Fasson', 'চরফ্যাশন', 22.1833, 90.7167],
                    ]],
                    ['Patuakhali', 'পটুয়াখালী', 22.3596, 90.3298, []],
                    ['Pirojpur', 'পিরোজপুর', 22.5841, 89.9720, []],
                    ['Barguna', 'বরগুনা', 22.0953, 90.1121, []],
                    ['Jhalokati', 'ঝালকাঠি', 22.6406, 90.1987, []],
                ],
            ],
            'Sylhet' => [
                'name_bn' => 'সিলেট',
                'lat' => 24.8949,
                'lng' => 91.8687,
                'districts' => [
                    ['Sylhet', 'সিলেট', 24.8949, 91.8687, [
                        ['Sylhet Sadar', 'সিলেট সদর', 24.8917, 91.8833],
                        ['Beanibazar', 'বিয়ানীবাজার', 24.8250, 92.1667],
                    ]],
                    ['Moulvibazar', 'মৌলভীবাজার', 24.4829, 91.7774, []],
                    ['Habiganj', 'হবিগঞ্জ', 24.3749, 91.4155, []],
                    ['Sunamganj', 'সুনামগঞ্জ', 25.0658, 91.3950, []],
                ],
            ],
            'Rangpur' => [
                'name_bn' => 'রংপুর',
                'lat' => 25.7439,
                'lng' => 89.2752,
                'districts' => [
                    ['Rangpur', 'রংপুর', 25.7439, 89.2752, [
                        ['Rangpur Sadar', 'রংপুর সদর', 25.7500, 89.2500],
                        ['Badarganj', 'বদরগঞ্জ', 25.6833, 89.0500],
                    ]],
                    ['Dinajpur', 'দিনাজপুর', 25.6217, 88.6354, []],
                    ['Kurigram', 'কুড়িগ্রাম', 25.8054, 89.6362, []],
                    ['Gaibandha', 'গাইবান্ধা', 25.3288, 89.5430, []],
                    ['Nilphamari', 'নীলফামারী', 25.9318, 88.8560, []],
                    ['Lalmonirhat', 'লালমনিরহাট', 25.9923, 89.2847, []],
                    ['Thakurgaon', 'ঠাকুরগাঁও', 26.0337, 88.4617, []],
                    ['Panchagarh', 'পঞ্চগড়', 26.3411, 88.5542, []],
                ],
            ],
            'Mymensingh' => [
                'name_bn' => 'ময়মনসিংহ',
                'lat' => 24.7471,
                'lng' => 90.4203,
                'districts' => [
                    ['Mymensingh', 'ময়মনসিংহ', 24.7471, 90.4203, [
                        ['Mymensingh Sadar', 'ময়মনসিংহ সদর', 24.7500, 90.4000],
                        ['Trishal', 'ত্রিশাল', 24.5833, 90.4000],
                    ]],
                    ['Jamalpur', 'জামালপুর', 24.9375, 89.9378, []],
                    ['Netrokona', 'নেত্রকোণা', 24.8709, 90.7279, []],
                    ['Sherpur', 'শেরপুর', 25.0205, 90.0153, []],
                ],
            ],
        ];

        $divOrder = 1;
        foreach ($divisionsData as $divName => $divInfo) {
            $division = Location::firstOrCreate(
                ['type' => 'DIVISION', 'name_en' => $divName, 'parent_id' => $country->id],
                [
                    'name_bn' => $divInfo['name_bn'],
                    'latitude' => $divInfo['lat'],
                    'longitude' => $divInfo['lng'],
                    'is_active' => true,
                    'sort_order' => $divOrder++,
                ]
            );

            $distOrder = 1;
            foreach ($divInfo['districts'] as $dist) {
                [$distNameEn, $distNameBn, $distLat, $distLng, $upazilas] = $dist;

                $district = Location::firstOrCreate(
                    ['type' => 'DISTRICT', 'name_en' => $distNameEn, 'parent_id' => $division->id],
                    [
                        'name_bn' => $distNameBn,
                        'latitude' => $distLat,
                        'longitude' => $distLng,
                        'is_active' => true,
                        'sort_order' => $distOrder++,
                    ]
                );

                $upzOrder = 1;
                foreach ($upazilas as $upz) {
                    [$upzNameEn, $upzNameBn, $upzLat, $upzLng] = $upz;

                    Location::firstOrCreate(
                        ['type' => 'UPAZILA', 'name_en' => $upzNameEn, 'parent_id' => $district->id],
                        [
                            'name_bn' => $upzNameBn,
                            'latitude' => $upzLat,
                            'longitude' => $upzLng,
                            'is_active' => true,
                            'sort_order' => $upzOrder++,
                        ]
                    );
                }
            }
        }
    }
}
