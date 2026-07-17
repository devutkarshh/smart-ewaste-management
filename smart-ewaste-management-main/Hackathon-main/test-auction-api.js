// Test script to check auction data
const testAuctionAPI = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/auctions');
    const data = await response.json();
    
    console.log('API Response Status:', response.status);
    console.log('Number of auctions:', data.length);
    
    if (data.length > 0) {
      console.log('\nFirst auction sample:');
      console.log('ID:', data[0].id);
      console.log('Item ID:', data[0].item_id);
      console.log('Has item details:', !!data[0].item);
      
      if (data[0].item) {
        console.log('\nItem details:');
        console.log('Name:', data[0].item.name);
        console.log('Description:', data[0].item.description);
        console.log('Category:', data[0].item.category);
        console.log('Brand:', data[0].item.brand);
        console.log('Condition:', data[0].item.condition);
        console.log('Reporter name:', data[0].item.reporter_name);
        console.log('Reporter email:', data[0].item.reporter_email);
        console.log('Reporter role:', data[0].item.reporter_role);
        
        console.log('\nFull item object:');
        console.log(JSON.stringify(data[0].item, null, 2));
      } else {
        console.log('No item details found');
      }
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
};

testAuctionAPI();
