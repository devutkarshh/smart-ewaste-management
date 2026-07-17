#!/bin/bash

echo "Setting up ML environment for e-waste price prediction..."

# Create models directory if it doesn't exist
mkdir -p ml/models

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r ml/requirements.txt

echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Place your dataset 'expiry_price_data.csv' in the ml/ folder"
echo "2. Run: python ml/train_model.py"
echo "3. The trained model will be saved in ml/models/"
echo ""
echo "Dataset should have columns:"
echo "- Product_Type (will map to your categories)"
echo "- Brand"
echo "- Build_Quality"
echo "- User_Lifespan"
echo "- Usage_Pattern (Light/Moderate/Heavy)"
echo "- Condition"
echo "- Original_Price"
echo "- Used_Duration"
echo "- Current_Price (target variable)"
