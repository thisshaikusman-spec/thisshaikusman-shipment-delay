"""
API Integration and Validation Test Suite
----------------------------------------
Tests:
- GET /health
- POST /predict (Low Risk scenario)
- POST /predict (High Risk scenario)
- POST /predict (Validation Error 422 scenario)
"""

import sys
from fastapi.testclient import TestClient
from api import app, load_artifacts

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def run_tests():
    print("=" * 70)
    print("🧪 RUNNING FASTAPI BACKEND TEST SUITE")
    print("=" * 70)

    # Initialize client and load artifacts
    load_artifacts()
    client = TestClient(app)

    # Test 1: GET /health
    print("\n[TEST 1] GET /health")
    res = client.get("/health")
    print(f"Status Code: {res.status_code}")
    print(f"Response: {res.json()}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    assert res.json().get("status") == "ok", "Expected status == ok"
    print("✅ TEST 1 PASSED!")

    # Test 2: POST /predict (Low Risk shipment)
    print("\n[TEST 2] POST /predict (Optimal Conditions -> Low Risk Expected)")
    low_risk_payload = {
        "distance_km": 150.0,
        "weather": "Clear",
        "transport_mode": "Road",
        "supplier_reliability": 95.0,
        "is_holiday": False,
        "origin": "Munich Hub",
        "destination": "Nuremberg Depot"
    }
    res = client.post("/predict", json=low_risk_payload)
    print(f"Status Code: {res.status_code}")
    data = res.json()
    print(f"Response: {data}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    assert "delay_probability" in data
    assert "risk_level" in data
    assert "latency_ms" in data
    assert "top_factors" in data
    assert len(data["top_factors"]) == 5
    print(f"Delay Probability: {data['delay_probability']}% | Risk Level: {data['risk_level']} | Latency: {data['latency_ms']}ms")
    print("✅ TEST 2 PASSED!")

    # Test 3: POST /predict (Severe Weather & Poor Supplier -> High Risk Expected)
    print("\n[TEST 3] POST /predict (Severe Weather & Disruption -> High Risk Expected)")
    high_risk_payload = {
        "distance_km": 1800.0,
        "weather": "Storm",
        "transport_mode": "Road",
        "supplier_reliability": 35.0,
        "is_holiday": True,
        "origin": "Milan Cargo",
        "destination": "Berlin DC"
    }
    res = client.post("/predict", json=high_risk_payload)
    print(f"Status Code: {res.status_code}")
    data = res.json()
    print(f"Response: {data}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    print(f"Delay Probability: {data['delay_probability']}% | Risk Level: {data['risk_level']} | Latency: {data['latency_ms']}ms")
    print("✅ TEST 3 PASSED!")

    # Test 4: POST /predict with invalid data -> Expect 422
    print("\n[TEST 4] POST /predict (Invalid Input -> Expect 422 Unprocessable Entity)")
    invalid_payload = {
        "distance_km": -50.0,            # Negative distance (invalid)
        "weather": "Tornado",            # Not in allowed weather types
        "transport_mode": "Submarine",   # Not in allowed transport modes
        "supplier_reliability": 150.0,   # > 100 (invalid)
        "is_holiday": False,
        "origin": "",                    # Empty string (invalid)
        "destination": "Berlin DC"
    }
    res = client.post("/predict", json=invalid_payload)
    print(f"Status Code: {res.status_code}")
    print(f"Error Response: {res.json()}")
    assert res.status_code == 422, f"Expected 422, got {res.status_code}"
    error_data = res.json()
    assert error_data.get("error") == "Validation Error"
    assert len(error_data.get("details", [])) >= 4
    print("✅ TEST 4 PASSED: Clean 422 Validation Error returned as expected!")

    print("\n" + "=" * 70)
    print("🎉 ALL 4 TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    run_tests()
