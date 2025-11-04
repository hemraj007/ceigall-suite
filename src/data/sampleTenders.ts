import { Tender } from '@/lib/types/tenderiq';

// Sample tender data
const sampleTenders: Tender[] = [
  {
    id: '1',
    title: 'Construction of 4-lane highway with interchanges, service roads, and drainage',
    authority: 'National Highways Authority',
    value: 900000000,          // 90 crore
    dueDate: '2025-12-15',
    status: 'live',
    category: 'Civil',
    ePublishedDate: '2025-11-01',
    bidSecurity: 900000,       // 9 lakh
    emd: 900000000,            // 9 crore
    location: 'Maharashtra',
    length: '120 km',
    costPerKm: 7500000,
    progressPct: 0,
    documents: [
      { id: 'd1', name: 'RFP_Document.pdf', type: 'pdf', pages: 45 },
      { id: 'd2', name: 'Technical_Specifications.pdf', type: 'pdf', pages: 32 },
      { id: 'd3', name: 'BOQ.xlsx', type: 'excel' },
      { id: 'd4', name: 'Forms_Schedule.pdf', type: 'pdf', pages: 28 }
    ],
    riskLevel: 'medium'
  },
  {
    id: '2',
    title: 'Development of Smart City Infrastructure - Phase 1',
    authority: 'Urban Development Authority',
    value: 500000000,          // 50 crore
    dueDate: '2025-11-30',
    status: 'live',
    category: 'Infrastructure',
    ePublishedDate: '2025-10-15',
    bidSecurity: 500000,       // 5 lakh
    emd: 500000000,            // 5 crore
    location: 'Karnataka',
    progressPct: 0,
    documents: [
      { id: 'd5', name: 'Smart_City_RFP.pdf', type: 'pdf', pages: 60 },
      { id: 'd6', name: 'Technical_Bid_Form.xlsx', type: 'excel' },
      { id: 'd7', name: 'Financial_Bid_Template.xlsx', type: 'excel' }
    ],
    riskLevel: 'high'
  },
  {
    id: '3',
    title: 'Railway Station Renovation and Modernization',
    authority: 'Indian Railways Ministry',
    value: 250000000,          // 25 crore
    dueDate: '2025-12-01',
    status: 'live',
    category: 'Railway',
    ePublishedDate: '2025-10-20',
    bidSecurity: 250000,       // 2.5 lakh
    emd: 250000000,            // 2.5 crore
    location: 'Delhi',
    progressPct: 0,
    documents: [
      { id: 'd8', name: 'Railway_RFP.pdf', type: 'pdf', pages: 75 },
      { id: 'd9', name: 'Architectural_Drawings.pdf', type: 'pdf', pages: 40 },
      { id: 'd10', name: 'Cost_Estimates.xlsx', type: 'excel' }
    ],
    riskLevel: 'medium'
  },
  {
    id: '4',
    title: 'Renewable Energy Solar Park Development - 100 MW',
    authority: 'Ministry of New and Renewable Energy',
    value: 750000000,          // 75 crore
    dueDate: '2025-11-20',
    status: 'live',
    category: 'Energy',
    ePublishedDate: '2025-10-01',
    bidSecurity: 750000,       // 7.5 lakh
    emd: 750000000,            // 7.5 crore
    location: 'Rajasthan',
    length: '500 acres',
    progressPct: 0,
    documents: [
      { id: 'd11', name: 'Solar_Project_RFP.pdf', type: 'pdf', pages: 85 },
      { id: 'd12', name: 'Technical_Specifications.pdf', type: 'pdf', pages: 50 },
      { id: 'd13', name: 'BOQ_and_Schedule.xlsx', type: 'excel' },
      { id: 'd14', name: 'Environmental_Report.pdf', type: 'pdf', pages: 35 }
    ],
    riskLevel: 'low'
  },
  {
    id: '5',
    title: 'Port Authority Terminal Expansion Project',
    authority: 'Major Ports Authority',
    value: 1200000000,         // 120 crore
    dueDate: '2025-12-10',
    status: 'live',
    category: 'Ports',
    ePublishedDate: '2025-09-15',
    bidSecurity: 1200000,      // 12 lakh
    emd: 1200000000,           // 12 crore
    location: 'Gujarat',
    length: '2.5 km',
    progressPct: 0,
    documents: [
      { id: 'd15', name: 'Port_Terminal_RFP.pdf', type: 'pdf', pages: 95 },
      { id: 'd16', name: 'Marine_Engineering_Specs.pdf', type: 'pdf', pages: 65 },
      { id: 'd17', name: 'Project_Timeline.xlsx', type: 'excel' },
      { id: 'd18', name: 'Site_Survey_Report.pdf', type: 'pdf', pages: 40 }
    ],
    riskLevel: 'high'
  }
];

// Wishlist (in localStorage)
const WISHLIST_KEY = 'tenderiq_wishlist';

// Get tender by ID
export function getTenderById(id: string): Tender | null {
  return sampleTenders.find(t => t.id === id) || null;
}

// Get all tenders
export function getAllTenders(): Tender[] {
  return sampleTenders;
}

// Wishlist functions
export function addToWishlist(id: string): void {
  const wishlist = getWishlistArray();
  if (!wishlist.includes(id)) {
    wishlist.push(id);
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }
}

export function removeFromWishlist(id: string): void {
  const wishlist = getWishlistArray();
  const index = wishlist.indexOf(id);
  if (index > -1) {
    wishlist.splice(index, 1);
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }
}

export function isInWishlist(id: string): boolean {
  return getWishlistArray().includes(id);
}

export function getWishlistTenders(): Tender[] {
  const wishlist = getWishlistArray();
  return sampleTenders.filter(t => wishlist.includes(t.id));
}

// Helper function
function getWishlistArray(): string[] {
  try {
    const stored = localStorage.getItem(WISHLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading wishlist from localStorage:', error);
    return [];
  }
}

export default sampleTenders;
