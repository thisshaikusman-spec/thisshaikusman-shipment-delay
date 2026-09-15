"""
AI Supply Chain Delay Prediction - Model Training Pipeline
==========================================================
1. Loads shipment dataset from data/shipments.csv.
2. Cleans data, handles missing values, encodes categoricals and scales numericals.
3. Handles class imbalance using class weights.
4. Trains and evaluates Logistic Regression, Random Forest, and XGBoost.
5. Computes Accuracy, Precision, Recall, F1-Score, and ROC-AUC.
6. Selects best model by ROC-AUC and saves model.pkl, preprocessor.pkl, and feature_importance.json.
7. Prints a formatted comparison table to the console.
"""

import os
import sys
import json
import warnings
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score
)
from xgboost import XGBClassifier

# Suppress warnings for clean console presentation
warnings.filterwarnings("ignore")

# Force UTF-8 standard output for Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "shipments.csv")
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
PREPROCESSOR_PATH = os.path.join(BASE_DIR, "preprocessor.pkl")
FEATURE_IMPORTANCE_PATH = os.path.join(BASE_DIR, "feature_importance.json")


def load_and_validate_data(filepath: str) -> pd.DataFrame:
    """Load shipment dataset from CSV and check required columns."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(
            f"Dataset not found at '{filepath}'. Please place shipments.csv in data/ or run make_placeholder_data.py"
        )

    df = pd.read_csv(filepath)
    print(f"[DATA] Loaded {len(df)} records from '{filepath}'.")

    required_cols = [
        "distance_km",
        "weather",
        "transport_mode",
        "supplier_reliability",
        "is_holiday",
        "delayed"
    ]

    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Missing required column in dataset: '{col}'")

    return df


def clean_data(df: pd.DataFrame):
    """
    Cleans dataset, separates features and target, and normalizes types.
    """
    df = df.copy()

    # Target: ensure binary integer 0 or 1
    if df["delayed"].dtype == object or df["delayed"].dtype == bool:
        df["delayed"] = df["delayed"].astype(str).str.lower().map({
            "1": 1, "true": 1, "yes": 1, "delayed": 1,
            "0": 0, "false": 0, "no": 0, "on-time": 0
        }).fillna(0).astype(int)
    else:
        df["delayed"] = df["delayed"].fillna(0).astype(int)

    # Boolean columns
    if "is_holiday" in df.columns:
        if df["is_holiday"].dtype == object or df["is_holiday"].dtype == bool:
            df["is_holiday"] = df["is_holiday"].astype(str).str.lower().map({
                "1": 1, "true": 1, "yes": 1,
                "0": 0, "false": 0, "no": 0
            }).fillna(0).astype(int)
        else:
            df["is_holiday"] = df["is_holiday"].fillna(0).astype(int)

    # Numeric columns
    df["distance_km"] = pd.to_numeric(df["distance_km"], errors="coerce")
    df["supplier_reliability"] = pd.to_numeric(df["supplier_reliability"], errors="coerce")

    # Categorical columns
    df["weather"] = df["weather"].fillna("Clear").astype(str).str.strip().str.title()
    df["transport_mode"] = df["transport_mode"].fillna("Road").astype(str).str.strip().str.title()

    feature_cols = [
        "distance_km",
        "weather",
        "transport_mode",
        "supplier_reliability",
        "is_holiday"
    ]

    X = df[feature_cols]
    y = df["delayed"]

    return X, y


def build_preprocessor() -> ColumnTransformer:
    """
    Constructs a robust scikit-learn ColumnTransformer for imputing,
    scaling, and one-hot encoding features.
    """
    numeric_features = ["distance_km", "supplier_reliability"]
    categorical_features = ["weather", "transport_mode"]
    binary_features = ["is_holiday"]

    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    binary_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent"))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, numeric_features),
            ("cat", categorical_transformer, categorical_features),
            ("bin", binary_transformer, binary_features)
        ],
        remainder="drop"
    )

    return preprocessor


def extract_feature_names(preprocessor: ColumnTransformer) -> list:
    """Extract clean human-readable feature names from fitted ColumnTransformer."""
    names = []
    try:
        raw_names = preprocessor.get_feature_names_out()
        for name in raw_names:
            # e.g. cat__weather_Storm -> weather_Storm
            cleaned = name.replace("num__", "").replace("cat__", "").replace("bin__", "")
            names.append(cleaned)
    except Exception:
        # Fallback names
        names = ["feature_" + str(i) for i in range(20)]
    return names


def compute_feature_importance(model, feature_names: list) -> list:
    """
    Extracts and ranks feature importance for explainability.
    Normalizes weights into 0 - 100 percentage scale.
    """
    raw_weights = None

    if hasattr(model, "feature_importances_"):
        raw_weights = model.feature_importances_
    elif hasattr(model, "coef_"):
        # For Logistic Regression, use absolute magnitude of coefficients
        raw_weights = np.abs(model.coef_[0])

    if raw_weights is None or len(raw_weights) == 0:
        return [{"name": name, "weight": round(100.0 / len(feature_names), 1)} for name in feature_names[:5]]

    # Ensure length matches
    min_len = min(len(feature_names), len(raw_weights))
    names = feature_names[:min_len]
    weights = np.array(raw_weights[:min_len], dtype=float)

    total_sum = np.sum(weights)
    if total_sum > 0:
        normalized_weights = (weights / total_sum) * 100.0
    else:
        normalized_weights = np.zeros_like(weights)

    ranked = []
    for name, weight in zip(names, normalized_weights):
        # Format display name
        display_name = name.replace("_", " ").title()
        ranked.append({
            "name": display_name,
            "raw_feature": name,
            "weight": round(float(weight), 1)
        })

    # Sort descending by weight
    ranked.sort(key=lambda x: x["weight"], reverse=True)
    return ranked


def print_comparison_table(results: list, best_model_name: str):
    """Prints a styled comparison table to the terminal."""
    header = f"{'Model':<24} | {'Accuracy':<10} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'ROC-AUC':<10}"
    divider = "-" * len(header)

    print("\n" + "=" * len(header))
    print("           MODEL PERFORMANCE COMPARISON")
    print("=" * len(header))
    print(header)
    print(divider)

    for r in results:
        is_best = " *" if r["model"] == best_model_name else ""
        row = (
            f"{r['model'] + is_best:<24} | "
            f"{r['accuracy']:<10.4f} | "
            f"{r['precision']:<10.4f} | "
            f"{r['recall']:<10.4f} | "
            f"{r['f1']:<10.4f} | "
            f"{r['roc_auc']:<10.4f}"
        )
        print(row)

    print(divider)
    print(f"* Best Model selected by ROC-AUC: {best_model_name}\n")


def train_and_evaluate():
    print("=" * 70)
    print("🚀 STARTING AI SUPPLY CHAIN DELAY PREDICTION TRAINING PIPELINE")
    print("=" * 70)

    # 1. Load Data
    df = load_and_validate_data(DATA_PATH)
    X, y = clean_data(df)

    delay_count = int(y.sum())
    total_count = len(y)
    print(f"[IMBALANCE CHECK] Class 0 (On-Time): {total_count - delay_count} | Class 1 (Delayed): {delay_count}")
    pos_weight = (total_count - delay_count) / max(1, delay_count)
    print(f"[IMBALANCE CHECK] Positive class weight ratio: {pos_weight:.2f}")

    # 2. Train/Test Split (Stratified 80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"[SPLIT] Train set: {len(X_train)} samples | Test set: {len(X_test)} samples")

    # 3. Fit Preprocessing Pipeline on X_train
    preprocessor = build_preprocessor()
    X_train_trans = preprocessor.fit_transform(X_train)
    X_test_trans = preprocessor.transform(X_test)
    feature_names = extract_feature_names(preprocessor)
    print(f"[PREPROCESSING] Generated {len(feature_names)} features: {feature_names}")

    # 4. Define Models with Class Imbalance Mitigation
    models = {
        "Logistic Regression": LogisticRegression(
            class_weight="balanced",
            max_iter=1000,
            random_state=42
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=150,
            max_depth=10,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1
        ),
        "XGBoost": XGBClassifier(
            n_estimators=150,
            max_depth=5,
            learning_rate=0.08,
            scale_pos_weight=pos_weight,
            random_state=42,
            eval_metric="logloss",
            n_jobs=-1
        )
    }

    # 5. Train & Evaluate Each Model
    results = []
    trained_models = {}

    for name, model in models.items():
        print(f"[TRAINING] Training {name}...")
        model.fit(X_train_trans, y_train)
        trained_models[name] = model

        y_pred = model.predict(X_test_trans)
        y_prob = model.predict_proba(X_test_trans)[:, 1]

        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        roc = roc_auc_score(y_test, y_prob)

        results.append({
            "model": name,
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1": f1,
            "roc_auc": roc
        })

    # 6. Select Best Model by ROC-AUC
    best_result = max(results, key=lambda x: x["roc_auc"])
    best_model_name = best_result["model"]
    best_model = trained_models[best_model_name]

    # 7. Print Formatted Comparison Table
    print_comparison_table(results, best_model_name)

    # 8. Compute Feature Importance for Explainability
    ranked_importance = compute_feature_importance(best_model, feature_names)

    # Save feature_importance.json
    with open(FEATURE_IMPORTANCE_PATH, "w", encoding="utf-8") as f:
        json.dump(ranked_importance, f, indent=2)
    print(f"[EXPLAINABILITY] Saved feature importance rankings to '{FEATURE_IMPORTANCE_PATH}'")
    print(f"[TOP FACTORS] Top 3 Drivers: {[f['name'] + ' (' + str(f['weight']) + '%)' for f in ranked_importance[:3]]}")

    # 9. Save Best Model and Preprocessor with Joblib
    joblib.dump(best_model, MODEL_PATH)
    print(f"[SAVED] Saved best model ({best_model_name}) to '{MODEL_PATH}'")

    # Package preprocessor bundle with metadata
    preprocessor_bundle = {
        "preprocessor": preprocessor,
        "feature_names": feature_names,
        "expected_columns": ["distance_km", "weather", "transport_mode", "supplier_reliability", "is_holiday"],
        "best_model_name": best_model_name,
        "best_metrics": best_result
    }
    joblib.dump(preprocessor_bundle, PREPROCESSOR_PATH)
    print(f"[SAVED] Saved preprocessor bundle to '{PREPROCESSOR_PATH}'")

    print("=" * 70)
    print("✅ TRAINING PIPELINE COMPLETED SUCCESSFULLY!")
    print(f"   Model: {best_model_name} (ROC-AUC: {best_result['roc_auc']:.4f})")
    print("=" * 70)

    return best_model_name, best_result


if __name__ == "__main__":
    train_and_evaluate()
