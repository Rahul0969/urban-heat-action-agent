import os
from pathlib import Path

from dotenv import load_dotenv

from fortyguard import FortyGuardClient


load_dotenv(Path(__file__).resolve().parent.parent / ".env")

client = FortyGuardClient()


def create_heatmap(
    polygon_aoi,
    start_date,
    start_time,
    granularity=100,
):
    response = client.create_heatmap(
        polygon_aoi=polygon_aoi,
        start_date=start_date,
        start_time=start_time,
        filter_type=1,
        granularity=granularity,
    )

    return response
