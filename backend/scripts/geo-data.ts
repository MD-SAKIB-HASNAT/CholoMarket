/**
 * Bangladesh's administrative areas for the demo data: the 8 divisions with all 64 districts, plus a few
 * well-known areas (thanas) and their neighbourhoods (sub-areas). Admins can add the rest from /admin/locations.
 * Shape: division → district → area → sub-area.
 */
export type Named = [en: string, bn: string];

export const DIVISIONS: { name: Named; districts: Named[] }[] = [
  {
    name: ['Dhaka', 'ঢাকা'],
    districts: [
      ['Dhaka', 'ঢাকা'],
      ['Faridpur', 'ফরিদপুর'],
      ['Gazipur', 'গাজীপুর'],
      ['Gopalganj', 'গোপালগঞ্জ'],
      ['Kishoreganj', 'কিশোরগঞ্জ'],
      ['Madaripur', 'মাদারীপুর'],
      ['Manikganj', 'মানিকগঞ্জ'],
      ['Munshiganj', 'মুন্সীগঞ্জ'],
      ['Narayanganj', 'নারায়ণগঞ্জ'],
      ['Narsingdi', 'নরসিংদী'],
      ['Rajbari', 'রাজবাড়ী'],
      ['Shariatpur', 'শরীয়তপুর'],
      ['Tangail', 'টাঙ্গাইল'],
    ],
  },
  {
    name: ['Chattogram', 'চট্টগ্রাম'],
    districts: [
      ['Bandarban', 'বান্দরবান'],
      ['Brahmanbaria', 'ব্রাহ্মণবাড়িয়া'],
      ['Chandpur', 'চাঁদপুর'],
      ['Chattogram', 'চট্টগ্রাম'],
      ['Cumilla', 'কুমিল্লা'],
      ["Cox's Bazar", 'কক্সবাজার'],
      ['Feni', 'ফেনী'],
      ['Khagrachhari', 'খাগড়াছড়ি'],
      ['Lakshmipur', 'লক্ষ্মীপুর'],
      ['Noakhali', 'নোয়াখালী'],
      ['Rangamati', 'রাঙ্গামাটি'],
    ],
  },
  {
    name: ['Rajshahi', 'রাজশাহী'],
    districts: [
      ['Bogura', 'বগুড়া'],
      ['Joypurhat', 'জয়পুরহাট'],
      ['Naogaon', 'নওগাঁ'],
      ['Natore', 'নাটোর'],
      ['Chapainawabganj', 'চাঁপাইনবাবগঞ্জ'],
      ['Pabna', 'পাবনা'],
      ['Rajshahi', 'রাজশাহী'],
      ['Sirajganj', 'সিরাজগঞ্জ'],
    ],
  },
  {
    name: ['Khulna', 'খুলনা'],
    districts: [
      ['Bagerhat', 'বাগেরহাট'],
      ['Chuadanga', 'চুয়াডাঙ্গা'],
      ['Jashore', 'যশোর'],
      ['Jhenaidah', 'ঝিনাইদহ'],
      ['Khulna', 'খুলনা'],
      ['Kushtia', 'কুষ্টিয়া'],
      ['Magura', 'মাগুরা'],
      ['Meherpur', 'মেহেরপুর'],
      ['Narail', 'নড়াইল'],
      ['Satkhira', 'সাতক্ষীরা'],
    ],
  },
  {
    name: ['Barishal', 'বরিশাল'],
    districts: [
      ['Barguna', 'বরগুনা'],
      ['Barishal', 'বরিশাল'],
      ['Bhola', 'ভোলা'],
      ['Jhalokathi', 'ঝালকাঠি'],
      ['Patuakhali', 'পটুয়াখালী'],
      ['Pirojpur', 'পিরোজপুর'],
    ],
  },
  {
    name: ['Sylhet', 'সিলেট'],
    districts: [
      ['Habiganj', 'হবিগঞ্জ'],
      ['Moulvibazar', 'মৌলভীবাজার'],
      ['Sunamganj', 'সুনামগঞ্জ'],
      ['Sylhet', 'সিলেট'],
    ],
  },
  {
    name: ['Rangpur', 'রংপুর'],
    districts: [
      ['Dinajpur', 'দিনাজপুর'],
      ['Gaibandha', 'গাইবান্ধা'],
      ['Kurigram', 'কুড়িগ্রাম'],
      ['Lalmonirhat', 'লালমনিরহাট'],
      ['Nilphamari', 'নীলফামারী'],
      ['Panchagarh', 'পঞ্চগড়'],
      ['Rangpur', 'রংপুর'],
      ['Thakurgaon', 'ঠাকুরগাঁও'],
    ],
  },
  {
    name: ['Mymensingh', 'ময়মনসিংহ'],
    districts: [
      ['Jamalpur', 'জামালপুর'],
      ['Mymensingh', 'ময়মনসিংহ'],
      ['Netrokona', 'নেত্রকোণা'],
      ['Sherpur', 'শেরপুর'],
    ],
  },
];

/** District (as "Division/District") → its areas, each with neighbourhoods. */
export const AREAS: Record<
  string,
  {
    name: Named;
    kind?: 'thana' | 'upazila' | 'city_area';
    serviceable?: boolean;
    subAreas: Named[];
  }[]
> = {
  'Dhaka/Dhaka': [
    {
      name: ['Dhanmondi', 'ধানমন্ডি'],
      serviceable: true,
      subAreas: [
        ['Road 27', 'রোড ২৭'],
        ['Kalabagan', 'কলাবাগান'],
        ['Shukrabad', 'শুক্রাবাদ'],
        ['Satmasjid Road', 'সাতমসজিদ রোড'],
      ],
    },
    {
      name: ['Gulshan', 'গুলশান'],
      serviceable: true,
      subAreas: [
        ['Gulshan 1', 'গুলশান ১'],
        ['Gulshan 2', 'গুলশান ২'],
        ['Baridhara', 'বারিধারা'],
      ],
    },
    {
      name: ['Mirpur', 'মিরপুর'],
      subAreas: [
        ['Mirpur-1', 'মিরপুর-১'],
        ['Mirpur-2', 'মিরপুর-২'],
        ['Mirpur-10', 'মিরপুর-১০'],
        ['Mirpur-11', 'মিরপুর-১১'],
        ['Pallabi', 'পল্লবী'],
      ],
    },
    {
      name: ['Uttara', 'উত্তরা'],
      subAreas: [
        ['Sector 3', 'সেক্টর ৩'],
        ['Sector 7', 'সেক্টর ৭'],
        ['Sector 10', 'সেক্টর ১০'],
        ['Sector 13', 'সেক্টর ১৩'],
      ],
    },
    {
      name: ['Motijheel', 'মতিঝিল'],
      subAreas: [
        ['Dilkusha', 'দিলকুশা'],
        ['Fakirapool', 'ফকিরাপুল'],
        ['Paltan', 'পল্টন'],
      ],
    },
    {
      name: ['New Market', 'নিউ মার্কেট'],
      subAreas: [
        ['Azimpur', 'আজিমপুর'],
        ['Nilkhet', 'নীলক্ষেত'],
        ['Elephant Road', 'এলিফ্যান্ট রোড'],
      ],
    },
    {
      name: ['Mohammadpur', 'মোহাম্মদপুর'],
      subAreas: [
        ['Tajmahal Road', 'তাজমহল রোড'],
        ['Shyamoli', 'শ্যামলী'],
        ['Adabor', 'আদাবর'],
      ],
    },
    {
      name: ['Banani', 'বনানী'],
      subAreas: [
        ['Banani Road 11', 'বনানী রোড ১১'],
        ['Kemal Ataturk Avenue', 'কামাল আতাতুর্ক এভিনিউ'],
      ],
    },
    {
      name: ['Tejgaon', 'তেজগাঁও'],
      subAreas: [
        ['Panthapath', 'পান্থপথ'],
        ['Farmgate', 'ফার্মগেট'],
      ],
    },
  ],
  'Dhaka/Gazipur': [
    {
      name: ['Gazipur Sadar', 'গাজীপুর সদর'],
      kind: 'upazila',
      subAreas: [
        ['Chowrasta', 'চৌরাস্তা'],
        ['Tongi', 'টঙ্গী'],
      ],
    },
  ],
  'Dhaka/Narayanganj': [
    {
      name: ['Narayanganj Sadar', 'নারায়ণগঞ্জ সদর'],
      kind: 'upazila',
      subAreas: [
        ['Chashara', 'চাষাড়া'],
        ['Dhalaikhal', 'ধলাইখাল'],
      ],
    },
  ],
  'Chattogram/Chattogram': [
    {
      name: ['Panchlaish', 'পাঁচলাইশ'],
      subAreas: [
        ['O.R. Nizam Road', 'ও.আর. নিজাম রোড'],
        ['GEC Circle', 'জি.ই.সি মোড়'],
        ['Khulshi', 'খুলশী'],
      ],
    },
    {
      name: ['Kotwali', 'কোতোয়ালী'],
      subAreas: [
        ['New Market', 'নিউ মার্কেট'],
        ['Anderkilla', 'আন্দরকিল্লা'],
        ['Jamal Khan', 'জামাল খান'],
      ],
    },
    {
      name: ['Double Mooring', 'ডবলমুরিং'],
      subAreas: [
        ['Agrabad', 'আগ্রাবাদ'],
        ['Sadarghat', 'সদরঘাট'],
      ],
    },
    {
      name: ['Halishahar', 'হালিশহর'],
      subAreas: [
        ['Halishahar', 'হালিশহর'],
        ['Bandar', 'বন্দর'],
      ],
    },
  ],
  'Sylhet/Sylhet': [
    {
      name: ['Kotwali', 'কোতোয়ালী'],
      subAreas: [
        ['Zindabazar', 'জিন্দাবাজার'],
        ['Bandarbazar', 'বন্দরবাজার'],
        ['Amberkhana', 'আম্বরখানা'],
      ],
    },
  ],
  'Rajshahi/Rajshahi': [
    {
      name: ['Boalia', 'বোয়ালিয়া'],
      subAreas: [
        ['Shaheb Bazar', 'সাহেব বাজার'],
        ['Laxmipur', 'লক্ষ্মীপুর'],
      ],
    },
  ],
  'Khulna/Khulna': [
    {
      name: ['Sonadanga', 'সোনাডাঙ্গা'],
      subAreas: [
        ['Boyra', 'বয়রা'],
        ['Dakbangla', 'ডাকবাংলা'],
      ],
    },
  ],
  'Barishal/Barishal': [
    {
      name: ['Kotwali', 'কোতোয়ালী'],
      subAreas: [
        ['Launch Ghat', 'লঞ্চঘাট'],
        ['Sadar Road', 'সদর রোড'],
      ],
    },
  ],
  'Rangpur/Rangpur': [
    {
      name: ['Kotwali', 'কোতোয়ালী'],
      subAreas: [
        ['Station Road', 'স্টেশন রোড'],
        ['Jahaj Company More', 'জাহাজ কোম্পানি মোড়'],
      ],
    },
  ],
  'Mymensingh/Mymensingh': [
    {
      name: ['Kotwali', 'কোতোয়ালী'],
      subAreas: [
        ['Ganginar Par', 'গাঙ্গিনারপাড়'],
        ['Charpara', 'চরপাড়া'],
      ],
    },
  ],
};

/** The four seeded markets → [division/district, area, sub-area]. */
export const MARKET_PLACES: Record<string, [string, string, string]> = {
  shapla: ['Dhaka/Dhaka', 'Dhanmondi', 'Road 27'],
  padma: ['Dhaka/Dhaka', 'Gulshan', 'Gulshan 1'],
  mirpur: ['Dhaka/Dhaka', 'Mirpur', 'Mirpur-10'],
  chawk: ['Chattogram/Chattogram', 'Panchlaish', 'O.R. Nizam Road'],
};
