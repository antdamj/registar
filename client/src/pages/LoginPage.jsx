export default function LoginPage() {
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
