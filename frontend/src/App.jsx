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
          <h2>Temperature Heatmap</h2>
          <div className="map-placeholder">
            <p>Map coming next...</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;