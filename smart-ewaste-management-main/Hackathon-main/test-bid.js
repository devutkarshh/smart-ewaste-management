// Test script to place a bid and see debug output
async function testBid() {
  try {
    const response = await fetch('http://localhost:3000/api/auctions/197c8650-e476-445a-8657-760cde3071a0/bids', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add session cookie if needed
      },
      body: JSON.stringify({ amount: 100 })
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testBid();
