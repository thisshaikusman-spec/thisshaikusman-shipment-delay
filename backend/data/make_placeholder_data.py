"""
Generates a realistic placeholder dataset for supply chain delay prediction.
Total rows: 1,500
Columns:
- distance_km: float (50 to 2,500 km)
- weather: Clear, Rain, Storm, Fog, Snow
- transport_mode: Road, Rail, Air, Sea
- supplier_reliability: float (0 - 100)
- is_holiday: int (0 or 1)
- origin: Hub string
- destination: Destination hub string
- delayed: int (0 or 1, imbalanced ~ 25-30% delayed)
"""

import os
import csv
import random
import math

random.seed(42)

ORIGINS = ["Munich Hub", "Frankfurt Central", "Hamburg Port", "Rotterdam Gate", "Milan Cargo", "Antwerp Freight"]
DESTINATIONS = ["Berlin DC", "Vienna Logistics", "Zurich Terminus", "Paris Nord", "Prague Depot", "Warsaw Crossdock"]
WEATHER_CHOICES = ["Clear", "Rain", "Storm", "Fog", "Snow"]
WEATHER_WEIGHTS = [0.45, 0.25, 0.10, 0.12, 0.08]

MODES = ["Road", "Rail", "Air", "Sea"]
MODE_WEIGHTS = [0.50, 0.25, 0.15, 0.10]


def generate_data(num_records=1500, output_path="backend/data/shipments.csv"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    rows = []
    for i in range(num_records):
        origin = random.choice(ORIGINS)
        destination = random.choice([d for d in DESTINATIONS if d != origin])
        weather = random.choices(WEATHER_CHOICES, weights=WEATHER_WEIGHTS)[0]
        mode = random.choices(MODES, weights=MODE_WEIGHTS)[0]

        # Distance distribution depending on mode
        if mode == "Road":
            distance = round(random.uniform(80, 1200), 1)
        elif mode == "Rail":
            distance = round(random.uniform(200, 1800), 1)
        elif mode == "Air":
            distance = round(random.uniform(500, 2600), 1)
        else: # Sea
            distance = round(random.uniform(400, 3200), 1)

        # Supplier reliability: beta distribution skewed towards 75-95
        reliability = round(min(100.0, max(15.0, random.betavariate(7, 2.5) * 100)), 1)

        # Holiday: ~15% of shipments
        is_holiday = 1 if random.random() < 0.15 else 0

        # Compute realistic delay probability to generate realistic delayed label
        logit = -1.8 # baseline log odds (~14% base delay)

        # Weather impacts
        weather_effects = {
            "Clear": -0.5,
            "Rain": 0.4,
            "Fog": 0.8,
            "Snow": 1.3,
            "Storm": 1.7
        }
        logit += weather_effects.get(weather, 0)

        # Supplier reliability effect: low reliability dramatically raises delay risk
        reliability_gap = (80.0 - reliability) / 25.0
        logit += reliability_gap * 0.9

        # Distance impact
        logit += (distance / 1200.0) * 0.5

        # Holiday impact
        if is_holiday:
            logit += 0.7

        # Transport mode nuances
        if mode == "Air" and weather in ["Storm", "Fog"]:
            logit += 1.1 # Air is sensitive to storm/fog
        elif mode == "Sea":
            logit += 0.4 # Port congestion
        elif mode == "Road" and weather in ["Snow", "Storm"]:
            logit += 0.8

        # Add stochastic noise
        logit += random.gauss(0, 0.4)

        prob = 1.0 / (1.0 + math.exp(-logit))
        delayed = 1 if random.random() < prob else 0

        rows.append({
            "distance_km": distance,
            "weather": weather,
            "transport_mode": mode,
            "supplier_reliability": reliability,
            "is_holiday": is_holiday,
            "origin": origin,
            "destination": destination,
            "delayed": delayed
        })

    fieldnames = [
        "distance_km",
        "weather",
        "transport_mode",
        "supplier_reliability",
        "is_holiday",
        "origin",
        "destination",
        "delayed"
    ]

    with open(output_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    delays = sum(r["delayed"] for r in rows)
    print(f"Generated {len(rows)} records in {output_path}")
    print(f"Delayed count: {delays} ({delays / len(rows) * 100:.1f}%), On-time: {len(rows) - delays}")


if __name__ == "__main__":
    generate_data()
