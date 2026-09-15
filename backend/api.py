"""
AI Supply Chain Delay Prediction - FastAPI REST API
===================================================
Serves real-time delay probability predictions, risk tiering,
and explainability factor rankings.

Run locally:
    cd backend
    uvicorn api:app --reload --port 8000
"""

import os
import time
import json
import joblib
import pandas as pd
import numpy as np
from contextlib import asynccontextmanager
from typing import List, Literal, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator


# -----------------------------------------------------------------------------
# Configuration & Paths
# -----------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
PREPROCESSOR_PATH = os.path.join(BASE_DIR, "preprocessor.pkl")
FEATURE_IMPORTANCE_PATH = os.path.join(BASE_DIR, "feature_importance.json")

# In-memory application state
ml_state: Dict[str, Any] = {
    "model": None,
    "preprocessor": None,
    "feature_names": [],
    "feature_importance": [],
    "best_model_name": "Unknown",
    "ready": False
}


def load_artifacts():
    """Load model, preprocessor, and explainability artifacts into memory."""
    if not os.path.exists(MODEL_PATH) or not os.path.exists(PREPROCESSOR_PATH):
        print(f"[WARNING] Model or preprocessor not found at '{MODEL_PATH}'.")
        print("[WARNING] Please run 'python train_model.py' to generate artifacts.")
        ml_state["ready"] = False
        return

    try:
        # Load trained model
        ml_state["model"] = joblib.load(MODEL_PATH)

        # Load preprocessor bundle
        bundle = joblib.load(PREPROCESSOR_PATH)
        if isinstance(bundle, dict):
            ml_state["preprocessor"] = bundle.get("preprocessor")
            ml_state["feature_names"] = bundle.get("feature_names", [])
            ml_state["best_model_name"] = bundle.get("best_model_name", type(ml_state["model"]).__name__)
        else:
            ml_state["preprocessor"] = bundle
            ml_state["feature_names"] = []
            ml_state["best_model_name"] = type(ml_state["model"]).__name__

        # Load feature importance
        if os.path.exists(FEATURE_IMPORTANCE_PATH):
            with open(FEATURE_IMPORTANCE_PATH, "r", encoding="utf-8") as f:
                ml_state["feature_importance"] = json.load(f)
        else:
            ml_state["feature_importance"] = []

        ml_state["ready"] = True
        print(f"[API] Artifacts loaded successfully. Active Model: {ml_state['best_model_name']}")

    except Exception as e:
        print(f"[ERROR] Failed to load ML artifacts: {e}")
        ml_state["ready"] = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler: load artifacts on startup."""
    load_artifacts()
    yield


# -----------------------------------------------------------------------------
# FastAPI Application & Middleware
# -----------------------------------------------------------------------------
app = FastAPI(
    title="AI Supply Chain Delay Prediction API",
    description="Predict shipment delay probability before dispatch with explainable risk factors.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for all origins in development mode
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------------------------------------------------------
# Custom Error Handlers
# -----------------------------------------------------------------------------
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Format 422 Unprocessable Entity responses with clean, actionable error messages.
    """
    errors = []
    for err in exc.errors():
        field_path = " -> ".join(str(loc) for loc in err.get("loc", []))
        errors.append({
            "field": field_path,
            "message": err.get("msg", "Invalid value"),
            "type": err.get("type", "validation_error")
        })

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "The shipment prediction payload contains invalid fields or types.",
            "details": errors
        }
    )


# -----------------------------------------------------------------------------
# Pydantic Schemas
# -----------------------------------------------------------------------------
WeatherType = Literal["Clear", "Rain", "Storm", "Fog", "Snow"]
TransportModeType = Literal["Road", "Rail", "Air", "Sea"]
RiskLevelType = Literal["Low", "Medium", "High"]


class PredictionInput(BaseModel):
    distance_km: float = Field(
        ...,
        ge=0.0,
        description="Shipment transit distance in kilometers (must be >= 0)",
        examples=[450.5]
    )
    weather: WeatherType = Field(
        ...,
        description="Transit weather condition: Clear, Rain, Storm, Fog, Snow",
        examples=["Storm"]
    )
    transport_mode: TransportModeType = Field(
        ...,
        description="Transport mode: Road, Rail, Air, Sea",
        examples=["Road"]
    )
    supplier_reliability: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Supplier historical reliability score from 0.0 to 100.0",
        examples=[68.5]
    )
    is_holiday: bool = Field(
        ...,
        description="Whether shipment dispatch falls within a peak holiday period",
        examples=[False]
    )
    origin: str = Field(
        ...,
        min_length=1,
        description="Origin dispatch hub or terminal name",
        examples=["Munich Hub"]
    )
    destination: str = Field(
        ...,
        min_length=1,
        description="Destination consignee or depot name",
        examples=["Berlin DC"]
    )

    @field_validator("weather", mode="before")
    @classmethod
    def normalize_weather(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.strip().title()
        return v

    @field_validator("transport_mode", mode="before")
    @classmethod
    def normalize_transport_mode(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.strip().title()
        return v


class TopFactor(BaseModel):
    name: str = Field(..., description="Explainability factor or driver name")
    weight: float = Field(..., description="Relative factor weight (0 - 100)")


class PredictionResponse(BaseModel):
    delay_probability: float = Field(..., description="Delay probability percentage (0.0 to 100.0)")
    risk_level: RiskLevelType = Field(..., description="Delay risk category: Low (<34), Medium (34-66), High (>66)")
    latency_ms: int = Field(..., description="Inference pipeline latency in milliseconds")
    top_factors: List[TopFactor] = Field(..., description="Top 5 explainability factors influencing prediction")


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    best_model: str


# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------
def get_top_factors_for_input(input_data: PredictionInput) -> List[Dict[str, Any]]:
    """
    Computes explainability weights tailored to the specific shipment input,
    drawing from global model feature importance and input conditions.
    """
    global_factors = ml_state.get("feature_importance", [])

    # Factor impact mapping based on input values
    contextual_factors = []

    # 1. Weather factor
    weather_key = f"Weather {input_data.weather}"
    w_weight = next((f["weight"] for f in global_factors if f["name"] == weather_key), 18.0)
    contextual_factors.append({
        "name": f"Weather Condition ({input_data.weather})",
        "weight": float(w_weight)
    })

    # 2. Supplier reliability factor
    rel_factor_weight = next((f["weight"] for f in global_factors if "Supplier" in f["name"]), 15.0)
    # Scale impact higher if reliability is low (<80)
    if input_data.supplier_reliability < 75.0:
        rel_weight = rel_factor_weight * 1.3
    else:
        rel_weight = rel_factor_weight * 0.7
    contextual_factors.append({
        "name": f"Supplier Reliability ({input_data.supplier_reliability:.0f}/100)",
        "weight": float(rel_weight)
    })

    # 3. Transport mode factor
    mode_key = f"Transport Mode {input_data.transport_mode}"
    m_weight = next((f["weight"] for f in global_factors if f["name"] == mode_key), 10.0)
    contextual_factors.append({
        "name": f"Transport Corridor ({input_data.transport_mode})",
        "weight": float(m_weight)
    })

    # 4. Distance factor
    dist_weight = next((f["weight"] for f in global_factors if "Distance" in f["name"]), 8.0)
    if input_data.distance_km > 1000.0:
        dist_weight *= 1.4
    contextual_factors.append({
        "name": f"Transit Distance ({input_data.distance_km:.0f} km)",
        "weight": float(dist_weight)
    })

    # 5. Holiday factor
    hol_weight = next((f["weight"] for f in global_factors if "Holiday" in f["name"]), 12.0)
    if not input_data.is_holiday:
        hol_weight *= 0.3
    contextual_factors.append({
        "name": "Holiday Season Congestion" if input_data.is_holiday else "Standard Non-Holiday Schedule",
        "weight": float(hol_weight)
    })

    # Normalize top 5 to 100% total scale
    total_w = sum(f["weight"] for f in contextual_factors)
    if total_w > 0:
        for f in contextual_factors:
            f["weight"] = round((f["weight"] / total_w) * 100.0, 1)

    # Sort descending
    contextual_factors.sort(key=lambda x: x["weight"], reverse=True)
    return contextual_factors[:5]


# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------
@app.get("/health", response_model=HealthResponse)
def health_check():
    """
    Health check endpoint returning system and ML model status.
    """
    return {
        "status": "ok",
        "model_loaded": ml_state["ready"],
        "best_model": ml_state["best_model_name"]
    }


@app.post("/predict", response_model=PredictionResponse)
def predict_delay_risk(payload: PredictionInput):
    """
    Accepts shipment parameters and returns delay probability (0-100),
    risk level ('Low' | 'Medium' | 'High'), latency, and top 5 explainability factors.
    """
    start_time = time.perf_counter()

    # Verify model is ready
    if not ml_state["ready"] or ml_state["model"] is None or ml_state["preprocessor"] is None:
        # Attempt just-in-time reload
        load_artifacts()
        if not ml_state["ready"]:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="ML model artifacts not loaded. Please train the model with 'python train_model.py'."
            )

    try:
        # 1. Prepare single-row DataFrame for preprocessing
        input_dict = {
            "distance_km": [payload.distance_km],
            "weather": [payload.weather],
            "transport_mode": [payload.transport_mode],
            "supplier_reliability": [payload.supplier_reliability],
            "is_holiday": [1 if payload.is_holiday else 0]
        }
        df_input = pd.DataFrame(input_dict)

        # 2. Transform using preprocessor
        X_trans = ml_state["preprocessor"].transform(df_input)

        # 3. Model Inference
        model = ml_state["model"]
        if hasattr(model, "predict_proba"):
            prob_raw = float(model.predict_proba(X_trans)[0][1])
        else:
            prob_raw = float(model.predict(X_trans)[0])

        # Delay probability in percent: 0.0 - 100.0, rounded to 1 decimal
        delay_prob = round(min(100.0, max(0.0, prob_raw * 100.0)), 1)

        # 4. Risk Level classification: Low < 34, Medium 34-66, High > 66
        if delay_prob < 34.0:
            risk_level: RiskLevelType = "Low"
        elif delay_prob <= 66.0:
            risk_level: RiskLevelType = "Medium"
        else:
            risk_level: RiskLevelType = "High"

        # 5. Top 5 Factors for explainability
        top_factors = get_top_factors_for_input(payload)

        # 6. Measured latency
        latency_ms = max(1, int(round((time.perf_counter() - start_time) * 1000)))

        return {
            "delay_probability": delay_prob,
            "risk_level": risk_level,
            "latency_ms": latency_ms,
            "top_factors": top_factors
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}"
        )
