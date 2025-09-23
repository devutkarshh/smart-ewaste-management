# ML Price Prediction for E-waste Management System

This directory contains the machine learning model for predicting current prices of e-waste items based on their features.

## Setup Instructions

### 1. Install Python Dependencies
Run the setup script for your operating system:

**Windows:**
```bash
ml\setup.bat
```

**Linux/Mac:**
```bash
chmod +x ml/setup.sh
./ml/setup.sh
```

**Manual installation:**
```bash
pip install -r ml/requirements.txt
```

### 2. Prepare Your Dataset

Place your dataset file named `expiry_price_data.csv` in the `ml/` directory.

**Required columns in your dataset:**
- `Product_Type` - Product category (will be mapped to your system categories)
- `Brand` - Brand name
- `Build_Quality` - Quality rating (1-5 scale)
- `User_Lifespan` - Expected lifespan in years
- `Usage_Pattern` - Light/Moderate/Heavy
- `Condition` - Current condition (1-5 scale)
- `Original_Price` - Original purchase price
- `Used_Duration` - How long it has been used (years)
- `Current_Price` - Current market value (target variable)

### 3. Train the Model

```bash
python ml/train_model.py
```

This will:
- Load and preprocess your data
- Train a Random Forest model
- Save the trained model to `ml/models/price_prediction_model.pkl`
- Save feature names to `ml/models/feature_names.pkl`
- Save model metrics to `ml/models/model_metrics.json`

### 4. Integration with Web Application

The system automatically predicts prices when items are created. The integration uses:

1. **Heuristic calculation** (currently active) - A rule-based approach for immediate functionality
2. **ML model integration** (when trained model is available) - More accurate predictions

## File Structure

```
ml/
├── train_model.py          # Main training script
├── price_predictor.py      # Python prediction service
├── requirements.txt        # Python dependencies
├── setup.sh               # Linux/Mac setup script
├── setup.bat              # Windows setup script
├── README.md              # This file
├── expiry_price_data.csv  # Your dataset (to be added)
└── models/                # Trained models directory
    ├── price_prediction_model.pkl
    ├── feature_names.pkl
    └── model_metrics.json
```

## API Integration

The web application includes:
- `/api/predict-price` - REST API endpoint for price prediction
- Automatic price prediction when items are reported
- Price display in admin dashboard

## Model Performance

After training, check `ml/models/model_metrics.json` for:
- Mean Squared Error (MSE)
- Root Mean Squared Error (RMSE) 
- R-squared (R²) Score
- Feature count and sample sizes

## Category Mapping

Your dataset's `Product_Type` values will be mapped to system categories:
- Tablet → Tablet
- Microwave → Microwave  
- Air Conditioner → Air Conditioner
- TV → TV
- Washing Machine → Washing Machine
- Laptop → Laptop
- Smartphone → Smartphone
- Refrigerator → Refrigerator

## Troubleshooting

1. **Missing dependencies**: Run the setup script again
2. **Dataset not found**: Ensure `expiry_price_data.csv` is in the `ml/` folder
3. **Model not loading**: Check that training completed successfully
4. **Poor predictions**: Review your dataset quality and consider feature engineering

## Future Enhancements

- Integration with real-time market data
- Advanced feature engineering
- Model retraining pipeline
- A/B testing for different models
- Price trend analysis
