export interface FakeNewsSample {
  text: string;
  verdict: string;
  credibilityScore: number;
  evidence: string[];
  redFlags: string[];
  recommendedAction: string;
}

export const FAKE_NEWS_SAMPLES: FakeNewsSample[] = [
  {
    text: '🚨 URGENT: Government announces Rs. 25,000 Eid bonus for all CNIC holders under new emergency relief package! Click here to register your CNIC immediately: bit.ly/relief-fund-2025 (Forward to 10 groups to claim)',
    verdict: '🚨 WhatsApp Hoax / Phishing Scam',
    credibilityScore: 5,
    evidence: [
      'No official notification published on BISP (bisp.gov.pk) or Ministry of Finance portals.',
      'Uses unauthorized third-party URL shortener (bit.ly) instead of official .gov.pk domain.',
      'Contains classic social engineering triggers: urgency ("URGENT"), artificial reward, and mandatory chain forwarding.',
    ],
    redFlags: [
      'Unverified shortened URL (bit.ly)',
      'Artificial urgency and pressure',
      'Mandatory group forwarding requirement',
      'No official government gazette reference',
    ],
    recommendedAction: 'Do NOT click the link or enter your CNIC/OTP. Report the message as spam and inform the sender that it is a phishing hoax.',
  },
  {
    text: 'Notification No. SO(A-I)1-31/2008: All educational institutions (schools, colleges, universities) across Punjab shall remain closed for 10 days due to extreme winter weather and smog conditions starting tomorrow.',
    verdict: '⚠️ Doctored Circular / Unconfirmed Notification',
    credibilityScore: 25,
    evidence: [
      'Re-uses an outdated 2022 notification reference number with altered calendar dates.',
      'Missing the authentic QR code and digital verification signature of the School Education Department.',
      'Provincial SED Punjab official social handles (@SchoolEduPunjab) have issued no such announcement.',
    ],
    redFlags: [
      'Font inconsistency in the date line showing digital tampering',
      'Missing verifiable QR code',
      'No mention on official provincial government portal (schools.punjab.gov.pk)',
    ],
    recommendedAction: 'Verify directly on the official School Education Department portal or wait for television broadcasts on state media (PTV News / Radio Pakistan).',
  },
  {
    text: 'The State Bank of Pakistan (SBP) has decided to maintain the policy rate at 15% following the Monetary Policy Committee (MPC) meeting held at SBP Head Office Karachi.',
    verdict: '✅ Verified News / Authentic Press Release',
    credibilityScore: 98,
    evidence: [
      'Matches official Monetary Policy Statement published on sbp.org.pk.',
      'Confirmed across all reputable Pakistani national financial newspapers and SBP official Twitter handle (@StateBank_Pak).',
      'Includes authentic reference number and official spokesperson contact.',
    ],
    redFlags: [],
    recommendedAction: 'Information is authentic and verified by the central regulatory bank of Pakistan.',
  },
];

export interface PSLSign {
  id: string;
  word: string;
  urdu: string;
  category: 'Greetings' | 'Civic' | 'Emergency' | 'Numbers' | 'Alphabets';
  description: string;
  movement: string;
}

export const PSL_SIGNS: PSLSign[] = [
  {
    id: 'salam',
    word: 'Assalam-o-Alaikum / Hello',
    urdu: 'السلام علیکم',
    category: 'Greetings',
    description: 'Place flat right hand on forehead/heart and gently bow head with a pleasant, welcoming facial expression.',
    movement: 'Flat open palm moves from right brow forward outward toward the receiver in a gentle arc.',
  },
  {
    id: 'shukriya',
    word: 'Thank You (Shukriya)',
    urdu: 'شکریہ',
    category: 'Greetings',
    description: 'Touch fingers of open right hand to chin, then move hand forward and downward toward the other person with a smile.',
    movement: 'Fingertips tap chin once and extend outward gracefully.',
  },
  {
    id: 'madad',
    word: 'Help (Madad)',
    urdu: 'مدد',
    category: 'Emergency',
    description: 'Place right fist with thumb upright upon open left palm, and lift both hands slightly upward together.',
    movement: 'Left supporting hand holds the right fist as both elevate.',
  },
  {
    id: 'hospital',
    word: 'Hospital / Doctor',
    urdu: 'ہسپتال / ڈاکٹر',
    category: 'Emergency',
    description: 'Form a cross sign on the left shoulder/bicep using the right index finger or index and middle fingers.',
    movement: 'Index finger traces a vertical line then horizontal line on the opposite upper arm.',
  },
  {
    id: 'police',
    word: 'Police',
    urdu: 'پولیس',
    category: 'Emergency',
    description: 'Form a "C" shape with right hand and tap right shoulder near collarbone twice, simulating uniform epaulets/badges.',
    movement: 'Two crisp taps on right shoulder.',
  },
  {
    id: 'cnic',
    word: 'CNIC / Identity Card',
    urdu: 'شناختی کارڈ',
    category: 'Civic',
    description: 'Hold left flat hand upright like a card; press right thumbprint onto center of left palm.',
    movement: 'Right thumb presses into left open palm, followed by framing a rectangle in the air.',
  },
  {
    id: 'vote',
    word: 'Vote / Election',
    urdu: 'ووٹ',
    category: 'Civic',
    description: 'Hold right hand with pinched fingers (like holding a ballot slip) and insert downward into curled left fist (ballot box).',
    movement: 'Downward motion into curled left hand.',
  },
  {
    id: 'nadra',
    word: 'NADRA Office',
    urdu: 'نادرا دفتر',
    category: 'Civic',
    description: 'Sign "CNIC" followed by "Office/Building" gesture (two hands forming roof/walls).',
    movement: 'ID stamp motion followed by two hands angled together.',
  },
  {
    id: 'num-1',
    word: 'One (Aik)',
    urdu: 'ایک (1)',
    category: 'Numbers',
    description: 'Hold right index finger straight up with palm facing inward/forward.',
    movement: 'Crisp upward index finger extension.',
  },
  {
    id: 'num-5',
    word: 'Five (Paanch)',
    urdu: 'پانچ (5)',
    category: 'Numbers',
    description: 'Show open right hand with all five fingers extended forward.',
    movement: 'Open palm facing outward.',
  },
  {
    id: 'alif',
    word: 'Alif (ا)',
    urdu: 'الف',
    category: 'Alphabets',
    description: 'Index finger pointing straight up, representing the vertical Urdu letter Alif.',
    movement: 'Steady vertical upright finger.',
  },
  {
    id: 'bay',
    word: 'Bay (ب)',
    urdu: 'بے',
    category: 'Alphabets',
    description: 'Flat horizontal palm held flat with index finger of other hand tapping underneath (representing the single bottom dot).',
    movement: 'Horizontal flat palm with a dot tap underneath.',
  },
];
