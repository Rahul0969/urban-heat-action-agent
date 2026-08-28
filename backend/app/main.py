from pathlib import Path
import sys

from app.heat_risk import calculate_heat_risk
from app.recommendations import generate_recommendations
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

sys.path.insert(0, str(BASE_DIR))

from fortyguard import FortyGuardClient
from fortyguard.samples import MANHATTAN_POLYGON

app = FastAPI(title="Urban Heat Action Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",

        "https://urban-heat-action-agent.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

client = FortyGuardClient()


def analyze_heatmap(result):
    map_data = result.get("map_data", {})
    features = map_data.get("features", [])

    temperatures = []

    for feature in features:
        properties = feature.get("properties", {})

        temperature = properties.get("temperature")

        if temperature is None:
            temperature = properties.get("average_temperature")

        if temperature is not None:
            temperatures.append(float(temperature))

    if not temperatures:
        return {
            "average_temperature": None,
            "minimum_temperature": None,
            "maximum_temperature": None,
            "hotspot_threshold": None,
            "hotspot_count": 0,
            "hotspots": [],
            "risk_level": "UNKNOWN"
        }

    average_temperature = sum(temperatures) / len(temperatures)
    minimum_temperature = min(temperatures)
    maximum_temperature = max(temperatures)

    sorted_temperatures = sorted(temperatures)
    index = int(len(sorted_temperatures) * 0.90)

    threshold = sorted_temperatures[
        min(index, len(sorted_temperatures) - 1)
    ]

    hotspots = []

    for feature in features:
        properties = feature.get("properties", {})

        temperature = properties.get("temperature")

        if temperature is None:
            temperature = properties.get("average_temperature")

        if temperature is not None and float(temperature) >= threshold:
            hotspots.append({
                "tile_id": properties.get("tile_id"),
                "temperature": float(temperature),
                "geometry": feature.get("geometry")
            })

    if maximum_temperature >= 40:
        risk_level = "EXTREME"
    elif maximum_temperature >= 35:
        risk_level = "HIGH"
    elif maximum_temperature >= 30:
        risk_level = "MODERATE"
    else:
        risk_level = "LOW"

    return {
        "average_temperature": round(average_temperature, 2),
        "minimum_temperature": round(minimum_temperature, 2),
        "maximum_temperature": round(maximum_temperature, 2),
        "hotspot_threshold": round(threshold, 2),
        "hotspot_count": len(hotspots),
        "hotspots": hotspots,
        "risk_level": risk_level
    }


@app.get("/")
def root():
    return {
        "message": "Urban Heat Action Agent API is running"
    }


@app.get("/api/heatmap")
def get_heatmap():
    response = client.create_heatmap(
        polygon_aoi=MANHATTAN_POLYGON,
        start_date="2024-07-15",
        start_time="14:00",
        filter_type=1,
        granularity=100
    )

    result = response["result"]
    analysis = analyze_heatmap(result)

    return {
        "activity_id": response["activity_id"],
        "heatmap": result,
        "analysis": analysis
    }


@app.get("/api/environmental")
def get_environmental():
    response = client.create_heatmap(
        polygon_aoi=MANHATTAN_POLYGON,
        start_date="2024-07-15",
        start_time="14:00",
        filter_type=1,
        granularity=100
    )

    heatmap_result = response["result"]
    analysis = analyze_heatmap(heatmap_result)

    if not analysis["hotspots"]:
        return {
            "error": "No hotspots found"
        }

    hotspot = analysis["hotspots"][0]

    geometry = hotspot.get("geometry", {})
    coordinates = geometry.get("coordinates", [])

    if not coordinates:
        return {
            "error": "Hotspot coordinates unavailable"
        }

    polygon = coordinates[0]

    longitude = sum(point[0] for point in polygon) / len(polygon)
    latitude = sum(point[1] for point in polygon) / len(polygon)

    temperature = hotspot["temperature"]

    response = client.environmental_parameters(
        latitude=latitude,
        longitude=longitude,
        temperature=temperature,
        start_date="2024-07-15",
        start_time="12:00",
        end_time="18:00",
        filter_type=2,
        analysis=[
            "heat_index_celsius",
            "apparent_temperature_celsius",
            "wet_bulb_temperature_celsius",
            "relative_humidity_percent",
            "air_quality:idx"
        ]
    )

    result = response["result"]

    locations = result.get("locations", [])

    if not locations:
        return {
            "error": "Environmental location data unavailable"
        }

    location_data = locations[0]
    parameters = location_data.get("parameters", {})

    heat_index_values = parameters.get(
        "heat_index_celsius",
        []
    )

    apparent_temperature_values = parameters.get(
        "apparent_temperature_celsius",
        []
    )

    wet_bulb_values = parameters.get(
        "wet_bulb_temperature_celsius",
        []
    )

    relative_humidity_values = parameters.get(
        "relative_humidity_percent",
        []
    )

    air_quality_values = []

    for key, values in parameters.items():
        normalized_key = key.lower().replace("_", "").replace(" ", "")

        if "airquality" in normalized_key and "idx" in normalized_key:
            if isinstance(values, list):
                air_quality_values = values
                break

    heat_index = (
        sum(heat_index_values) / len(heat_index_values)
        if heat_index_values
        else None
    )

    apparent_temperature = (
        sum(apparent_temperature_values) / len(apparent_temperature_values)
        if apparent_temperature_values
        else None
    )

    wet_bulb = (
        sum(wet_bulb_values) / len(wet_bulb_values)
        if wet_bulb_values
        else None
    )

    relative_humidity = (
        sum(relative_humidity_values) / len(relative_humidity_values)
        if relative_humidity_values
        else None
    )

    air_quality = (
        sum(air_quality_values) / len(air_quality_values)
        if air_quality_values
        else None
    )

    heat_risk = calculate_heat_risk(
        temperature=temperature,
        heat_index=heat_index,
        wet_bulb=wet_bulb,
        vegetation=None,
        impervious=None
    )

    recommendations = generate_recommendations(
        heat_risk=heat_risk,
        temperature=temperature,
        heat_index=heat_index,
        wet_bulb=wet_bulb
    )

    return {
        "location": {
            "latitude": latitude,
            "longitude": longitude
        },
        "temperature": round(temperature, 2),
        "heat_index": round(heat_index, 2)
        if heat_index is not None else None,
        "apparent_temperature": round(apparent_temperature, 2)
        if apparent_temperature is not None else None,
        "wet_bulb": round(wet_bulb, 2)
        if wet_bulb is not None else None,
        "relative_humidity": round(relative_humidity, 2)
        if relative_humidity is not None else None,
        "air_quality": round(air_quality, 2)
        if air_quality is not None else None,
        "heat_risk": heat_risk,
        "recommendations": recommendations,
        "environmental": result
    }