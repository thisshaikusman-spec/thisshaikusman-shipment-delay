"""
Dataset Validation & Column Checker Utility
-------------------------------------------
Run this script to verify your real dataset before training:
    python backend/check_dataset.py path/to/your_dataset.csv
"""

import sys
import os
import csv
from typing import Dict, List, Any

# Ensure UTF-8 output even on legacy Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

EXPECTED_REQUIRED_COLUMNS = {
    "distance_km": "Numeric (float/int, > 0)",
    "weather": "Categorical ('Clear', 'Rain', 'Storm', 'Fog', 'Snow')",
    "transport_mode": "Categorical ('Road', 'Rail', 'Air', 'Sea')",
    "supplier_reliability": "Numeric (0.0 to 100.0)",
    "is_holiday": "Boolean or 0/1",
    "delayed": "Target label (0 for on-time, 1 for delayed)"
}

OPTIONAL_COLUMNS = {
    "origin": "Origin hub / terminal string (e.g. 'Munich Hub')",
    "destination": "Destination terminal string (e.g. 'Berlin DC')"
}

VALID_WEATHER = {"clear", "rain", "storm", "fog", "snow"}
VALID_MODES = {"road", "rail", "air", "sea"}


def check_dataset(filepath: str) -> bool:
    print("=" * 70)
    print(f"[INSPECTING DATASET] {filepath}")
    print("=" * 70)

    if not os.path.exists(filepath):
        print(f"[ERROR] File not found at '{filepath}'")
        return False

    try:
        with open(filepath, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            if not reader.fieldnames:
                print("[ERROR] CSV file appears to be empty or has no header row.")
                return False

            headers = [h.strip() for h in reader.fieldnames]
            header_map = {h.lower(): h for h in headers}

            print(f"[COLUMNS] Found {len(headers)} column(s): {', '.join(headers)}\n")

            # Check required columns
            missing_required = []
            for col in EXPECTED_REQUIRED_COLUMNS:
                if col.lower() not in header_map:
                    missing_required.append(col)

            if missing_required:
                print("[ERROR] MISSING REQUIRED COLUMNS:")
                for col in missing_required:
                    print(f"   - {col} ({EXPECTED_REQUIRED_COLUMNS[col]})")
                print("\n[WARNING] Please rename or add these columns before training.")
                return False
            else:
                print("[SUCCESS] All required columns present!")

            # Scan rows for data quality checks
            rows = list(reader)
            total_rows = len(rows)
            print(f"[ROWS] Total Rows: {total_rows}")

            if total_rows == 0:
                print("[ERROR] Dataset contains zero data rows.")
                return False

            # Column stats
            null_counts: Dict[str, int] = {h: 0 for h in headers}
            invalid_weather = set()
            invalid_modes = set()
            target_counts = {0: 0, 1: 0, "other": 0}

            for idx, row in enumerate(rows, start=1):
                for h in headers:
                    val = row.get(h, "").strip()
                    if val == "" or val.lower() in {"null", "none", "nan", "na"}:
                        null_counts[h] += 1

                # Check weather
                weather_col = header_map["weather"]
                w_val = row.get(weather_col, "").strip().lower()
                if w_val and w_val not in VALID_WEATHER:
                    invalid_weather.add(row.get(weather_col))

                # Check transport_mode
                mode_col = header_map["transport_mode"]
                m_val = row.get(mode_col, "").strip().lower()
                if m_val and m_val not in VALID_MODES:
                    invalid_modes.add(row.get(mode_col))

                # Check target
                target_col = header_map["delayed"]
                t_val = row.get(target_col, "").strip()
                if t_val in {"0", 0, "False", "false"}:
                    target_counts[0] += 1
                elif t_val in {"1", 1, "True", "true"}:
                    target_counts[1] += 1
                else:
                    target_counts["other"] += 1

            # Report Nulls
            print("\n--- Missing Value Report ---")
            has_nulls = False
            for h, count in null_counts.items():
                if count > 0:
                    has_nulls = True
                    pct = (count / total_rows) * 100
                    print(f"   [WARN] {h}: {count} nulls ({pct:.1f}%)")
            if not has_nulls:
                print("   [OK] No missing values detected.")

            # Report Categorical values
            print("\n--- Categorical Value Validation ---")
            if invalid_weather:
                print(f"   [WARN] Unexpected weather categories found: {list(invalid_weather)[:5]}")
                print("          Expected standard: Clear, Rain, Storm, Fog, Snow")
            else:
                print("   [OK] Weather values conform to expected categories.")

            if invalid_modes:
                print(f"   [WARN] Unexpected transport modes found: {list(invalid_modes)[:5]}")
                print("          Expected standard: Road, Rail, Air, Sea")
            else:
                print("   [OK] Transport modes conform to expected categories.")

            # Report Target Distribution
            print("\n--- Target Distribution ('delayed') ---")
            zeros = target_counts[0]
            ones = target_counts[1]
            print(f"   - On-Time (0): {zeros} ({zeros / total_rows * 100:.1f}%)")
            print(f"   - Delayed (1): {ones} ({ones / total_rows * 100:.1f}%)")
            if target_counts["other"] > 0:
                print(f"   [WARN] Unrecognized target values: {target_counts['other']}")

            print("\n" + "=" * 70)
            if not invalid_weather and not invalid_modes and target_counts["other"] == 0:
                print("[READY] DATASET IS READY FOR TRAINING! Run:")
                print("   python backend/train_model.py")
            else:
                print("[NOTE] Dataset has minor warnings above. You can still run training,")
                print("       and train_model.py will impute and encode the values.")
            print("=" * 70 + "\n")
            return True

    except Exception as e:
        print(f"[ERROR] Error inspecting file: {e}")
        return False


if __name__ == "__main__":
    target_path = sys.argv[1] if len(sys.argv) > 1 else "backend/data/shipments.csv"
    check_dataset(target_path)
