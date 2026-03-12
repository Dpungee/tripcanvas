import { USState } from '@/types'

export const states: USState[] = [
  {
    id: 'florida',
    name: 'Florida',
    abbreviation: 'FL',
    heroImage: 'https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=1200&q=80',
    description: 'The Sunshine State offers world-class beaches, legendary nightlife, and endless entertainment from Miami to Key West.',
    destinations: ['miami', 'orlando', 'tampa', 'key-west', 'naples'],
    budgetRange: { low: 120, high: 500 },
    highlights: ['South Beach', 'Disney World', 'Everglades', 'Key West Sunsets'],
  },
  {
    id: 'california',
    name: 'California',
    abbreviation: 'CA',
    heroImage: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=1200&q=80',
    description: 'From Hollywood glamour to Napa wine country, California delivers an unmatched mix of culture, nature, and luxury.',
    destinations: ['los-angeles', 'san-diego', 'palm-springs', 'napa', 'san-francisco'],
    budgetRange: { low: 150, high: 600 },
    highlights: ['Hollywood', 'Golden Gate Bridge', 'Napa Valley', 'Pacific Coast Highway'],
  },
  {
    id: 'new-york',
    name: 'New York',
    abbreviation: 'NY',
    heroImage: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1200&q=80',
    description: 'The Empire State has it all — from the electric energy of NYC to the serene beauty of the Hudson Valley and Hamptons.',
    destinations: ['nyc', 'hamptons', 'hudson-valley'],
    budgetRange: { low: 180, high: 700 },
    highlights: ['Times Square', 'Central Park', 'Hamptons Beaches', 'Hudson Valley Wineries'],
  },
  {
    id: 'texas',
    name: 'Texas',
    abbreviation: 'TX',
    heroImage: 'https://images.unsplash.com/photo-1570089858715-590b37649de6?w=1200&q=80',
    description: 'Everything is bigger in Texas — the live music, the BBQ, the nightlife, and the unforgettable road trip destinations.',
    destinations: ['austin', 'dallas', 'houston', 'san-antonio'],
    budgetRange: { low: 100, high: 400 },
    highlights: ['6th Street Austin', 'San Antonio Riverwalk', 'Texas BBQ', 'Space Center Houston'],
  },
  {
    id: 'nevada',
    name: 'Nevada',
    abbreviation: 'NV',
    heroImage: 'https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?w=1200&q=80',
    description: 'Home to Las Vegas and beyond, Nevada is the ultimate destination for bachelor parties, luxury getaways, and adventure seekers.',
    destinations: ['las-vegas', 'reno', 'lake-tahoe-nv'],
    budgetRange: { low: 130, high: 800 },
    highlights: ['The Strip', 'Lake Tahoe', 'Red Rock Canyon', 'Reno Arts District'],
  },
  {
    id: 'tennessee',
    name: 'Tennessee',
    abbreviation: 'TN',
    heroImage: 'https://images.unsplash.com/photo-1545419913-ec99d5e4fe02?w=1200&q=80',
    description: 'Music City and Memphis blues, plus the Great Smoky Mountains — Tennessee serves up culture, nightlife, and nature.',
    destinations: ['nashville', 'memphis', 'gatlinburg'],
    budgetRange: { low: 90, high: 350 },
    highlights: ['Broadway Nashville', 'Beale Street', 'Great Smoky Mountains', 'Honky Tonks'],
  },
  {
    id: 'arizona',
    name: 'Arizona',
    abbreviation: 'AZ',
    heroImage: 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=1200&q=80',
    description: 'Desert luxury meets red rock beauty — from Scottsdale spas to Sedona hikes, Arizona is a wellness and adventure paradise.',
    destinations: ['scottsdale', 'sedona', 'phoenix'],
    budgetRange: { low: 110, high: 450 },
    highlights: ['Scottsdale Spas', 'Sedona Red Rocks', 'Grand Canyon', 'Desert Golf'],
  },
  {
    id: 'colorado',
    name: 'Colorado',
    abbreviation: 'CO',
    heroImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
    description: 'Mountain highs and craft brew culture — Colorado is perfect for adventure seekers, ski trips, and outdoor lovers.',
    destinations: ['denver', 'aspen', 'boulder', 'colorado-springs'],
    budgetRange: { low: 120, high: 550 },
    highlights: ['Rocky Mountains', 'Aspen Skiing', 'Red Rocks Amphitheatre', 'Craft Breweries'],
  },
]

export function getStateById(id: string): USState | undefined {
  return states.find(s => s.id === id)
}

export function getAllStates(): USState[] {
  return states
}
