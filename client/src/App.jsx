import { useState, useEffect } from 'react';

function App() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => console.error('Health check failed:', err));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Registar članova
        </h1>
        {health ? (
          <p className="text-green-600">
            API status: {health.status} | {health.timestamp}
          </p>
        ) : (
          <p className="text-gray-500">Connecting to API...</p>
        )}
      </div>
    </div>
  );
}

export default App;
