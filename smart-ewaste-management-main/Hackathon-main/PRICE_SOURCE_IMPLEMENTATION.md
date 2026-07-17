# Price Source Tracking Implementation

## Overview
The E-Waste Management System now properly tracks whether users choose ML predicted prices or set their own custom prices. This information is stored in the `price_source` field and displayed throughout the application.

## How It Works

### 1. **User Experience Flow**
- When reporting an item, after filling required details, the ML system predicts a price
- User is presented with two options:
  - ✅ Accept ML predicted price 
  - ✏️ Set custom price
- User must confirm their choice before submitting
- The choice is stored as `price_source`: "ml" or "user"

### 2. **Data Storage**
- `current_price`: The final price chosen/confirmed by the user
- `predicted_price`: The original ML prediction (stored for reference)
- `price_source`: "ml" if user accepted ML price, "user" if custom price
- `price_confirmed`: Boolean indicating user confirmed their choice

### 3. **Display Throughout Application**

#### Admin Panel (`/admin`)
- **ML Selected**: Blue color with 🤖 icon
- **User Custom**: Green color with 👤 icon
- Shows both chosen price and original prediction for comparison

#### Item Details (`/item/[id]`)
- Current price displayed with color coding based on source
- Detailed explanation of choice made
- Shows ML prediction vs actual choice when different

#### Price Display Logic
```typescript
if (item.price_source === "ml") {
  // Blue styling - ML prediction was accepted
} else if (item.price_source === "user") {
  // Green styling - User set custom price
}
```

## Technical Implementation

### Frontend (Report Page)
```tsx
// User choice tracking
const [usePredictedPrice, setUsePredictedPrice] = useState(true)
const [customPrice, setCustomPrice] = useState("")
const [priceConfirmed, setPriceConfirmed] = useState(false)

// Final submission data
const submitData = {
  current_price: usePredictedPrice ? predictedPrice : Number(customPrice),
  predicted_price: predictedPrice, // Always store ML prediction
  price_source: usePredictedPrice ? "ml" : "user", // Track user choice
  price_confirmed: true
}
```

### Backend (Data Storage)
```typescript
// Enhanced price source logic
let actualPriceSource = input.price_source || "user"

// Additional validation to ensure accuracy
if (input.current_price !== input.predicted_price && input.current_price) {
  actualPriceSource = "user" // Custom price was set
} else if (input.current_price === input.predicted_price && input.price_source === "ml") {
  actualPriceSource = "ml" // ML prediction was accepted
}
```

## Database Schema
```
items: {
  current_price: number,        // Final chosen price
  predicted_price: number,      // Original ML prediction
  price_source: "ml" | "user",  // Source of the price
  price_confirmed: boolean      // Whether user confirmed the price
}
```

## User Interface Elements

### Price Selection Interface
- **ML Prediction Display**: Shows predicted amount prominently
- **Radio Button Options**: Clear choice between ML or custom
- **Custom Price Input**: Only shown when custom option selected
- **Confirmation Button**: Must be clicked to proceed
- **Visual Feedback**: Clear indication of choice made

### Admin Dashboard
- **Color Coding**: Blue for ML, Green for User custom
- **Icons**: 🤖 for ML, 👤 for User
- **Price Comparison**: Shows both chosen and predicted prices
- **Tooltips**: Additional context on hover

## Testing the Implementation

### Test Scenario 1: ML Price Acceptance
1. Fill item details → ML predicts ₹45,000
2. Select "Accept ML predicted price"
3. Click "Confirm Selected Price"
4. Submit item
5. **Expected**: `price_source: "ml"`, `current_price: 45000`

### Test Scenario 2: Custom Price Setting
1. Fill item details → ML predicts ₹45,000
2. Select "Set my own custom price"
3. Enter ₹50,000
4. Click "Confirm Selected Price"
5. Submit item
6. **Expected**: `price_source: "user"`, `current_price: 50000`

## Benefits
- **Transparency**: Clear tracking of pricing decisions
- **Analytics**: Can analyze ML accuracy vs user preferences
- **Audit Trail**: Know how each price was determined
- **User Experience**: Clear choice and confirmation process
- **Data Integrity**: Consistent price source tracking across the system
