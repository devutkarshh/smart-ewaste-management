// Database fix script for price_source field
// This script should be run via the MongoDB console or a route to fix existing data

// Fix items where price_source is missing or incorrect
db.items.updateMany(
  { price_source: { $exists: false } },
  { $set: { price_source: "user" } }
);

// For debugging, let's also check what we have
db.items.find({}, { 
  name: 1, 
  current_price: 1, 
  predicted_price: 1, 
  price_source: 1 
}).limit(5);
