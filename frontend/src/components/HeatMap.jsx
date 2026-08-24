 import {
  MapContainer,
  TileLayer,
  GeoJSON,
} from "react-leaflet";

import { useEffect, useState } from "react";

function HeatMap() {
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/heatmap")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch heatmap");
        }

        return response.json();
      })
      .then((data) => {
        setMapData(data.result.map_data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p>Loading FortyGuard heatmap...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <MapContainer
      center={[40.759, -73.984]}
      zoom={14}
      style={{ height: "600px", width: "100%" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {mapData && (
        <GeoJSON
          data={mapData}
          style={(feature) => {
            const temperature =
              feature?.properties?.temperature ?? 0;

            return {
              fillColor:
                temperature >= 35
                  ? "#d73027"
                  : temperature >= 30
                  ? "#fc8d59"
                  : "#4575b4",
              color: "transparent",
              fillOpacity: 0.65,
            };
          }}
        />
      )}
    </MapContainer>
  );
}

export default HeatMap;