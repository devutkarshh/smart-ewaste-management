// Check real data through the API
async function checkRealData() {
  try {
    console.log('Fetching auction data from API...');
    
    // Fetch auctions through the API
    const response = await fetch('http://localhost:3000/api/auctions');
    const data = await response.json();
    
    console.log('\n=== API RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Success:', data.success);
    console.log('Total auctions:', data.auctions?.length || 0);
    
    if (data.auctions && data.auctions.length > 0) {
      console.log('\n=== AUCTION DETAILS ===');
      
      data.auctions.forEach((auction, index) => {
        console.log(`\n--- Auction ${index + 1} ---`);
        console.log(`ID: ${auction._id}`);
        console.log(`Status: ${auction.status}`);
        console.log(`Start price: ${auction.start_price}`);
        console.log(`Current bid: ${auction.current_bid}`);
        
        if (auction.item_details) {
          console.log('\n--- Item Details ---');
          console.log(`Name: ${auction.item_details.name}`);
          console.log(`Category: ${auction.item_details.category}`);
          console.log(`Description: ${auction.item_details.description}`);
          console.log(`Condition: ${auction.item_details.condition}`);
          
          // Check for detailed fields that users would have filled
          console.log('\n--- User-Filled Details ---');
          console.log(`Brand: ${auction.item_details.brand || 'NOT SET BY USER'}`);
          console.log(`Model: ${auction.item_details.model || 'NOT SET BY USER'}`);
          console.log(`Purchase date: ${auction.item_details.purchase_date || 'NOT SET BY USER'}`);
          console.log(`Original price: ${auction.item_details.original_price || 'NOT SET BY USER'}`);
          console.log(`Usage pattern: ${auction.item_details.usage_pattern || 'NOT SET BY USER'}`);
          console.log(`Issues: ${auction.item_details.issues || 'NOT SET BY USER'}`);
          console.log(`Accessories: ${auction.item_details.accessories || 'NOT SET BY USER'}`);
          console.log(`Storage capacity: ${auction.item_details.storage_capacity || 'NOT SET BY USER'}`);
          console.log(`RAM: ${auction.item_details.ram || 'NOT SET BY USER'}`);
          console.log(`Processor: ${auction.item_details.processor || 'NOT SET BY USER'}`);
          
          if (auction.item_details.reporter_info) {
            console.log('\n--- Reporter Info ---');
            console.log(`Reporter name: ${auction.item_details.reporter_info.name}`);
            console.log(`Reporter email: ${auction.item_details.reporter_info.email}`);
            console.log(`Reporter role: ${auction.item_details.reporter_info.role}`);
          }
        }
      });
    } else {
      console.log('\nNo auctions found or no item details attached');
    }
    
  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}

checkRealData();
