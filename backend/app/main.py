from fastapi import FastAPI, HTTPException

from app.fortyguard_service import create_heatmap


app = FastAPI(
    title="Urban Heat Action Agent",
    description="AI-powered urban heat analysis using FortyGuard",
    version="1.0.0",
)


@app.get("/")
def root():
    return {
        "message": "Urban Heat Action Agent API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/api/heatmap")
def heatmap():
    # Small test polygon.
    # We'll replace this with user-selected areas later.
    polygon = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-73.9855, 40.7580],
                        [-73.9855, 40.7600],
                        [-73.9820, 40.7600],
                        [-73.9820, 40.7580],
                        [-73.9855, 40.7580]
                    ]]
                }
            }
        ]
    }

    try:
        result = create_heatmap(
            polygon_aoi=polygon,
            start_date="2024-07-15",
            start_time="14:00",
            granularity=100,
        )

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )