import { useEffect, useState } from "react";
import "./App.css";

const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, value));

const normalize = (value, min, max) => {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return null;
  }

  return clamp(
    ((Number(value) - min) / (max - min)) * 100,
    0,
    100
  );
};

const polarToCartesian = (cx, cy, r, angleDeg) => {
  const rad = (angleDeg * Math.PI) / 180;

  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
};

const describeArc = (
  cx,
  cy,
  r,
  startAngle,
  endAngle
) => {
  if (Math.abs(endAngle - startAngle) < 0.01) {
    return "";
  }

  const start = polarToCartesian(
    cx,
    cy,
    r,
    startAngle
  );

  const end = polarToCartesian(
    cx,
    cy,
    r,
    endAngle
  );

  const largeArcFlag =
    Math.abs(endAngle - startAngle) > 180
      ? 1
      : 0;

  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
};

const levelAccent = (level) => {
  const key = (level || "").toLowerCase();

  if (
    key.includes("extreme") ||
    key.includes("severe")
  ) {
    return "solar";
  }

  if (key.includes("high")) {
    return "flare";
  }

  if (key.includes("moderate")) {
    return "ember";
  }

  if (key.includes("low")) {
    return "purple";
  }

  return "ember";
};

const latest = (value) => {
  if (Array.isArray(value)) {
    return value.length > 0
      ? value[value.length - 1]
      : null;
  }

  return value;
};

function ThermalGauge({
  fraction,
  accent,
  value,
  label,
}) {
  const cx = 100;
  const cy = 92;
  const r = 74;
  const startAngle = 135;
  const endAngle = 405;

  const valueAngle =
    startAngle + 270 * clamp(fraction, 0, 1);

  return (
    <div className="gauge">
      <svg
        viewBox="0 0 200 170"
        className="gauge-svg"
        role="img"
        aria-label={`Heat risk gauge: ${label}`}
      >
        <defs>
          <linearGradient
            id="thermalSweep"
            x1="0"
            y1="1"
            x2="1"
            y2="0"
          >
            <stop
              offset="0%"
              stopColor="var(--purple)"
            />
            <stop
              offset="35%"
              stopColor="var(--ember)"
            />
            <stop
              offset="70%"
              stopColor="var(--flare)"
            />
            <stop
              offset="100%"
              stopColor="var(--solar)"
            />
          </linearGradient>
        </defs>

        <path
          d={describeArc(
            cx,
            cy,
            r,
            startAngle,
            endAngle
          )}
          className="gauge-track"
          fill="none"
        />

        <path
          d={describeArc(
            cx,
            cy,
            r,
            startAngle,
            valueAngle
          )}
          fill="none"
          stroke="url(#thermalSweep)"
          strokeWidth="14"
          strokeLinecap="round"
          className="gauge-value"
        />
      </svg>

      <div className="gauge-readout">
        <span
          className="gauge-number"
          style={{
            color: `var(--${accent})`,
          }}
        >
          {value}
        </span>

        <span className="gauge-caption">
          RISK SCORE
        </span>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  pct,
  accent,
}) {
  return (
    <div className="metric">
      <div className="metric-top">
        <h3>{label}</h3>

        <strong>
          {value ?? "—"}

          {value != null && unit ? (
            <span className="metric-unit">
              {unit}
            </span>
          ) : null}
        </strong>
      </div>

      <div className="metric-track">
        <div
          className="metric-fill"
          style={{
            width: `${pct ?? 0}%`,
            background: `var(--${accent})`,
          }}
        />
      </div>
    </div>
  );
}

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] =
    useState(null);

  useEffect(() => {
    const fetchEnvironmentalData = () => {
      fetch(
        `${import.meta.env.VITE_API_URL}/api/environmental`
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              "Backend request failed"
            );
          }

          return response.json();
        })
        .then((result) => {
          setData(result);
          setError(null);
          setLastUpdated(new Date());
        })
        .catch((err) => {
          setError(err.message);
        });
    };

    fetchEnvironmentalData();

    const interval = setInterval(
      fetchEnvironmentalData,
      60000
    );

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="app app--status">
        <div className="status-panel status-panel--error">
          <span className="status-eyebrow">
            SIGNAL LOST
          </span>

          <h1>
            Sensor feed unavailable
          </h1>

          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="app app--status">
        <div className="status-panel">
          <span className="status-eyebrow pulse">
            ● ACQUIRING SIGNAL
          </span>

          <h1>
            Urban Heat Action Agent
          </h1>

          <p>
            Reading hotspot telemetry from
            FortyGuard…
          </p>
        </div>
      </div>
    );
  }

  const location =
    data.environmental?.locations?.[0];

  const parameters =
    location?.parameters || {};

  const solar =
    location?.solar_irradiance?.["clear sky"] ||
    location?.solar_irradiance?.["clear_sky"] ||
    {};

  const heatIndex =
    parameters.heat_index_celsius;

  const wetBulb =
    parameters.wet_bulb_temperature_celsius;

  const humidity =
    parameters.relative_humidity_percent;

  const airQuality =
    parameters["air quality: idx"] ??
    parameters["air_quality:idx"] ??
    parameters["air_quality_idx"];

  const heatIndexValue =
    data.heat_index ?? latest(heatIndex);

  const wetBulbValue =
    data.wet_bulb ?? latest(wetBulb);

  const humidityValue =
    data.relative_humidity ??
    latest(humidity);

  const aqiValue =
    data.air_quality ??
    latest(airQuality);

  const heatRisk =
    data.heat_risk || {};

  const recommendations =
    data.recommendations?.recommendations ||
    [];

  const accent =
    levelAccent(heatRisk.level);

  const rawScore =
    Number(heatRisk.score);

  const validScore =
    Number.isFinite(rawScore);

  const gaugeValue =
    validScore ? rawScore : 0;

  const fraction =
    clamp(gaugeValue / 18, 0, 1);

  const solarMax = 1000;

  const ghiPct =
    normalize(
      solar.ghi,
      0,
      solarMax
    ) ?? 0;

  const dniPct =
    normalize(
      solar.dni,
      0,
      solarMax
    ) ?? 0;

  const dhiPct =
    normalize(
      solar.dhi,
      0,
      solarMax
    ) ?? 0;

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <span className="status-eyebrow pulse">
            ● LIVE
          </span>

          <h1>
            Urban Heat Action Agent
          </h1>
        </div>

        <p>
          FortyGuard sensing network
        </p>
      </header>

      <section className="hero">
        <ThermalGauge
          fraction={fraction}
          accent={accent}
          value={
            validScore
              ? heatRisk.score
              : "—"
          }
          label={
            heatRisk.level ||
            "unknown"
          }
        />

        <div className="hero-readout">
          <span
            className={`risk-chip risk-chip--${accent}`}
          >
            {heatRisk.level ||
              "UNKNOWN"}
          </span>

          <div className="hero-temp">
            {data.temperature != null
              ? Number(
                  data.temperature
                ).toFixed(1)
              : "—"}

            <span className="hero-temp-unit">
              °C
            </span>
          </div>

          <p className="hero-caption">
            Priority heat hotspot
            temperature
          </p>
        </div>
      </section>

      <section className="metrics">
        <MetricCard
          label="Heat Index"
          value={
            heatIndexValue != null
              ? Number(
                  heatIndexValue
                ).toFixed(1)
              : null
          }
          unit="°C"
          pct={normalize(
            heatIndexValue,
            20,
            50
          )}
          accent="ember"
        />

        <MetricCard
          label="Wet Bulb"
          value={
            wetBulbValue != null
              ? Number(
                  wetBulbValue
                ).toFixed(1)
              : null
          }
          unit="°C"
          pct={normalize(
            wetBulbValue,
            15,
            35
          )}
          accent="flare"
        />

        <MetricCard
          label="Humidity"
          value={
            humidityValue != null
              ? Number(
                  humidityValue
                ).toFixed(1)
              : null
          }
          unit="%"
          pct={normalize(
            humidityValue,
            0,
            100
          )}
          accent="purple"
        />

        <MetricCard
          label="Air Quality"
          value={
            aqiValue != null
              ? Number(
                  aqiValue
                ).toFixed(1)
              : null
          }
          unit=""
          pct={normalize(
            aqiValue,
            0,
            300
          )}
          accent="solar"
        />
      </section>

      <section className="recommendations">
        <h2>
          Recommended actions
        </h2>

        {recommendations.length > 0 ? (
          <ol>
            {recommendations.map(
              (recommendation, index) => (
                <li key={index}>
                  <span className="rec-index">
                    {String(
                      index + 1
                    ).padStart(2, "0")}
                  </span>

                  <span>
                    {recommendation}
                  </span>
                </li>
              )
            )}
          </ol>
        ) : (
          <p className="empty">
            No recommendations
            available.
          </p>
        )}
      </section>

      <section className="footer-grid">
        <div className="panel">
          <h2>
            Solar exposure
          </h2>

          <div className="solar-bar">
            <span>GHI</span>

            <div className="solar-track">
              <div
                className="solar-fill"
                style={{
                  width: `${ghiPct}%`,
                }}
              />
            </div>

            <strong>
              {solar.ghi ?? "—"} W/m²
            </strong>
          </div>

          <div className="solar-bar">
            <span>DNI</span>

            <div className="solar-track">
              <div
                className="solar-fill"
                style={{
                  width: `${dniPct}%`,
                }}
              />
            </div>

            <strong>
              {solar.dni ?? "—"} W/m²
            </strong>
          </div>

          <div className="solar-bar">
            <span>DHI</span>

            <div className="solar-track">
              <div
                className="solar-fill"
                style={{
                  width: `${dhiPct}%`,
                }}
              />
            </div>

            <strong>
              {solar.dhi ?? "—"} W/m²
            </strong>
          </div>
        </div>

        <div className="panel">
          <h2>
            Hotspot location
          </h2>

          <div className="coords">
            <div>
              <span>LAT</span>

              <strong>
                {data.location?.latitude !=
                null
                  ? Number(
                      data.location.latitude
                    ).toFixed(5)
                  : "—"}
              </strong>
            </div>

            <div>
              <span>LON</span>

              <strong>
                {data.location?.longitude !=
                null
                  ? Number(
                      data.location.longitude
                    ).toFixed(5)
                  : "—"}
              </strong>
            </div>
          </div>

          {lastUpdated && (
            <p
              style={{
                marginTop: "18px",
                color:
                  "var(--paper-dim)",
                fontFamily:
                  '"IBM Plex Mono", monospace',
                fontSize: "11px",
              }}
            >
              UPDATED{" "}
              {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;