# AI Supply Chain Delay Prediction Backend

A high-performance FastAPI backend and scikit-learn / XGBoost training pipeline that predicts shipment delay probability before dispatch and serves explainable risk factor weights via a REST API.

---

## 📁 Project Structure

```
backend/
├── data/
│   ├── shipments.csv             # Training dataset (columns: distance_km, weather, transport_mode, supplier_reliability, is_holiday, delayed)
│   └── make_placeholder_data.py # Script that generated representative logistics data
├── train_model.py                # ML pipeline: cleans, encodes, trains 3 models, evaluates, and exports best model
├── api.py                        # FastAPI REST API with CORS, Pydantic validation, and explainability
├── check_dataset.py              # CLI diagnostic tool to validate real CSV columns before training
├── test_api.py                   # Automated API integration and validation test suite
├── requirements.txt              # Production Python dependencies
├── model.pkl                     # Serialized best model (Joblib)
├── preprocessor.pkl              # Fitted ColumnTransformer & metadata (Joblib)
└── feature_importance.json       # Exported feature weights for explainability
```

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Inspect / Validate Real Data (Optional)
If you have your own CSV dataset, verify column names and formatting before training:
```bash
python check_dataset.py path/to/your_file.csv
```

### 3. Train and Compare Models
```bash
python train_model.py
```
This trains and evaluates:
- **Logistic Regression** (`class_weight='balanced'`)
- **Random Forest** (`class_weight='balanced'`)
- **XGBoost** (`scale_pos_weight`)

Calculates **Accuracy**, **Precision**, **Recall**, **F1-Score**, and **ROC-AUC**, prints a comparison table, and saves the best model to `model.pkl`.

### 4. Run the API
```bash
uvicorn api:app --reload --port 8000
```
Interactive Swagger documentation is available at:
👉 **`http://localhost:8000/docs`**

---

## 🔌 API Endpoints

### `GET /health`
Returns service and ML model status.

**Response:**
```json
{
  "status": "ok",
  "model_loaded": true,
  "best_model": "Logistic Regression"
}
```

---

### `POST /predict`
Predicts shipment delay probability and provides top risk drivers.

**Request Body:**
```json
{
  "distance_km": 450.5,
  "weather": "Storm",
  "transport_mode": "Road",
  "supplier_reliability": 68.5,
  "is_holiday": false,
  "origin": "Munich Hub",
  "destination": "Berlin DC"
}
```

**Response (`200 OK`):**
```json
{
  "delay_probability": 68.4,
  "risk_level": "High",
  "latency_ms": 4,
  "top_factors": [
    { "name": "Weather Condition (Storm)", "weight": 44.7 },
    { "name": "Supplier Reliability (69/100)", "weight": 24.1 },
    { "name": "Standard Non-Holiday Schedule", "weight": 14.5 },
    { "name": "Transit Distance (451 km)", "weight": 16.4 },
    { "name": "Transport Corridor (Road)", "weight": 0.3 }
  ]
}
```

**Risk Tier Thresholds:**
- **Low**: `< 34.0%`
- **Medium**: `34.0% - 66.0%`
- **High**: `> 66.0%`

---

## 🧪 Running Tests

Run the test suite to verify endpoints and validation:
```bash
python test_api.py
```
