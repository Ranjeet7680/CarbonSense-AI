import os
import csv
import json
import math

csv_path = r"c:\Users\Victus\Downloads\CarbonSense AI Tracker\Carbon Emission.csv\Carbon Emission.csv"
output_path = r"c:\Users\Victus\Downloads\CarbonSense AI Tracker\src\dataset_summary.json"

if not os.path.exists(csv_path):
    print(f"Error: CSV file not found at {csv_path}")
    exit(1)

data = []
with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Convert numeric fields
        for key in row:
            if key in ['Monthly Grocery Bill', 'Vehicle Monthly Distance Km', 'Waste Bag Weekly Count', 
                       'How Long TV PC Daily Hour', 'How Many New Clothes Monthly', 
                       'How Long Internet Daily Hour', 'CarbonEmission']:
                try:
                    row[key] = float(row[key])
                except ValueError:
                    row[key] = 0.0
        data.append(row)

total_records = len(data)
emissions = [row['CarbonEmission'] for row in data]
mean_emission = sum(emissions) / total_records
min_emission = min(emissions)
max_emission = max(emissions)

# Standard deviation
variance = sum((x - mean_emission) ** 2 for x in emissions) / total_records
std_dev = math.sqrt(variance)

# Histogram Bins for CarbonEmission distribution
bin_size = 500
max_bin = int(math.ceil(max_emission / bin_size) * bin_size)
bins = {b: 0 for b in range(0, max_bin, bin_size)}
for e in emissions:
    bin_idx = int(e // bin_size) * bin_size
    if bin_idx in bins:
        bins[bin_idx] += 1
    else:
        bins[bin_idx] = 1

histogram_data = [{"binStart": k, "binEnd": k + bin_size, "count": v} for k, v in sorted(bins.items())]

# Categorical breakdowns
cat_features = [
    'Body Type', 'Sex', 'Diet', 'How Often Shower', 'Heating Energy Source', 
    'Transport', 'Vehicle Type', 'Social Activity', 'Frequency of Traveling by Air', 
    'Energy efficiency'
]

categorical_breakdowns = {}
for feat in cat_features:
    groups = {}
    for row in data:
        val = row[feat]
        if not val:
            val = "None"
        if val not in groups:
            groups[val] = []
        groups[val].append(row['CarbonEmission'])
    
    categorical_breakdowns[feat] = []
    for val, vals in groups.items():
        avg = sum(vals) / len(vals)
        categorical_breakdowns[feat].append({
            "category": val,
            "avgEmission": round(avg, 2),
            "count": len(vals),
            "percentage": round((len(vals) / total_records) * 100, 2)
        })
    # Sort categories by average emission
    categorical_breakdowns[feat] = sorted(categorical_breakdowns[feat], key=lambda x: x["avgEmission"])

# Multi-value parsing function
def parse_list(val_str):
    if not val_str or val_str == '[]':
        return []
    cleaned = val_str.strip("[]").replace("'", "").replace('"', "")
    items = [x.strip() for x in cleaned.split(',') if x.strip()]
    return items

# Multi-value breakdown (Recycling and Cooking_With)
multi_breakdowns = {}
for feat in ['Recycling', 'Cooking_With']:
    all_items = set()
    for row in data:
        items = parse_list(row[feat])
        for item in items:
            all_items.add(item)
            
    multi_breakdowns[feat] = []
    for item in all_items:
        with_item = []
        for row in data:
            items = parse_list(row[feat])
            if item in items:
                with_item.append(row['CarbonEmission'])
        avg_with = sum(with_item) / len(with_item) if with_item else mean_emission
        multi_breakdowns[feat].append({
            "option": item,
            "avgEmissionWith": round(avg_with, 2),
            "count": len(with_item),
            "percentage": round((len(with_item) / total_records) * 100, 2)
        })
    multi_breakdowns[feat] = sorted(multi_breakdowns[feat], key=lambda x: x["avgEmissionWith"])

# Pearson Correlation for Numerical Features
numerical_stats = []
for f in [
    'Monthly Grocery Bill', 'Vehicle Monthly Distance Km', 'Waste Bag Weekly Count', 
    'How Long TV PC Daily Hour', 'How Many New Clothes Monthly', 'How Long Internet Daily Hour'
]:
    x_vals = [row[f] for row in data]
    mean_x = sum(x_vals) / total_records
    
    # Calculate correlation coefficient
    num_val = 0.0
    den_x = 0.0
    den_y = 0.0
    for i in range(total_records):
        diff_x = x_vals[i] - mean_x
        diff_y = emissions[i] - mean_emission
        num_val += diff_x * diff_y
        den_x += diff_x ** 2
        den_y += diff_y ** 2
        
    correlation = num_val / math.sqrt(den_x * den_y) if den_x > 0 and den_y > 0 else 0.0
    
    numerical_stats.append({
        "feature": f,
        "mean": round(mean_x, 2),
        "min": round(min(x_vals), 2),
        "max": round(max(x_vals), 2),
        "correlation": round(correlation, 4)
    })

# Output JSON
output_data = {
    "totalRecords": total_records,
    "meanEmission": round(mean_emission, 2),
    "minEmission": round(min_emission, 2),
    "maxEmission": round(max_emission, 2),
    "stdDev": round(std_dev, 2),
    "histogram": histogram_data,
    "categoricalBreakdowns": categorical_breakdowns,
    "multiBreakdowns": multi_breakdowns,
    "numericalStats": numerical_stats
}

with open(output_path, 'w', encoding='utf-8') as out_f:
    json.dump(output_data, out_f, indent=2)

print(f"Successfully calculated stats and saved to {output_path}")
