import joblib
import pandas as pd
import numpy as np
import os
from typing import Dict, Optional

class PricePredictionService:
    def __init__(self):
        self.model = None
        self.feature_names = None
        self.model_loaded = False
        self.load_model()
    
    def load_model(self):
        """Load the trained model and feature names"""
        try:
            model_path = "ml/models/price_prediction_model.pkl"
            features_path = "ml/models/feature_names.pkl"
            
            if os.path.exists(model_path) and os.path.exists(features_path):
                self.model = joblib.load(model_path)
                self.feature_names = joblib.load(features_path)
                self.model_loaded = True
                print("Price prediction model loaded successfully!")
            else:
                print("Model files not found. Please train the model first.")
                self.model_loaded = False
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model_loaded = False
    
    def prepare_features(self, item_data: Dict) -> Optional[pd.DataFrame]:
        """Prepare item features for prediction"""
        if not self.model_loaded:
            return None
        
        try:
            # Create a DataFrame with the input data
            # Map the categories to match training data
            category_mapping = {
                'Tablet': 'Tablet',
                'Microwave': 'Microwave',
                'Air Conditioner': 'Air Conditioner',
                'TV': 'TV',
                'Washing Machine': 'Washing Machine',
                'Laptop': 'Laptop',
                'Smartphone': 'Smartphone',
                'Refrigerator': 'Refrigerator'
            }
            
            # Prepare the input data
            input_data = {
                'Build_Quality': item_data.get('build_quality', 3),
                'User_Lifespan': item_data.get('user_lifespan', 5.0),
                'Condition': item_data.get('condition', 3),
                'Original_Price': item_data.get('original_price', 50000.0),
                'Used_Duration': item_data.get('used_duration', 2.0),
            }
            
            # Add expiry years if available
            if 'expiry_years' in item_data and item_data['expiry_years']:
                input_data['Expiry_Years'] = item_data['expiry_years']
            else:
                input_data['Expiry_Years'] = input_data['User_Lifespan']
            
            # Create DataFrame
            df = pd.DataFrame([input_data])
            
            # Handle categorical variables with one-hot encoding
            # Product Type
            product_type = category_mapping.get(item_data.get('category', 'Laptop'), 'Laptop')
            for feature in self.feature_names:
                if feature.startswith('Product_Type_'):
                    df[feature] = 0
            product_type_col = f'Product_Type_{product_type}'
            if product_type_col in self.feature_names:
                df[product_type_col] = 1
            
            # Brand
            brand = item_data.get('brand', 'HP')
            for feature in self.feature_names:
                if feature.startswith('Brand_'):
                    df[feature] = 0
            brand_col = f'Brand_{brand}'
            if brand_col in self.feature_names:
                df[brand_col] = 1
            
            # Usage Pattern
            usage_pattern = item_data.get('usage_pattern', 'Moderate')
            for feature in self.feature_names:
                if feature.startswith('Usage_Pattern_'):
                    df[feature] = 0
            usage_col = f'Usage_Pattern_{usage_pattern}'
            if usage_col in self.feature_names:
                df[usage_col] = 1
            
            # Ensure all features are present
            for feature in self.feature_names:
                if feature not in df.columns:
                    df[feature] = 0
            
            # Reorder columns to match training data
            df = df[self.feature_names]
            
            return df
            
        except Exception as e:
            print(f"Error preparing features: {e}")
            return None
    
    def predict_price(self, item_data: Dict) -> Optional[float]:
        """Predict the current price for an item"""
        if not self.model_loaded:
            print("Model not loaded. Cannot make predictions.")
            return None
        
        try:
            # Prepare features
            features_df = self.prepare_features(item_data)
            if features_df is None:
                return None
            
            # Make prediction
            predicted_price = self.model.predict(features_df)[0]
            
            # Ensure non-negative price
            predicted_price = max(0, predicted_price)
            
            return round(predicted_price, 2)
            
        except Exception as e:
            print(f"Error making prediction: {e}")
            return None
    
    def get_model_info(self) -> Dict:
        """Get information about the loaded model"""
        if not self.model_loaded:
            return {"status": "Model not loaded"}
        
        try:
            import json
            with open("ml/models/model_metrics.json", 'r') as f:
                metrics = json.load(f)
            
            return {
                "status": "Model loaded",
                "model_type": "Random Forest Regressor",
                "feature_count": len(self.feature_names),
                "metrics": metrics
            }
        except:
            return {
                "status": "Model loaded",
                "model_type": "Random Forest Regressor",
                "feature_count": len(self.feature_names) if self.feature_names else 0
            }

# Global instance
price_predictor = PricePredictionService()
