import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os

def train_price_prediction_model():
    """Train a Random Forest model to predict current prices based on item features"""
    
    # Load the data
    try:
        df = pd.read_csv("ml/expiry_price_data.csv")
        print("Data loaded successfully!")
        print(f"Dataset shape: {df.shape}")
        print(f"Columns: {df.columns.tolist()}")
    except FileNotFoundError:
        print("Error: expiry_price_data.csv not found in ml/ directory")
        print("Please place your dataset in the ml/ folder")
        return None
    
    # Drop specified product types
    product_types_to_drop = ['DSLR Camera', 'Smartwatch', 'Electric Scooter', 'Gaming Console']
    df = df[~df['Product_Type'].isin(product_types_to_drop)].copy()
    print(f"Data shape after filtering: {df.shape}")
    
    # Handle categorical variables using one-hot encoding
    df_processed = pd.get_dummies(df, columns=['Product_Type', 'Brand', 'Usage_Pattern'])
    
    # Define features (X) and target (y)
    X = df_processed.drop('Current_Price', axis=1)
    y = df_processed['Current_Price']
    
    # Split the data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Data preprocessing complete. Data split into training and testing sets.")
    print("Shape of X_train:", X_train.shape)
    print("Shape of X_test:", X_test.shape)
    print("Shape of y_train:", y_train.shape)
    print("Shape of y_test:", y_test.shape)
    
    # Initialize and train the Random Forest Regressor model
    random_forest_model = RandomForestRegressor(
        n_estimators=100,
        random_state=42,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2
    )
    random_forest_model.fit(X_train, y_train)
    
    print("\nRandom Forest Regressor model trained successfully.")
    
    # Make predictions on the test set
    y_pred_rf = random_forest_model.predict(X_test)
    
    # Evaluate the model
    mse_rf = mean_squared_error(y_test, y_pred_rf)
    r2_rf = r2_score(y_test, y_pred_rf)
    rmse_rf = np.sqrt(mse_rf)
    
    print("\nRandom Forest Regressor Performance:")
    print(f"Mean Squared Error (MSE): {mse_rf:.2f}")
    print(f"Root Mean Squared Error (RMSE): {rmse_rf:.2f}")
    print(f"R-squared (R2) Score: {r2_rf:.4f}")
    
    # Save the trained model and feature names
    model_dir = "ml/models"
    os.makedirs(model_dir, exist_ok=True)
    
    joblib.dump(random_forest_model, f"{model_dir}/price_prediction_model.pkl")
    joblib.dump(X.columns.tolist(), f"{model_dir}/feature_names.pkl")
    
    print(f"\nModel saved to {model_dir}/price_prediction_model.pkl")
    print(f"Feature names saved to {model_dir}/feature_names.pkl")
    
    # Save model performance metrics
    metrics = {
        'mse': mse_rf,
        'rmse': rmse_rf,
        'r2_score': r2_rf,
        'feature_count': len(X.columns),
        'training_samples': len(X_train),
        'test_samples': len(X_test)
    }
    
    import json
    with open(f"{model_dir}/model_metrics.json", 'w') as f:
        json.dump(metrics, f, indent=2)
    
    print("Model metrics saved to model_metrics.json")
    
    return random_forest_model, X.columns.tolist()

if __name__ == "__main__":
    train_price_prediction_model()
