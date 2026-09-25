import { HOSTEL_CODES, type CampusOutlet, type HostelCode } from './types';

const ALL = [...HOSTEL_CODES];

function mess(code: HostelCode, extra: Partial<CampusOutlet> = {}): CampusOutlet {
  const shared = code === 'H12' || code === 'H13' || code === 'H14';
  return {
    id: `mess-${code.toLowerCase()}`,
    name: `${code === 'Tansa' ? 'Tansa House' : `Hostel ${code.slice(1)}`} mess`,
    kind: 'mess',
    priority: 1,
    hostelCodes: [code],
    area: shared ? 'H12–H14 common mess' : `${code} dining hall`,
    vegOnly: false,
    sourceUrl: 'https://www.iitb.ac.in/sites/www.iitb.ac.in/files/2024-11/Hostel%20Mess%20Tender%202024.pdf',
    notes: shared
      ? 'H12/H13/H14 share a common kitchen. Weekly menu is set by the mess council and rotates.'
      : 'Breakfast, lunch, tiffin, dinner. Extra egg/chicken/paneer counters follow the hostel tender.',
    ...extra,
  };
}

export const CAMPUS_OUTLETS: CampusOutlet[] = [
  ...HOSTEL_CODES.map((code) => mess(code)),
  {
    id: 'canteen-aroma',
    name: 'Aroma Dhaba',
    kind: 'canteen',
    priority: 2,
    hostelCodes: ['H1', 'H2', 'H3', 'H4'],
    area: 'Near Hostel 1, beside Domino’s',
    vegOnly: false,
    sourceUrl: 'https://aromadhaba.com/',
    notes: 'Menu scraped from the live Dukaan store on 21 Sep 2026, plus gravy/biryani/noodle categories listed on that store.',
  },
  {
    id: 'canteen-h2',
    name: 'H2 Canteen',
    kind: 'canteen',
    priority: 2,
    hostelCodes: ['H2'],
    area: 'Hostel 2',
    vegOnly: false,
    sourceUrl: 'https://h2canteen.com/',
    notes: 'Menu scraped from the live Dukaan store on 21 Sep 2026. Students often order cheese sandwiches and frankies.',
  },
  {
    id: 'canteen-amul-h14',
    name: 'Amul H14 canteen',
    kind: 'canteen',
    priority: 2,
    hostelCodes: ['H12', 'H13', 'H14'],
    area: 'Outside Hostel 14',
    vegOnly: true,
    notes: 'Vegetarian parlour: sandwiches, chaat, shakes, ice cream, bun maska, chai. Confirm live prices on the board.',
  },
  {
    id: 'canteen-h10',
    name: 'H10 canteen',
    kind: 'canteen',
    priority: 2,
    hostelCodes: ['H10'],
    area: 'Hostel 10',
    vegOnly: false,
    sourceUrl: 'https://gymkhana.iitb.ac.in/~hostel10/images/canteenmenu1.pdf',
    notes: 'Maggi, paratha, and frankie list from the published H10 canteen menu PDF.',
  },
  {
    id: 'canteen-market-gate',
    name: 'Market Gate stalls',
    kind: 'canteen',
    priority: 2,
    hostelCodes: ALL,
    area: 'YP / Market Gate',
    vegOnly: false,
    notes: 'Dosa, pani puri, sev puri and similar stalls that students treat as the default off-mess snack run.',
  },
  {
    id: 'rest-laxmi',
    name: 'Hotel Laxmi Next',
    kind: 'restaurant',
    priority: 3,
    hostelCodes: ALL,
    area: 'Opposite IIT main gate, A S Marg, Powai',
    vegOnly: true,
    sourceUrl: 'https://www.district.in/dining/mumbai/hotel-laxmi-next-powai',
    notes: 'Student hangout for pav bhaji, misal, dosa, and chaat.',
  },
  {
    id: 'rest-burger-king',
    name: 'Burger King',
    kind: 'restaurant',
    priority: 3,
    hostelCodes: ALL,
    area: 'Hiranandani / Powai (off campus)',
    vegOnly: false,
    notes: 'Standard India BK items. Use when the photo is clearly a branded burger/fries meal.',
  },
  {
    id: 'rest-chaat',
    name: 'Powai chaat',
    kind: 'restaurant',
    priority: 3,
    hostelCodes: ALL,
    area: 'Main gate / Market Gate / Laxmi',
    vegOnly: true,
    notes: 'Sev puri, bhel, dahi puri, ragda — same dishes appear at multiple stalls.',
  },
  {
    id: 'rest-chai-bun-maska',
    name: 'Chai and bun maska',
    kind: 'restaurant',
    priority: 3,
    hostelCodes: ALL,
    area: 'Campus cafés, Amul, RBTIC-style counters',
    vegOnly: true,
    notes: 'Cutting chai, bun maska, bun jam. RBTIC café tender lists bun maska at campus café pricing.',
  },
  {
    id: 'rest-dominos-h1',
    name: 'Domino’s (near H1)',
    kind: 'restaurant',
    priority: 3,
    hostelCodes: ['H1', 'H2', 'H3'],
    area: 'Across from Hostel 1',
    vegOnly: false,
  },
  {
    id: 'rest-gulmohar',
    name: 'Gulmohar',
    kind: 'restaurant',
    priority: 3,
    hostelCodes: ALL,
    area: 'Main Gate Road, above Canara Bank',
    vegOnly: false,
    notes: 'Sit-down campus restaurant. Use when the plate is clearly not mess or hostel canteen.',
  },
];

export const OUTLET_BY_ID = new Map(CAMPUS_OUTLETS.map((outlet) => [outlet.id, outlet]));

export function outletsForHostel(hostel?: string) {
  if (!hostel) return CAMPUS_OUTLETS;
  const code = hostel.toUpperCase().replace(/^HOSTEL\s*/, 'H') as HostelCode;
  return CAMPUS_OUTLETS.filter((outlet) => outlet.hostelCodes.includes(code) || outlet.hostelCodes.length === HOSTEL_CODES.length);
}
