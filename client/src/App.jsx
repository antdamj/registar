import { useState, useEffect } from 'react';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we're on the auth callback page
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const path = window.location.pathname;

    if (path === '/auth/callback' && token) {
      localStorage.setItem('token', token);
      window.history.replaceState({}, '', '/');
    }

    // Try to load user from stored token
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then((res) => {
          if (!res.ok) {
            localStorage.removeItem('token');
            throw new Error('Token invalid');
          }
          return res.json();
        })
        .then((data) => setUser(data))
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Učitavanje...</p>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Registar članova</h1>
        <br />
        <a href="/api/auth/google">
          <button style={{ padding: '0.5rem 1.5rem', fontSize: '1rem' }}>
            Prijava putem Google računa
          </button>
        </a>
      </div>
    );
  }

  // Logged in
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Registar članova</h1>
      <br />
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Status:</strong> {user.isNewUser ? 'Novi korisnik' : 'Postojeći član'}</p>
      {user.isNewUser && user.hasPendingApplication && (
        <p><em>Vaša prijava čeka odobrenje voditelja sekcije.</em></p>
      )}
      {user.isNewUser && !user.hasPendingApplication && (
        <p><em>Trebate ispuniti pristupnu formu.</em></p>
      )}
      {user.member && (
        <div>
          <p><strong>Ime:</strong> {user.member.firstName} {user.member.lastName}</p>
          <p><strong>Rola:</strong> {user.member.appRole}</p>
          <p><strong>Matična sekcija:</strong> {user.member.homeSection?.name}</p>
        </div>
      )}
      <br />
      <button onClick={handleLogout} style={{ padding: '0.5rem 1.5rem' }}>
        Odjava
      </button>
    </div>
  );
}

export default App;
