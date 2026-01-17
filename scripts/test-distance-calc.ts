/**
 * Test distance calculations between user location (Kurla West) and all chefs
 */

const userLat = 19.0709614;  // Kurla West
const userLon = 72.8846869;

const chefs = [
  { name: "Roti Master", lat: 19.0728, lon: 72.8826, maxDeliveryKm: 5 },
  { name: "Home Style Kitchen", lat: 19.0244, lon: 72.8479, maxDeliveryKm: 8 },
  { name: "Premium Restaurant", lat: 19.0596, lon: 72.8295, maxDeliveryKm: 6 },
  { name: "Sweet Creations", lat: 19.0436, lon: 72.8245, maxDeliveryKm: 4 },
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const latRad1 = lat1 * (Math.PI / 180);
  const latRad2 = lat2 * (Math.PI / 180);
  const deltaLat = (lat2 - lat1) * (Math.PI / 180);
  const deltaLon = (lon2 - lon1) * (Math.PI / 180);

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(latRad1) * Math.cos(latRad2) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

console.log("\n🗺️  DISTANCE CALCULATION TEST");
console.log("================================");
console.log(`User Location: (${userLat}, ${userLon}) - Kurla West\n`);

chefs.forEach(chef => {
  const distance = calculateDistance(userLat, userLon, chef.lat, chef.lon);
  const withinZone = distance <= chef.maxDeliveryKm;
  
  console.log(`📍 ${chef.name}`);
  console.log(`   Location: (${chef.lat}, ${chef.lon})`);
  console.log(`   Distance from user: ${distance.toFixed(2)} km`);
  console.log(`   Max delivery distance: ${chef.maxDeliveryKm} km`);
  console.log(`   ✅ SHOW? ${withinZone ? "YES" : "NO"}`);
  console.log('');
});
