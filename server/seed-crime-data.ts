import { storage } from "./storage";

// Sample crime data for various locations
const crimeTypes = ["theft", "assault", "burglary", "vandalism", "robbery"];

async function seedCrimeData() {
  console.log("Seeding crime data...");
  
  // Major cities coordinates for seeding
  const locations = [
    { lat: 40.7128, lng: -74.0060, name: "New York" },
    { lat: 34.0522, lng: -118.2437, name: "Los Angeles" },
    { lat: 41.8781, lng: -87.6298, name: "Chicago" },
    { lat: 29.7604, lng: -95.3698, name: "Houston" },
    { lat: 33.4484, lng: -112.0740, name: "Phoenix" },
  ];
  
  let totalSeeded = 0;
  
  for (const location of locations) {
    // Generate random crimes around each location
    const numCrimes = Math.floor(Math.random() * 30) + 20; // 20-50 crimes per location
    
    for (let i = 0; i < numCrimes; i++) {
      // Random offset within ~10km radius
      const latOffset = (Math.random() - 0.5) * 0.1;
      const lngOffset = (Math.random() - 0.5) * 0.1;
      
      const crime = {
        latitude: location.lat + latOffset,
        longitude: location.lng + lngOffset,
        crimeType: crimeTypes[Math.floor(Math.random() * crimeTypes.length)],
        severity: Math.floor(Math.random() * 5) + 1, // 1-5
        description: `Crime incident in ${location.name} area`,
      };
      
      await storage.createCrimeData(crime);
      totalSeeded++;
    }
    
    console.log(`Seeded crimes for ${location.name}`);
  }
  
  console.log(`✓ Successfully seeded ${totalSeeded} crime records`);
}

seedCrimeData()
  .then(() => {
    console.log("Seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
