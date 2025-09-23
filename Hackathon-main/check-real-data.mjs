import { MongoClient, ObjectId } from 'mongodb';

const uri = 'mongodb+srv://princesaini1665:123@cluster0.xc1zl.mongodb.net/ewaste?retryWrites=true&w=majority&appName=Cluster0';

async function checkRealData() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('ewaste');
    
    // Check items collection for real user-submitted data
    console.log('\n=== ITEMS COLLECTION ===');
    const items = await db.collection('items').find({}).toArray();
    console.log(`Total items: ${items.length}`);
    
    items.forEach((item, index) => {
      console.log(`\nItem ${index + 1}:`);
      console.log(`ID: ${item._id}`);
      console.log(`Name: ${item.name}`);
      console.log(`Category: ${item.category}`);
      console.log(`Description: ${item.description}`);
      console.log(`Condition: ${item.condition}`);
      console.log(`Reported by: ${item.reported_by}`);
      console.log(`Created at: ${item.created_at}`);
      
      // Check for detailed fields
      console.log('=== DETAILED FIELDS ===');
      console.log(`Brand: ${item.brand || 'NOT SET'}`);
      console.log(`Model: ${item.model || 'NOT SET'}`);
      console.log(`Purchase date: ${item.purchase_date || 'NOT SET'}`);
      console.log(`Original price: ${item.original_price || 'NOT SET'}`);
      console.log(`Usage pattern: ${item.usage_pattern || 'NOT SET'}`);
      console.log(`Issues: ${item.issues || 'NOT SET'}`);
      console.log(`Accessories: ${item.accessories || 'NOT SET'}`);
      console.log(`Storage capacity: ${item.storage_capacity || 'NOT SET'}`);
      console.log(`RAM: ${item.ram || 'NOT SET'}`);
      console.log(`Processor: ${item.processor || 'NOT SET'}`);
    });
    
    // Check auctions to see which items are in auction
    console.log('\n=== AUCTIONS COLLECTION ===');
    const auctions = await db.collection('auctions').find({}).toArray();
    console.log(`Total auctions: ${auctions.length}`);
    
    auctions.forEach((auction, index) => {
      console.log(`\nAuction ${index + 1}:`);
      console.log(`ID: ${auction._id}`);
      console.log(`Item ID: ${auction.item_id}`);
      console.log(`Status: ${auction.status}`);
      console.log(`Start price: ${auction.start_price}`);
      console.log(`Current bid: ${auction.current_bid}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkRealData();
