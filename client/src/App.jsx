import { useState, useEffect } from 'react';

const API_URL = '';

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

// ==================== LOGIN ====================

function LoginPage() {
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

// ==================== PENDING VIEW ====================

function PendingView({ pending }) {
  const data = pending.fieldData;
  const status = pending.fieldStatus;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Registar članova</h1>
      <h2>Vaša prijava čeka odobrenje</h2>
      <p>Voditelj sekcije <strong>{pending.homeSection?.name}</strong> mora odobriti vašu prijavu.</p>
      <br />
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={thStyle}>Polje</th>
            <th style={thStyle}>Vrijednost</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data).map(([key, value]) => {
            const fieldLabel = FIELD_LABELS[key] || key;
            const displayValue = Array.isArray(value) ? value.join(', ') : String(value ?? '');
            const fieldStatus = status[key] || 'PENDING';
            return (
              <tr key={key}>
                <td style={tdStyle}>{fieldLabel}</td>
                <td style={tdStyle}>{displayValue}</td>
                <td style={{
                  ...tdStyle,
                  color: fieldStatus === 'APPROVED' ? 'green' : fieldStatus === 'REJECTED' ? 'red' : 'orange',
                }}>
                  {fieldStatus === 'PENDING' ? 'Na čekanju' : fieldStatus === 'APPROVED' ? 'Odobreno' : 'Odbijeno'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const FIELD_LABELS = {
  firstName: 'Ime',
  lastName: 'Prezime',
  oib: 'OIB',
  dateOfBirth: 'Datum rođenja',
  address: 'Adresa',
  gender: 'Spol',
  faculty: 'Fakultet',
  phone: 'Broj telefona',
  privateEmail: 'Privatni e-mail',
  associationEmail: 'E-mail pri udruzi',
  memberSince: 'Datum učlanjenja',
  cardNumber: 'Broj iskaznice',
  membershipLevel: 'Razina članstva',
  fullMemberSince: 'Datum punopravnog članstva',
  homeSectionId: 'Matična sekcija',
  sectionIds: 'Pridružene sekcije',
  teamIds: 'Timovi',
  drinkIds: 'Pića',
  allergyIds: 'Alergije',
  dietType: 'Tip prehrane',
  shirtSize: 'Veličina majice',
  acceptedDocuments: 'Prihvaćanje akata',
};

// ==================== REGISTRATION FORM ====================

function RegistrationForm({ email, onSubmitted }) {
  const [sections, setSections] = useState([]);
  const [teams, setTeams] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    oib: '',
    dateOfBirth: '',
    address: '',
    gender: '',
    faculty: '',
    phone: '',
    privateEmail: '',
    associationEmail: email || '',
    memberSince: new Date().toISOString().split('T')[0],
    cardNumber: '',
    membershipLevel: 'PRIDRUZENO',
    fullMemberSince: '',
    homeSectionId: '',
    sectionIds: [],
    teamIds: [],
    drinkIds: [],
    allergyIds: [],
    dietType: '',
    shirtSize: '',
    acceptedDocuments: false,
  });

  useEffect(() => {
    const headers = authHeaders();
    Promise.all([
      fetch('/api/sections', { headers }).then((r) => r.json()),
      fetch('/api/teams', { headers }).then((r) => r.json()),
      fetch('/api/drinks', { headers }).then((r) => r.json()),
      fetch('/api/allergies', { headers }).then((r) => r.json()),
    ]).then(([s, t, d, a]) => {
      setSections(s);
      setTeams(t);
      setDrinks(d);
      setAllergies(a);
    });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleMultiSelect = (e, field) => {
    const selected = Array.from(e.target.selectedOptions, (o) => parseInt(o.value));
    setForm((prev) => ({ ...prev, [field]: selected }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    try {
      const body = {
        ...form,
        homeSectionId: parseInt(form.homeSectionId),
      };

      const res = await fetch('/api/pending', {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors(data.errors || [data.error || 'Greška pri slanju.']);
        return;
      }

      onSubmitted(data);
    } catch (err) {
      setErrors(['Mrežna greška. Pokušajte ponovo.']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <h1>Registar članova</h1>
      <h2>Pristupna forma</h2>

      {errors.length > 0 && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {errors.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>Osobni podatci</legend>

          <label>Ime *<br />
            <input name="firstName" value={form.firstName} onChange={handleChange} required />
          </label><br /><br />

          <label>Prezime *<br />
            <input name="lastName" value={form.lastName} onChange={handleChange} required />
          </label><br /><br />

          <label>OIB (11 znamenaka) *<br />
            <input name="oib" value={form.oib} onChange={handleChange} maxLength={11} pattern="\d{11}" required />
          </label><br /><br />

          <label>Datum rođenja *<br />
            <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} required />
          </label><br /><br />

          <label>Adresa *<br />
            <input name="address" value={form.address} onChange={handleChange} required style={{ width: '100%' }} />
          </label><br /><br />

          <label>Spol *<br />
            <select name="gender" value={form.gender} onChange={handleChange} required>
              <option value="">-- Odaberite --</option>
              <option value="M">Muški</option>
              <option value="Z">Ženski</option>
            </select>
          </label><br /><br />

          <label>Fakultet *<br />
            <input name="faculty" value={form.faculty} onChange={handleChange} required />
          </label><br /><br />

          <label>Broj telefona *<br />
            <input name="phone" value={form.phone} onChange={handleChange} required />
          </label><br /><br />

          <label>Privatni e-mail *<br />
            <input name="privateEmail" type="email" value={form.privateEmail} onChange={handleChange} required />
          </label><br /><br />

          <label>E-mail pri udruzi *<br />
            <input name="associationEmail" type="email" value={form.associationEmail} onChange={handleChange} required />
          </label><br /><br />
        </fieldset>

        <fieldset>
          <legend>Članstvo</legend>

          <label>Datum učlanjenja *<br />
            <input name="memberSince" type="date" value={form.memberSince} onChange={handleChange} required />
          </label><br /><br />

          <label>Broj iskaznice *<br />
            <input name="cardNumber" value={form.cardNumber} onChange={handleChange} required />
          </label><br /><br />

          <label>Razina članstva *<br />
            <select name="membershipLevel" value={form.membershipLevel} onChange={handleChange} required>
              <option value="PRIDRUZENO">Pridruženo</option>
              <option value="PUNOPRAVNO">Punopravno</option>
              <option value="POCASNO">Počasno</option>
              <option value="STARO">Staro</option>
            </select>
          </label><br /><br />

          {form.membershipLevel === 'PUNOPRAVNO' && (
            <>
              <label>Datum postanka punopravnim članom<br />
                <input name="fullMemberSince" type="date" value={form.fullMemberSince} onChange={handleChange} />
              </label><br /><br />
            </>
          )}

          <label>Matična sekcija *<br />
            <select name="homeSectionId" value={form.homeSectionId} onChange={handleChange} required>
              <option value="">-- Odaberite --</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label><br /><br />

          <label>Pridružene sekcije (Ctrl+click za više)<br />
            <select multiple size={5} value={form.sectionIds.map(String)} onChange={(e) => handleMultiSelect(e, 'sectionIds')}>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label><br /><br />

          <label>Timovi (Ctrl+click za više)<br />
            <select multiple size={3} value={form.teamIds.map(String)} onChange={(e) => handleMultiSelect(e, 'teamIds')}>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label><br /><br />
        </fieldset>

        <fieldset>
          <legend>Ostalo</legend>

          <label>Tip prehrane *<br />
            <select name="dietType" value={form.dietType} onChange={handleChange} required>
              <option value="">-- Odaberite --</option>
              <option value="MESOJED">Mesojed</option>
              <option value="VEGETARIJANSTVO">Vegetarijanstvo</option>
              <option value="VEGANSTVO">Veganstvo</option>
              <option value="SVEJED">Svejed</option>
            </select>
          </label><br /><br />

          <label>Pića * (Ctrl+click za više, min. 1)<br />
            <select multiple size={5} value={form.drinkIds.map(String)} onChange={(e) => handleMultiSelect(e, 'drinkIds')} required>
              {drinks.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label><br /><br />

          <label>Alergije (Ctrl+click za više)<br />
            <select multiple size={5} value={form.allergyIds.map(String)} onChange={(e) => handleMultiSelect(e, 'allergyIds')}>
              {allergies.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label><br /><br />

          <label>Veličina majice *<br />
            <input name="shirtSize" value={form.shirtSize} onChange={handleChange} placeholder="S, M, L, XL..." required />
          </label><br /><br />

          <label>
            <input name="acceptedDocuments" type="checkbox" checked={form.acceptedDocuments} onChange={handleChange} required />
            {' '}Prihvaćam akte i dokumente udruge *
          </label><br /><br />
        </fieldset>

        <button type="submit" disabled={submitting} style={{ padding: '0.5rem 2rem', fontSize: '1rem' }}>
          {submitting ? 'Šaljem...' : 'Pošalji prijavu'}
        </button>
      </form>
    </div>
  );
}

// ==================== MEMBER VIEW ====================

function MemberView({ member }) {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Registar članova</h1>
      <h2>Moj profil</h2>
      <p><strong>Ime:</strong> {member.firstName} {member.lastName}</p>
      <p><strong>OIB:</strong> {member.oib}</p>
      <p><strong>E-mail pri udruzi:</strong> {member.associationEmail}</p>
      <p><strong>Rola:</strong> {member.appRole}</p>
      <p><strong>Matična sekcija:</strong> {member.homeSection?.name}</p>
      <p><em>Uređivanje profila dolazi u sljedećem koraku.</em></p>
    </div>
  );
}

// ==================== MAIN APP ====================

function App() {
  const [user, setUser] = useState(null);
  const [pending, setPending] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle auth callback
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const path = window.location.pathname;

    if (path === '/auth/callback' && token) {
      localStorage.setItem('token', token);
      window.history.replaceState({}, '', '/');
    }

    loadUser();
  }, []);

  const loadUser = async () => {
    const storedToken = getToken();
    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: authHeaders(),
      });

      if (!res.ok) {
        localStorage.removeItem('token');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setUser(data);

      // If new user, check for pending application
      if (data.isNewUser && data.hasPendingApplication) {
        const pendingRes = await fetch('/api/pending/me', {
          headers: authHeaders(),
        });
        if (pendingRes.ok) {
          setPending(await pendingRes.json());
        }
      }
    } catch (err) {
      console.error(err);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setPending(null);
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Učitavanje...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  const content = (() => {
    // Existing member
    if (!user.isNewUser && user.member) {
      return <MemberView member={user.member} />;
    }

    // New user with pending application
    if (user.isNewUser && pending) {
      return <PendingView pending={pending} />;
    }

    // New user, no pending - show registration form
    return (
      <RegistrationForm
        email={user.email}
        onSubmitted={(data) => setPending(data)}
      />
    );
  })();

  return (
    <div>
      <div style={{ padding: '0.5rem 2rem', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{user.email}</span>
        <button onClick={handleLogout} style={{ padding: '0.3rem 1rem' }}>Odjava</button>
      </div>
      {content}
    </div>
  );
}

const thStyle = { border: '1px solid #ccc', padding: '0.5rem', textAlign: 'left', background: '#f5f5f5' };
const tdStyle = { border: '1px solid #ccc', padding: '0.5rem' };

export default App;
