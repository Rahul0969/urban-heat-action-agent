import HeatMap from "./components/HeatMap";
import "./App.css";

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>Urban Heat Action Agent</h1>
        <p>AI-powered urban heat intelligence</p>
      </header>

      <main>
        <section className="dashboard-card">
          <h2>FortyGuard Temperature Map</h2>

          <HeatMap />
        </section>
      </main>
    </div>
  );
}

export default App;