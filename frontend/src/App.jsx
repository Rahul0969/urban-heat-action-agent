import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/environmental")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend request failed");
        }
        return response.json();
      })
      .then((result) => setData(result))
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div className="app"><h1>Error</h1><p>{error}</p></div>;
  }

  if (!data) {
    return <div className="app"><h1>Urban Heat Action Agent</h1><p>Loading...</p></div>;
  }

  const location = data.environmental?.locations?.[0];
  const parameters = location?.parameters || {};
  const solar = location?.solar_irradiance?.["clear_sky"] || {};

  const heatIndex = parameters.heat_index_celsius;
  const wetBulb = parameters.wet_bulb_temperature_celsius;
  const humidity = parameters.relative_humidity_percent;
  const aqi = parameters["air_quality:idx"];

  const latest = (value) => Array.isArray(value) ? value[value.length - 1] : value;

  return (
    <div className="app">
      <header>
        <h1>Urban Heat Action Agent</h1>
        <p>FortyGuard-powered urban heat intelligence</p>
      </header>

      <section className="hero">
        <h2>🔥 Priority Heat Hotspot</h2>
        <div className="temperature">
          {data.temperature?.toFixed(1)}°C
        </div>
        <p>Detected hotspot temperature</p>
      </section>

      <section className="cards">
        <div className="card">
          <h3>Heat Index</h3>
          <strong>{latest(heatIndex) ?? "N/A"}°C</strong>
        </div>

        <div className="card">
          <h3>Wet Bulb</h3>
          <strong>{latest(wetBulb) ?? "N/A"}°C</strong>
        </div>

        <div className="card">
          <h3>Humidity</h3>
          <strong>{latest(humidity) ?? "N/A"}%</strong>
        </div>

        <div className="card">
          <h3>Air Quality</h3>
          <strong>{latest(aqi) ?? "N/A"}</strong>
        </div>
      </section>

      <section className="location">
        <h2>📍 Hotspot Location</h2>
        <p>
          Latitude: {data.location?.latitude?.toFixed(5)}
        </p>
        <p>
          Longitude: {data.location?.longitude?.toFixed(5)}
        </p>
      </section>

      <section className="solar">
        <h2>☀️ Solar Exposure</h2>
        <p>GHI: {solar.ghi ?? "N/A"} W/m²</p>
        <p>DNI: {solar.dni ?? "N/A"} W/m²</p>
        <p>DHI: {solar.dhi ?? "N/A"} W/m²</p>
      </section>
    </div>
  );
}

export default App;