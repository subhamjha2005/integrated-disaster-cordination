import { config } from 'dotenv';
import mongoose from 'mongoose';

// Load ENV since this runs outside Next.js process usually
config({ path: '.env.local' });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pyro_relief';

const CampSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  capacity: { type: Number, required: true },
  currentOccupancy: { type: Number, required: true },
  status: { type: String, required: true, enum: ['Safe', 'Overcrowded', 'Critical', 'Operating', 'Over Capacity', 'Evacuating'] },
  address: { type: String, default: '' },
  purpose: { type: String, default: '' },
  helpInfo: { type: String, default: '' },
  disasterType: { type: String, default: 'General' },
  supplies: {
    water: { type: Number, required: true },
    food: { type: Number, required: true },
    medical: { type: Number, required: true }
  },
  contactPhone: { type: String, default: '0361-222-1111' },
  criticalNeeds: [{ type: String, default: [] }]
});

const VolunteerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  skills: [{ type: String }],
  location: { lat: { type: Number, required: true }, lng: { type: Number, required: true } },
  status: { type: String, required: true },
  assignedCampId: { type: String }
});

const ResourceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  campId: { type: String, required: true },
  category: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  isCriticalShortage: { type: Boolean, required: true }
});

const DonationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  donorName: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  date: { type: String, required: true },
  purpose: { type: String, required: true },
  status: { type: String, default: 'Completed' },
  allocatedToCampId: { type: String }
});

const IncidentReportSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  reporterName: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String, required: true },
  location: { lat: { type: Number, required: true }, lng: { type: Number, required: true } },
  timestamp: { type: String, required: true },
  status: { type: String, required: true },
  intensity: { type: Number, required: true }
});

const Camp = mongoose.models.Camp || mongoose.model('Camp', CampSchema);
const Volunteer = mongoose.models.Volunteer || mongoose.model('Volunteer', VolunteerSchema);
const Resource = mongoose.models.Resource || mongoose.model('Resource', ResourceSchema);
const Donation = mongoose.models.Donation || mongoose.model('Donation', DonationSchema);
const IncidentReport = mongoose.models.IncidentReport || mongoose.model('IncidentReport', IncidentReportSchema);

const initialCamps = [
  {
    id: 'camp-ne-1',
    name: 'Sarusajai Regional Relief Hub',
    location: { lat: 26.1132, lng: 91.7582 },
    address: 'Sarusajai Sports Complex, Guwahati, Assam',
    purpose: 'Secondary Hub for Urban Floods',
    helpInfo: 'Provides mass shelter, logistics base for NDRF, and centralized medical triage for the Kamrup region.',
    disasterType: 'Floods',
    capacity: 2000,
    currentOccupancy: 1850,
    status: 'Operating',
    supplies: { water: 5000, food: 8000, medical: 2000 },
    contactPhone: '0361-222-1111',
    criticalNeeds: ['Medical', 'Water']
  },
  {
    id: 'camp-ne-2',
    name: 'Majuli Riverine Shelter',
    location: { lat: 26.9606, lng: 94.1843 },
    address: 'Jengraimukh, Majuli Island, Assam',
    purpose: 'Flood & Soil Erosion Mitigation',
    helpInfo: 'Raised platform shelter for river-displaced families. Equipped with water purifiers and boat rescue docks.',
    disasterType: 'Riverine Floods',
    capacity: 800,
    currentOccupancy: 780,
    status: 'Over Capacity',
    supplies: { water: 200, food: 600, medical: 100 },
    contactPhone: '03775-222-222',
    criticalNeeds: ['Fuel', 'Equipment']
  },
  {
    id: 'camp-ne-3',
    name: 'Kohora Wildlife-Human Relief Point',
    location: { lat: 26.5861, lng: 93.4072 },
    address: 'Kohora Range, Kaziranga, Assam',
    purpose: 'Disaster Relief for Buffer Zones',
    helpInfo: 'Dual-purpose center for protecting fringe village inhabitants and coordinating animal rescue during high floods.',
    disasterType: 'Annual Monsoon Floods',
    capacity: 400,
    currentOccupancy: 320,
    status: 'Operating',
    supplies: { water: 1000, food: 1500, medical: 800 },
    contactPhone: '03776-222-333',
    criticalNeeds: ['Medical']
  },
  {
    id: 'camp-ne-4',
    name: 'Silchar NIT Rescue Base',
    location: { lat: 24.7577, lng: 92.7923 },
    address: 'Cachar District, Silchar, Assam',
    purpose: 'Extreme Urban Flood Management',
    helpInfo: 'High-elevation campus utilized for air-dropping relief materials and housing 5000+ evacuees during valley flooding.',
    disasterType: 'Flash Floods',
    capacity: 5000,
    currentOccupancy: 4900,
    status: 'Critical',
    supplies: { water: 500, food: 1000, medical: 500 },
    contactPhone: '03842-222-444',
    criticalNeeds: ['Food', 'Medical']
  },
  {
    id: 'camp-ne-5',
    name: 'Gangtok Himalayan Safety Centre',
    location: { lat: 27.3314, lng: 88.6138 },
    address: 'Paljor Ground, Gangtok, Sikkim',
    purpose: 'Earthquake & GLOF Shelter',
    helpInfo: 'Reinforced staging area for mountain rescue operations and temporary housing for hill-slide survivors.',
    disasterType: 'Earthquake / Landslides',
    capacity: 1200,
    currentOccupancy: 450,
    status: 'Operating',
    supplies: { water: 3000, food: 5000, medical: 1200 },
    contactPhone: '03592-222-555',
    criticalNeeds: []
  },
  {
    id: 'camp-ne-6',
    name: 'Aizawl Slope Protection Hub',
    location: { lat: 23.7271, lng: 92.7176 },
    address: 'AR Ground, Aizawl, Mizoram',
    purpose: 'Landslide Relief Coordination',
    helpInfo: 'Specialized unit for managing vertical displacement and providing temporary cabin shelters for families.',
    disasterType: 'Massive Landslides',
    capacity: 600,
    currentOccupancy: 580,
    status: 'Operating',
    supplies: { water: 800, food: 1200, medical: 400 },
    contactPhone: '0389-222-666',
    criticalNeeds: ['Equipment']
  },
  {
    id: 'camp-ne-7',
    name: 'Itanagar Cloudburst Relief Base',
    location: { lat: 27.102, lng: 93.692 },
    address: 'IG Park, Itanagar, Arunachal Pradesh',
    purpose: 'Cloudburst & Flash Flood Shelter',
    helpInfo: 'Open-air coordination and shelter site for survivors of flash floods in hilly terrains.',
    disasterType: 'Cloudbursts',
    capacity: 1500,
    currentOccupancy: 200,
    status: 'Operating',
    supplies: { water: 2000, food: 4000, medical: 1000 },
    contactPhone: '0360-222-777',
    criticalNeeds: []
  },
  {
    id: 'camp-ne-8',
    name: 'Kohima Naga Heritage Refuge',
    location: { lat: 25.6747, lng: 94.1103 },
    address: 'Kohima Local Ground, Nagaland',
    purpose: 'Community-led Disaster Recovery',
    helpInfo: 'Utilizes tribal community networks for distribution of traditional food and shelter materials during crises.',
    disasterType: 'Earthquake',
    capacity: 1000,
    currentOccupancy: 150,
    status: 'Operating',
    supplies: { water: 1500, food: 2500, medical: 600 },
    contactPhone: '0370-222-888',
    criticalNeeds: []
  },
  {
    id: 'camp-ne-9',
    name: 'Shillong Pine Relief Centre',
    location: { lat: 25.5788, lng: 91.8931 },
    address: 'Polo Ground, Shillong, Meghalaya',
    purpose: 'Heavy Rainfall & Landslide Shelter',
    helpInfo: 'Located in the wettest region, provides waterproof transit housing and distribution of high-energy rations.',
    disasterType: 'Incessant Rain / Landslides',
    capacity: 900,
    currentOccupancy: 400,
    status: 'Operating',
    supplies: { water: 2000, food: 3000, medical: 800 },
    contactPhone: '0364-222-999',
    criticalNeeds: []
  },
  {
    id: 'camp-ne-10',
    name: 'Imphal Valley Relief Hub',
    location: { lat: 24.817, lng: 93.9368 },
    address: 'Khuman Lampak, Imphal, Manipur',
    purpose: 'Disaster Evacuation & Medical Hub',
    helpInfo: 'Large scale stadium converted for multi-hazard relief and intensive medical support.',
    disasterType: 'Floods / Earthquake',
    capacity: 2500,
    currentOccupancy: 1200,
    status: 'Operating',
    supplies: { water: 6000, food: 9000, medical: 3000 },
    contactPhone: '0385-222-000',
    criticalNeeds: []
  }
];

const initialVolunteers = [
  { id: 'vol-1', name: 'Ankita Das', skills: ['Medical', 'Search & Rescue'], location: { lat: 26.1400, lng: 91.6600 }, status: 'Available' },
  { id: 'vol-2', name: 'Rohan Sharma', skills: ['Logistics', 'Communication'], location: { lat: 26.1500, lng: 91.6650 }, status: 'Deployed', assignedCampId: 'camp-ne-1' },
  { id: 'vol-3', name: 'Dr. Bishnu Borah', skills: ['Medical'], location: { lat: 26.1530, lng: 91.6620 }, status: 'Deployed', assignedCampId: 'camp-ne-4' },
  { id: 'vol-4', name: 'Jiten Kalita', skills: ['Construction'], location: { lat: 26.1450, lng: 91.6700 }, status: 'Available' },
];

const initialResources = [
  { id: 'res-1', campId: 'camp-ne-1', category: 'Medical', name: 'First Aid Kits', quantity: 50, unit: 'units', isCriticalShortage: true },
  { id: 'res-2', campId: 'camp-ne-1', category: 'Water', name: 'Water Purifier Packs', quantity: 200, unit: 'packs', isCriticalShortage: false },
  { id: 'res-3', campId: 'camp-ne-2', category: 'Food', name: 'Emergency MRE Rations', quantity: 600, unit: 'meals', isCriticalShortage: false },
  { id: 'res-4', campId: 'camp-ne-4', category: 'Food', name: 'Rice & Grain Bags', quantity: 20, unit: 'bags', isCriticalShortage: true },
  { id: 'res-5', campId: 'camp-ne-4', category: 'Medical', name: 'Trauma Care Kits', quantity: 15, unit: 'kits', isCriticalShortage: true }
];

const initialDonations = [
  { id: 'don-1', donorName: 'North East Relief Fund', amount: 500000, currency: 'INR', date: '2026-02-24T10:00:00Z', status: 'Completed', purpose: 'Medical Supplies Procurement' },
  { id: 'don-2', donorName: 'Guwahati Tech Expo', amount: 45000, currency: 'INR', date: '2026-02-25T08:30:00Z', status: 'Completed', allocatedToCampId: 'camp-ne-1', purpose: 'Shelter Materials' },
];

const initialIncidentReports = [
  { id: 'repo-1', reporterName: 'Rahul Gogoi', type: 'Infrastructure', description: 'Power lines down near Sarusajai Complex.', location: { lat: 26.1395, lng: 91.6610 }, timestamp: new Date().toISOString(), status: 'Pending', intensity: 0.8 },
  { id: 'repo-2', reporterName: 'Simi Dutta', type: 'Medical', description: 'Urgent medical kit shortage in Silchar Block A.', location: { lat: 24.7577, lng: 92.7923 }, timestamp: new Date().toISOString(), status: 'Pending', intensity: 0.6 },
  { id: 'repo-3', reporterName: 'Police Dept', type: 'Infrastructure', description: 'Road blockage at Jalukbari Circle.', location: { lat: 26.1550, lng: 91.6680 }, timestamp: new Date().toISOString(), status: 'Verified', intensity: 0.9 },
  { id: 'repo-4', reporterName: 'Civil Guard', type: 'Food', description: 'Ration delivery delayed near Majuli dock.', location: { lat: 26.9606, lng: 94.1843 }, timestamp: new Date().toISOString(), status: 'Pending', intensity: 0.4 },
];

async function seedDatabase() {
  try {
    console.log(`Connecting to MongoDB at: ${uri}`);
    await mongoose.connect(uri);
    console.log('Connected.');

    console.log('Clearing existing records...');
    await Promise.all([
      Camp.deleteMany({}),
      Volunteer.deleteMany({}),
      Resource.deleteMany({}),
      Donation.deleteMany({}),
      IncidentReport.deleteMany({}),
    ]);

    console.log('Seeding data...');
    await Camp.insertMany(initialCamps);
    await Volunteer.insertMany(initialVolunteers);
    await Resource.insertMany(initialResources);
    await Donation.insertMany(initialDonations);
    await IncidentReport.insertMany(initialIncidentReports);

    console.log(`Successfully seeded ${initialCamps.length} camps, ${initialVolunteers.length} volunteers, ${initialResources.length} resources, ${initialDonations.length} donations, and ${initialIncidentReports.length} incident reports!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
