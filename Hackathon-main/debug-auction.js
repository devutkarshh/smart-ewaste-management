const { MongoClient } = require('mongodb');

async function debugAuction() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  const db = client.db('hackathon');
  
  const auctionId = '197c8650-e476-445a-8657-760cde3071a0';
  
  console.log('Debugging auction:', auctionId);
  
  // Find the auction
  const auction = await db.collection('auctions').findOne({ _id: auctionId });
  
  if (!auction) {
    console.log('Auction not found!');
    return;
  }
  
  console.log('Auction data:');
  console.log(JSON.stringify(auction, null, 2));
  
  console.log('\nAuction status:', auction.status);
  console.log('Status type:', typeof auction.status);
  console.log('Is status "active"?', auction.status === "active");
  console.log('Is status !== "active"?', auction.status !== "active");
  
  console.log('\nEnd time:', auction.end_time);
  console.log('Current time:', new Date().toISOString());
  console.log('Is expired?', new Date() > new Date(auction.end_time));
  
  await client.close();
}

debugAuction().catch(console.error);
