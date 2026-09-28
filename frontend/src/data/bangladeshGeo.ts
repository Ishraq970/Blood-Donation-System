export interface UpazilaInfo {
  nameEn: string;
  nameBn: string;
  lat?: number;
  lng?: number;
}

export interface DistrictInfo {
  nameEn: string;
  nameBn: string;
  lat: number;
  lng: number;
  upazilas: string[];
}

export interface DivisionInfo {
  nameEn: string;
  nameBn: string;
  lat: number;
  lng: number;
  districts: Record<string, DistrictInfo>;
}

export const BANGLADESH_GEO: Record<string, DivisionInfo> = {
  'Dhaka': {
    nameEn: 'Dhaka',
    nameBn: 'ঢাকা',
    lat: 23.8103,
    lng: 90.4125,
    districts: {
      'Dhaka': {
        nameEn: 'Dhaka',
        nameBn: 'ঢাকা',
        lat: 23.8103,
        lng: 90.4125,
        upazilas: [
          'Dhanmondi', 'Mirpur', 'Uttara', 'Gulshan', 'Mohammadpur', 'Savar', 'Keraniganj',
          'Motijheel', 'Badda', 'Khilgaon', 'Tejgaon', 'Paltan', 'Ramna', 'Shahbagh', 'Lalbagh',
          'Jatrabari', 'Demra', 'Kafrul', 'Pallabi', 'Banani', 'Khilkhet', 'Vatara', 'Dhamrai', 'Nawabganj', 'Dohar'
        ],
      },
      'Gazipur': {
        nameEn: 'Gazipur',
        nameBn: 'গাজীপুর',
        lat: 24.0023,
        lng: 90.4264,
        upazilas: ['Gazipur Sadar', 'Tongi', 'Kaliakair', 'Kaliganj', 'Kapasia', 'Sreepur'],
      },
      'Narayanganj': {
        nameEn: 'Narayanganj',
        nameBn: 'নারায়ণগঞ্জ',
        lat: 23.6238,
        lng: 90.5000,
        upazilas: ['Narayanganj Sadar', 'Bandar', 'Rupganj', 'Sonargaon', 'Araihazar', 'Siddhirganj', 'Fatullah'],
      },
      'Narsingdi': {
        nameEn: 'Narsingdi',
        nameBn: 'নরসিংদী',
        lat: 23.9193,
        lng: 90.7202,
        upazilas: ['Narsingdi Sadar', 'Belabo', 'Monohardi', 'Palash', 'Raipura', 'Shibpur'],
      },
      'Manikganj': {
        nameEn: 'Manikganj',
        nameBn: 'মানিকগঞ্জ',
        lat: 23.8644,
        lng: 90.0047,
        upazilas: ['Manikganj Sadar', 'Singair', 'Shibalaya', 'Saturia', 'Harirampur', 'Ghior', 'Daulatpur'],
      },
      'Munshiganj': {
        nameEn: 'Munshiganj',
        nameBn: 'মুন্সীগঞ্জ',
        lat: 23.5422,
        lng: 90.5305,
        upazilas: ['Munshiganj Sadar', 'Tongibari', 'Sreenagar', 'Louhajang', 'Gazaria', 'Sirajdikhan'],
      },
      'Rajbari': {
        nameEn: 'Rajbari',
        nameBn: 'রাজবাড়ী',
        lat: 23.7574,
        lng: 89.6445,
        upazilas: ['Rajbari Sadar', 'Goalanda', 'Pangsha', 'Baliakandi', 'Kalukhali'],
      },
      'Faridpur': {
        nameEn: 'Faridpur',
        nameBn: 'ফরিদপুর',
        lat: 23.6071,
        lng: 89.8429,
        upazilas: ['Faridpur Sadar', 'Boalmari', 'Alfadanga', 'Madhukhali', 'Bhanga', 'Nagarkanda', 'Charbhadrasan', 'Sadarpur', 'Saltha'],
      },
      'Gopalganj': {
        nameEn: 'Gopalganj',
        nameBn: 'গোপালগঞ্জ',
        lat: 23.0051,
        lng: 89.8266,
        upazilas: ['Gopalganj Sadar', 'Kashiani', 'Kotalipara', 'Muksudpur', 'Tungipara'],
      },
      'Madaripur': {
        nameEn: 'Madaripur',
        nameBn: 'মাদারীপুর',
        lat: 23.1641,
        lng: 90.1897,
        upazilas: ['Madaripur Sadar', 'Shibchar', 'Kalkini', 'Rajoir', 'Dasar'],
      },
      'Shariatpur': {
        nameEn: 'Shariatpur',
        nameBn: 'শরীয়তপুর',
        lat: 23.2423,
        lng: 90.4348,
        upazilas: ['Shariatpur Sadar', 'Damudya', 'Naria', 'Jajira', 'Bhedarganj', 'Gosairhat'],
      },
      'Kishoreganj': {
        nameEn: 'Kishoreganj',
        nameBn: 'কিশোরগঞ্জ',
        lat: 24.4449,
        lng: 90.7766,
        upazilas: ['Kishoreganj Sadar', 'Bajitpur', 'Bhairab', 'Hossainpur', 'Itna', 'Karimganj', 'Katiadi', 'Kuliarchar', 'Mithamain', 'Nikli', 'Pakundia', 'Tarail'],
      },
      'Tangail': {
        nameEn: 'Tangail',
        nameBn: 'টাঙ্গাইল',
        lat: 24.2513,
        lng: 89.9167,
        upazilas: ['Tangail Sadar', 'Basail', 'Bhuapur', 'Delduar', 'Dhanbari', 'Ghatail', 'Gopalpur', 'Kalihati', 'Madhupur', 'Mirzapur', 'Nagarpur', 'Sakhipur'],
      },
    },
  },
  'Chattogram': {
    nameEn: 'Chattogram',
    nameBn: 'চট্টগ্রাম',
    lat: 22.3569,
    lng: 91.7832,
    districts: {
      'Chattogram': {
        nameEn: 'Chattogram',
        nameBn: 'চট্টগ্রাম',
        lat: 22.3569,
        lng: 91.7832,
        upazilas: [
          'Kotwali', 'Panchlaish', 'Pahartali', 'Halishahar', 'Double Mooring', 'Bandar', 'Bayezid', 'Chandgaon', 'Khulshi', 'Patenga',
          'Anwara', 'Banshkhali', 'Boalkhali', 'Chandanaish', 'Fatikchhari', 'Hathazari', 'Karnaphuli', 'Lohagara', 'Mirsharai', 'Patiya', 'Rangunia', 'Raozan', 'Sandwip', 'Satkania', 'Sitakunda'
        ],
      },
      "Cox's Bazar": {
        nameEn: "Cox's Bazar",
        nameBn: 'কক্সবাজার',
        lat: 21.4272,
        lng: 92.0058,
        upazilas: ["Cox's Bazar Sadar", 'Chakaria', 'Maheshkhali', 'Teknaf', 'Ramu', 'Ukhiya', 'Pekua', 'Kutubdia', 'Eidgaon'],
      },
      'Cumilla': {
        nameEn: 'Cumilla',
        nameBn: 'কুমিল্লা',
        lat: 23.4607,
        lng: 91.1809,
        upazilas: [
          'Cumilla Adarsha Sadar', 'Cumilla Sadar Dakshin', 'Barura', 'Brahmanpara', 'Burichang', 'Chandina', 'Chauddagram', 'Daudkandi',
          'Debidwar', 'Homna', 'Laksam', 'Lalmai', 'Meghna', 'Monohargonj', 'Muradnagar', 'Nangalkot', 'Titas'
        ],
      },
      'Feni': {
        nameEn: 'Feni',
        nameBn: 'ফেনী',
        lat: 23.0159,
        lng: 91.3976,
        upazilas: ['Feni Sadar', 'Chhagalnaiya', 'Daganbhuiyan', 'Parshuram', 'Fhulgazi', 'Sonagazi'],
      },
      'Brahmanbaria': {
        nameEn: 'Brahmanbaria',
        nameBn: 'ব্রাহ্মণবাড়িয়া',
        lat: 23.9571,
        lng: 91.1119,
        upazilas: ['Brahmanbaria Sadar', 'Ashuganj', 'Nasirnagar', 'Nabinagar', 'Sarail', 'Kasba', 'Akhaura', 'Bancharampur', 'Bijoynagar'],
      },
      'Noakhali': {
        nameEn: 'Noakhali',
        nameBn: 'নোয়াখালী',
        lat: 22.8696,
        lng: 91.0998,
        upazilas: ['Noakhali Sadar', 'Begumganj', 'Chatkhil', 'Companiganj', 'Hatiya', 'Senbagh', 'Sonaimuri', 'Subarnachar', 'Kabirhat'],
      },
      'Chandpur': {
        nameEn: 'Chandpur',
        nameBn: 'চাঁদপুর',
        lat: 23.2333,
        lng: 90.6667,
        upazilas: ['Chandpur Sadar', 'Faridganj', 'Haimchar', 'Haziganj', 'Kachua', 'Matlab Dakshin', 'Matlab Uttar', 'Shahrasti'],
      },
      'Lakshmipur': {
        nameEn: 'Lakshmipur',
        nameBn: 'লক্ষ্মীপুর',
        lat: 22.9425,
        lng: 90.8412,
        upazilas: ['Lakshmipur Sadar', 'Raipur', 'Ramganj', 'Ramgati', 'Kamalnagar'],
      },
      'Rangamati': {
        nameEn: 'Rangamati',
        nameBn: 'রাঙ্গামাটি',
        lat: 22.6533,
        lng: 92.1753,
        upazilas: ['Rangamati Sadar', 'Belaichhari', 'Bagaichhari', 'Barkal', 'Juraichhari', 'Kaptai', 'Kawkhali', 'Langadu', 'Naniarchar', 'Rajasthali'],
      },
      'Khagrachhari': {
        nameEn: 'Khagrachhari',
        nameBn: 'খাগড়াছড়ি',
        lat: 23.1193,
        lng: 91.9847,
        upazilas: ['Khagrachhari Sadar', 'Dighinala', 'Panchhari', 'Mahalchhari', 'Matiranga', 'Manikchhari', 'Ramgarh', 'Guimara', 'Lakshmichhari'],
      },
      'Bandarban': {
        nameEn: 'Bandarban',
        nameBn: 'বান্দরবান',
        lat: 22.1953,
        lng: 92.2184,
        upazilas: ['Bandarban Sadar', 'Alikadam', 'Naikhyongchhari', 'Rowangchhari', 'Ruma', 'Thanchi', 'Lama'],
      },
    },
  },
  'Sylhet': {
    nameEn: 'Sylhet',
    nameBn: 'সিলেট',
    lat: 24.8949,
    lng: 91.8687,
    districts: {
      'Sylhet': {
        nameEn: 'Sylhet',
        nameBn: 'সিলেট',
        lat: 24.8949,
        lng: 91.8687,
        upazilas: ['Sylhet Sadar', 'Beanibazar', 'Bishwanath', 'Companiganj', 'Fenchuganj', 'Golapganj', 'Gowainghat', 'Jaintiapur', 'Kanaighat', 'Zakiganj', 'Dakshin Surma', 'Osmani Nagar', 'Balaganj'],
      },
      'Moulvibazar': {
        nameEn: 'Moulvibazar',
        nameBn: 'মৌলভীবাজার',
        lat: 24.4829,
        lng: 91.7774,
        upazilas: ['Moulvibazar Sadar', 'Barlekha', 'Juri', 'Kamalganj', 'Kulaura', 'Rajnagar', 'Sreemangal'],
      },
      'Habiganj': {
        nameEn: 'Habiganj',
        nameBn: 'হবিগঞ্জ',
        lat: 24.3749,
        lng: 91.4155,
        upazilas: ['Habiganj Sadar', 'Ajmiriganj', 'Bahubal', 'Baniyachong', 'Chunarughat', 'Lakhai', 'Madhabpur', 'Nabiganj', 'Sayestaganj'],
      },
      'Sunamganj': {
        nameEn: 'Sunamganj',
        nameBn: 'সুনামগঞ্জ',
        lat: 25.0658,
        lng: 91.3950,
        upazilas: ['Sunamganj Sadar', 'Bishwamvarpur', 'Chhatak', 'Derai', 'Dharamapasha', 'Dowarabazar', 'Jagannathpur', 'Jamalganj', 'Sullah', 'Tahirpur', 'Shantiganj', 'Madhyanagar'],
      },
    },
  },
  'Rajshahi': {
    nameEn: 'Rajshahi',
    nameBn: 'রাজশাহী',
    lat: 24.3636,
    lng: 88.6241,
    districts: {
      'Rajshahi': {
        nameEn: 'Rajshahi',
        nameBn: 'রাজশাহী',
        lat: 24.3636,
        lng: 88.6241,
        upazilas: ['Boalia', 'Motihar', 'Rajpara', 'Shah Makhdum', 'Chandrima', 'Katakhali', 'Paba', 'Durgapur', 'Bagmara', 'Charghat', 'Puthia', 'Bagha', 'Godagari', 'Tanore', 'Mohanpur'],
      },
      'Bogura': {
        nameEn: 'Bogura',
        nameBn: 'বগুড়া',
        lat: 24.8465,
        lng: 89.3770,
        upazilas: ['Bogura Sadar', 'Adamdighi', 'Dhunat', 'Dhupchanchia', 'Gabtali', 'Kahaloo', 'Nandigram', 'Sariakandi', 'Shajahanpur', 'Sherpur', 'Shibganj', 'Sonatala'],
      },
      'Pabna': {
        nameEn: 'Pabna',
        nameBn: 'পাবনা',
        lat: 24.0064,
        lng: 89.2372,
        upazilas: ['Pabna Sadar', 'Atgharia', 'Bera', 'Bhangura', 'Chatmohar', 'Faridpur', 'Ishwardi', 'Santhia', 'Sujanagar'],
      },
      'Sirajganj': {
        nameEn: 'Sirajganj',
        nameBn: 'সিরাজগঞ্জ',
        lat: 24.4534,
        lng: 89.7008,
        upazilas: ['Sirajganj Sadar', 'Belkuchi', 'Chauhali', 'Kamarkhanda', 'Kazipur', 'Raiganj', 'Shahjadpur', 'Tarash', 'Ullahpara'],
      },
      'Naogaon': {
        nameEn: 'Naogaon',
        nameBn: 'নওগাঁ',
        lat: 24.7936,
        lng: 88.9318,
        upazilas: ['Naogaon Sadar', 'Atrai', 'Badalgachhi', 'Dhamoirhat', 'Manda', 'Mohadevpur', 'Niamatpur', 'Patnitala', 'Porsha', 'Raninagar', 'Sapahar'],
      },
      'Natore': {
        nameEn: 'Natore',
        nameBn: 'নাটোর',
        lat: 24.4206,
        lng: 89.0003,
        upazilas: ['Natore Sadar', 'Bagatipara', 'Baraigram', 'Gurudaspur', 'Lalpur', 'Singra', 'Naldanga'],
      },
      'Chapainawabganj': {
        nameEn: 'Chapainawabganj',
        nameBn: 'চাঁপাইনবাবগঞ্জ',
        lat: 24.5965,
        lng: 88.2775,
        upazilas: ['Chapainawabganj Sadar', 'Bholahat', 'Gomastapur', 'Nachole', 'Shibganj'],
      },
      'Joypurhat': {
        nameEn: 'Joypurhat',
        nameBn: 'জয়পুরহাট',
        lat: 25.0947,
        lng: 89.0277,
        upazilas: ['Joypurhat Sadar', 'Akkelpur', 'Kalai', 'Khetlal', 'Panchbibi'],
      },
    },
  },
  'Khulna': {
    nameEn: 'Khulna',
    nameBn: 'খুলনা',
    lat: 22.8456,
    lng: 89.5403,
    districts: {
      'Khulna': {
        nameEn: 'Khulna',
        nameBn: 'খুলনা',
        lat: 22.8456,
        lng: 89.5403,
        upazilas: [
          'Khulna Sadar', 'Daulatpur', 'Khalishpur', 'Khan Jahan Ali', 'Kotwali', 'Sonadanga', 'Harintana',
          'Batiaghata', 'Dacope', 'Dumuria', 'Dighalia', 'Koyra', 'Paikgachha', 'Phultala', 'Rupsha', 'Terokhada'
        ],
      },
      'Jashore': {
        nameEn: 'Jashore',
        nameBn: 'যশোর',
        lat: 23.1664,
        lng: 89.2081,
        upazilas: ['Jashore Sadar', 'Abhaynagar', 'Bagherpara', 'Chaugachha', 'Jhikargachha', 'Keshabpur', 'Manirampur', 'Sharsha'],
      },
      'Kushtia': {
        nameEn: 'Kushtia',
        nameBn: 'কুষ্টিয়া',
        lat: 23.9013,
        lng: 89.1204,
        upazilas: ['Kushtia Sadar', 'Bheramara', 'Daulatpur', 'Khoksa', 'Kumarkhali', 'Mirpur'],
      },
      'Jhenaidah': {
        nameEn: 'Jhenaidah',
        nameBn: 'ঝিনাইদহ',
        lat: 23.5450,
        lng: 89.1726,
        upazilas: ['Jhenaidah Sadar', 'Harinakundu', 'Kaliganj', 'Kotchandpur', 'Maheshpur', 'Shailkupa'],
      },
      'Bagerhat': {
        nameEn: 'Bagerhat',
        nameBn: 'বাগেরহাট',
        lat: 22.6516,
        lng: 89.7859,
        upazilas: ['Bagerhat Sadar', 'Chitalmari', 'Fakirhat', 'Kachua', 'Mollahat', 'Mongla', 'Morrelganj', 'Rampal', 'Sarankhola'],
      },
      'Satkhira': {
        nameEn: 'Satkhira',
        nameBn: 'সাতক্ষীরা',
        lat: 22.7185,
        lng: 89.0705,
        upazilas: ['Satkhira Sadar', 'Assasuni', 'Debhata', 'Kalaroa', 'Kaliganj', 'Shyamnagar', 'Tala'],
      },
      'Chuadanga': {
        nameEn: 'Chuadanga',
        nameBn: 'চুয়াডাঙ্গা',
        lat: 23.6402,
        lng: 88.8418,
        upazilas: ['Chuadanga Sadar', 'Alamdanga', 'Damurhuda', 'Jibannagar'],
      },
      'Magura': {
        nameEn: 'Magura',
        nameBn: 'মাগুরা',
        lat: 23.4873,
        lng: 89.4199,
        upazilas: ['Magura Sadar', 'Mohammadpur', 'Shalikha', 'Sreepur'],
      },
      'Meherpur': {
        nameEn: 'Meherpur',
        nameBn: 'মেহেরপুর',
        lat: 23.7622,
        lng: 88.6318,
        upazilas: ['Meherpur Sadar', 'Gangni', 'Mujibnagar'],
      },
      'Narail': {
        nameEn: 'Narail',
        nameBn: 'নড়াইল',
        lat: 23.1725,
        lng: 89.5127,
        upazilas: ['Narail Sadar', 'Kalia', 'Lohagara'],
      },
    },
  },
  'Barishal': {
    nameEn: 'Barishal',
    nameBn: 'বরিশাল',
    lat: 22.7010,
    lng: 90.3535,
    districts: {
      'Barishal': {
        nameEn: 'Barishal',
        nameBn: 'বরিশাল',
        lat: 22.7010,
        lng: 90.3535,
        upazilas: ['Barishal Sadar', 'Agailjhara', 'Babuganj', 'Bakerganj', 'Banaripara', 'Gaurnadi', 'Hizla', 'Mehendiganj', 'Muladi', 'Wazirpur', 'Kotwali'],
      },
      'Patuakhali': {
        nameEn: 'Patuakhali',
        nameBn: 'পটুয়াখালী',
        lat: 22.3596,
        lng: 90.3299,
        upazilas: ['Patuakhali Sadar', 'Bauphal', 'Dashmina', 'Galachipa', 'Kalapara', 'Mirzaganj', 'Rangabali', 'Dumki'],
      },
      'Bhola': {
        nameEn: 'Bhola',
        nameBn: 'ভোলা',
        lat: 22.6859,
        lng: 90.6482,
        upazilas: ['Bhola Sadar', 'Borhanuddin', 'Char Fasson', 'Daulatkhan', 'Lalmohan', 'Manpura', 'Tazumuddin'],
      },
      'Pirojpur': {
        nameEn: 'Pirojpur',
        nameBn: 'পিরোজপুর',
        lat: 22.5841,
        lng: 89.9720,
        upazilas: ['Pirojpur Sadar', 'Bhandaria', 'Kawkhali', 'Mathbaria', 'Nazirpur', 'Nesarabad (Swarupkati)', 'Indurkani'],
      },
      'Barguna': {
        nameEn: 'Barguna',
        nameBn: 'বরগুনা',
        lat: 22.1570,
        lng: 90.1264,
        upazilas: ['Barguna Sadar', 'Amtali', 'Bamna', 'Betagi', 'Patharghata', 'Taltali'],
      },
      'Jhalokati': {
        nameEn: 'Jhalokati',
        nameBn: 'ঝালকাঠি',
        lat: 22.6406,
        lng: 90.1987,
        upazilas: ['Jhalokati Sadar', 'Kathalia', 'Nalchhiti', 'Rajapur'],
      },
    },
  },
  'Rangpur': {
    nameEn: 'Rangpur',
    nameBn: 'রংপুর',
    lat: 25.7439,
    lng: 89.2752,
    districts: {
      'Rangpur': {
        nameEn: 'Rangpur',
        nameBn: 'রংপুর',
        lat: 25.7439,
        lng: 89.2752,
        upazilas: ['Rangpur Sadar', 'Badarganj', 'Gangachara', 'Kaunia', 'Mithapukur', 'Pirgachha', 'Pirganj', 'Taraganj', 'Kotwali'],
      },
      'Dinajpur': {
        nameEn: 'Dinajpur',
        nameBn: 'দিনাজপুর',
        lat: 25.6217,
        lng: 88.6355,
        upazilas: ['Dinajpur Sadar', 'Birampur', 'Birganj', 'Birol', 'Bochaganj', 'Chirirbandar', 'Phulbari', 'Ghoraghat', 'Hakimpur', 'Kaharole', 'Khansama', 'Nawabganj', 'Parbatipur'],
      },
      'Gaibandha': {
        nameEn: 'Gaibandha',
        nameBn: 'গাইবান্ধা',
        lat: 25.3288,
        lng: 89.5406,
        upazilas: ['Gaibandha Sadar', 'Fulchhari', 'Gobindaganj', 'Palashbari', 'Sadullapur', 'Sughatta', 'Sundarganj'],
      },
      'Kurigram': {
        nameEn: 'Kurigram',
        nameBn: 'কুড়িগ্রাম',
        lat: 25.8054,
        lng: 89.6362,
        upazilas: ['Kurigram Sadar', 'Bhurungamari', 'Char Rajibpur', 'Chilmari', 'Nageshwari', 'Phulbari', 'Rajarhat', 'Raomari', 'Ulipur'],
      },
      'Nilphamari': {
        nameEn: 'Nilphamari',
        nameBn: 'নীলফামারী',
        lat: 25.9318,
        lng: 88.8560,
        upazilas: ['Nilphamari Sadar', 'Dimla', 'Domar', 'Jaldhaka', 'Kishoreganj', 'Syedpur'],
      },
      'Panchagarh': {
        nameEn: 'Panchagarh',
        nameBn: 'পঞ্চগড়',
        lat: 26.3411,
        lng: 88.5542,
        upazilas: ['Panchagarh Sadar', 'Atwari', 'Boda', 'Debiganj', 'Tetulia'],
      },
      'Thakurgaon': {
        nameEn: 'Thakurgaon',
        nameBn: 'ঠাকুরগাঁও',
        lat: 26.0337,
        lng: 88.4617,
        upazilas: ['Thakurgaon Sadar', 'Baliadangi', 'Haripur', 'Pirganj', 'Ranisankhail'],
      },
      'Lalmonirhat': {
        nameEn: 'Lalmonirhat',
        nameBn: 'লালমনিরহাট',
        lat: 25.9923,
        lng: 89.2847,
        upazilas: ['Lalmonirhat Sadar', 'Aditmari', 'Hatibandha', 'Kaliganj', 'Patgram'],
      },
    },
  },
  'Mymensingh': {
    nameEn: 'Mymensingh',
    nameBn: 'ময়মনসিংহ',
    lat: 24.7471,
    lng: 90.4203,
    districts: {
      'Mymensingh': {
        nameEn: 'Mymensingh',
        nameBn: 'ময়মনসিংহ',
        lat: 24.7471,
        lng: 90.4203,
        upazilas: ['Mymensingh Sadar', 'Bhaluka', 'Dhobaura', 'Fulbaria', 'Gaffargaon', 'Gauripur', 'Haluaghat', 'Ishwarganj', 'Muktagachha', 'Nandail', 'Phulpur', 'Tarakanda', 'Trishal'],
      },
      'Jamalpur': {
        nameEn: 'Jamalpur',
        nameBn: 'জামালপুর',
        lat: 24.9375,
        lng: 89.9378,
        upazilas: ['Jamalpur Sadar', 'Bakshiganj', 'Dewanganj', 'Islampur', 'Madarganj', 'Melandaha', 'Sarishabari'],
      },
      'Netrokona': {
        nameEn: 'Netrokona',
        nameBn: 'নেত্রকোণা',
        lat: 24.8709,
        lng: 90.7279,
        upazilas: ['Netrokona Sadar', 'Atpara', 'Barhatta', 'Durgapur', 'Kalmakanda', 'Kendua', 'Madan', 'Mohanganj', 'Purbadhala', 'Khaliajuri'],
      },
      'Sherpur': {
        nameEn: 'Sherpur',
        nameBn: 'শেরপুর',
        lat: 25.0205,
        lng: 90.0153,
        upazilas: ['Sherpur Sadar', 'Jhenaigati', 'Nakla', 'Nalitabari', 'Sreebardi'],
      },
    },
  },
};

// Flattened lookup for all 64 districts
export const ALL_DISTRICTS_LOOKUP: Record<string, { division: string; district: DistrictInfo }> = {};
Object.entries(BANGLADESH_GEO).forEach(([divName, divObj]) => {
  Object.entries(divObj.districts).forEach(([distName, distObj]) => {
    ALL_DISTRICTS_LOOKUP[distName] = {
      division: divName,
      district: distObj,
    };
  });
});

// Helper: Haversine distance in km
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find closest District and Division given lat/lng
export function findNearestDistrict(
  lat: number,
  lng: number
): { division: string; district: string; distanceKm: number } {
  let closestDist = '';
  let closestDiv = 'Dhaka';
  let minDistance = Infinity;

  Object.entries(ALL_DISTRICTS_LOOKUP).forEach(([distName, data]) => {
    const dist = haversineKm(lat, lng, data.district.lat, data.district.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestDist = distName;
      closestDiv = data.division;
    }
  });

  return {
    division: closestDiv,
    district: closestDist,
    distanceKm: Math.round(minDistance * 10) / 10,
  };
}
