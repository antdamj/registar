import { useState, useEffect } from 'react';

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

async function refreshToken() {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: authHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('token', data.token);
      return true;
    }
  } catch (err) {
    console.error('Token refresh failed:', err);
  }
  return false;
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

// ==================== FIELD LABELS ====================

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

// ==================== PENDING VIEW ====================

function PendingView({ pending, onUpdated }) {
  const data = pending.fieldData;
  const status = pending.fieldStatus;

  // Check if there are fields that need re-filling (PENDING with empty value)
  const fieldsToRefill = Object.entries(status)
    .filter(([key, s]) => {
      if (s !== 'PENDING') return false;
      const val = data[key];
      if (Array.isArray(val)) return val.length === 0;
      if (typeof val === 'boolean') return val === false;
      return !val || val === '';
    })
    .map(([key]) => key);

  const hasFieldsToRefill = fieldsToRefill.length > 0;
  // Check if ALL pending fields are empty (needs re-fill) vs all filled (waiting for review)
  const allPendingFilled = Object.entries(status)
    .filter(([, s]) => s === 'PENDING')
    .every(([key]) => {
      const val = data[key];
      if (Array.isArray(val)) return val.length > 0;
      if (typeof val === 'boolean') return true;
      return val && val !== '';
    });

  if (hasFieldsToRefill) {
    return <PendingRefillForm pending={pending} fieldsToRefill={fieldsToRefill} onUpdated={onUpdated} />;
  }

  return (
    <div style={{ padding: '2rem' }}>
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
            const fieldSt = status[key] || 'PENDING';
            return (
              <tr key={key}>
                <td style={tdStyle}>{fieldLabel}</td>
                <td style={tdStyle}>{displayValue}</td>
                <td style={{
                  ...tdStyle,
                  color: fieldSt === 'APPROVED' ? 'green' : fieldSt === 'REJECTED' ? 'red' : 'orange',
                }}>
                  {fieldSt === 'PENDING' ? 'Na čekanju' : fieldSt === 'APPROVED' ? 'Odobreno' : 'Odbijeno'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ==================== PENDING REFILL FORM ====================

function PendingRefillForm({ pending, fieldsToRefill, onUpdated }) {
  const [sections, setSections] = useState([]);
  const [teams, setTeams] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

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

    // Initialize form with empty values for fields that need refilling
    const initial = {};
    for (const key of fieldsToRefill) {
      const val = pending.fieldData[key];
      if (Array.isArray(val)) initial[key] = [];
      else if (typeof val === 'boolean') initial[key] = false;
      else initial[key] = '';
    }
    setForm(initial);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
      // Convert homeSectionId to int if present
      const fields = { ...form };
      if (fields.homeSectionId) {
        fields.homeSectionId = parseInt(fields.homeSectionId);
      }

      const res = await fetch('/api/pending/me', {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrors([data.error || 'Greška.']);
        return;
      }
      onUpdated(data);
    } catch (err) {
      setErrors(['Mrežna greška.']);
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (key) => {
    const label = FIELD_LABELS[key] || key;

    if (key === 'gender') {
      return (
        <label key={key}>{label} *<br />
          <select name={key} value={form[key] || ''} onChange={handleChange} required>
            <option value="">-- Odaberite --</option>
            <option value="M">Muški</option>
            <option value="Z">Ženski</option>
          </select>
        </label>
      );
    }
    if (key === 'membershipLevel') {
      return (
        <label key={key}>{label} *<br />
          <select name={key} value={form[key] || ''} onChange={handleChange} required>
            <option value="">-- Odaberite --</option>
            <option value="PRIDRUZENO">Pridruženo</option>
            <option value="PUNOPRAVNO">Punopravno</option>
            <option value="POCASNO">Počasno</option>
            <option value="STARO">Staro</option>
          </select>
        </label>
      );
    }
    if (key === 'dietType') {
      return (
        <label key={key}>{label} *<br />
          <select name={key} value={form[key] || ''} onChange={handleChange} required>
            <option value="">-- Odaberite --</option>
            <option value="MESOJED">Mesojed</option>
            <option value="VEGETARIJANSTVO">Vegetarijanstvo</option>
            <option value="VEGANSTVO">Veganstvo</option>
            <option value="SVEJED">Svejed</option>
          </select>
        </label>
      );
    }
    if (key === 'homeSectionId') {
      return (
        <label key={key}>{label} *<br />
          <select name={key} value={form[key] || ''} onChange={handleChange} required>
            <option value="">-- Odaberite --</option>
            {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
      );
    }
    if (key === 'sectionIds') {
      return (
        <label key={key}>{label}<br />
          <select multiple size={5} value={(form[key] || []).map(String)} onChange={(e) => handleMultiSelect(e, key)}>
            {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
      );
    }
    if (key === 'teamIds') {
      return (
        <label key={key}>{label}<br />
          <select multiple size={3} value={(form[key] || []).map(String)} onChange={(e) => handleMultiSelect(e, key)}>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
      );
    }
    if (key === 'drinkIds') {
      return (
        <label key={key}>{label} *<br />
          <select multiple size={5} value={(form[key] || []).map(String)} onChange={(e) => handleMultiSelect(e, key)} required>
            {drinks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>
      );
    }
    if (key === 'allergyIds') {
      return (
        <label key={key}>{label}<br />
          <select multiple size={5} value={(form[key] || []).map(String)} onChange={(e) => handleMultiSelect(e, key)}>
            {allergies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
      );
    }
    if (key === 'acceptedDocuments') {
      return (
        <label key={key}>
          <input name={key} type="checkbox" checked={form[key] || false} onChange={handleChange} required />
          {' '}Prihvaćam akte i dokumente udruge *
        </label>
      );
    }
    if (key === 'dateOfBirth' || key === 'memberSince' || key === 'fullMemberSince') {
      return (
        <label key={key}>{label} {key !== 'fullMemberSince' ? '*' : ''}<br />
          <input name={key} type="date" value={form[key] || ''} onChange={handleChange} required={key !== 'fullMemberSince'} />
        </label>
      );
    }
    if (key === 'privateEmail') {
      return (
        <label key={key}>{label} *<br />
          <input name={key} type="email" value={form[key] || ''} onChange={handleChange} required />
        </label>
      );
    }
    if (key === 'oib') {
      return (
        <label key={key}>{label} *<br />
          <input name={key} value={form[key] || ''} onChange={handleChange} maxLength={11} pattern="\d{11}" required />
        </label>
      );
    }

    // Default text input
    return (
      <label key={key}>{label} *<br />
        <input name={key} value={form[key] || ''} onChange={handleChange} required />
      </label>
    );
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <h2>Popunite odbijena polja</h2>
      <p>Voditelj sekcije je odbio neka polja. Molimo ispunite ih ponovo.</p>

      {errors.length > 0 && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {errors.map((err, i) => <p key={i}>{err}</p>)}
        </div>
      )}

      <br />
      <h3>Odobrena polja (ne mogu se mijenjati):</h3>
      <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '1rem' }}>
        <tbody>
          {Object.entries(pending.fieldData)
            .filter(([key]) => pending.fieldStatus[key] === 'APPROVED')
            .map(([key, value]) => (
              <tr key={key}>
                <td style={{ ...tdStyle, background: '#f0fff0' }}>{FIELD_LABELS[key] || key}</td>
                <td style={{ ...tdStyle, background: '#f0fff0' }}>
                  {Array.isArray(value) ? value.join(', ') : String(value ?? '')}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      <h3>Polja za popuniti:</h3>
      <form onSubmit={handleSubmit}>
        {fieldsToRefill.map((key) => (
          <div key={key} style={{ marginBottom: '1rem' }}>
            {renderField(key)}
          </div>
        ))}
        <br />
        <button type="submit" disabled={submitting} style={{ padding: '0.5rem 2rem', fontSize: '1rem' }}>
          {submitting ? 'Šaljem...' : 'Pošalji ispravke'}
        </button>
      </form>
    </div>
  );
}

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
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
      const body = { ...form, homeSectionId: parseInt(form.homeSectionId) };

      const res = await fetch('/api/pending', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
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
      <h2>Pristupna forma</h2>
      <p>E-mail pri udruzi: <strong>{email}</strong> (postavlja se automatski)</p>

      {errors.length > 0 && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {errors.map((err, i) => <p key={i}>{err}</p>)}
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
            <><label>Datum postanka punopravnim članom<br />
              <input name="fullMemberSince" type="date" value={form.fullMemberSince} onChange={handleChange} />
            </label><br /><br /></>
          )}

          <label>Matična sekcija *<br />
            <select name="homeSectionId" value={form.homeSectionId} onChange={handleChange} required>
              <option value="">-- Odaberite --</option>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label><br /><br />

          <label>Pridružene sekcije (Ctrl+click za više)<br />
            <select multiple size={5} value={form.sectionIds.map(String)} onChange={(e) => handleMultiSelect(e, 'sectionIds')}>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label><br /><br />

          <label>Timovi (Ctrl+click za više)<br />
            <select multiple size={3} value={form.teamIds.map(String)} onChange={(e) => handleMultiSelect(e, 'teamIds')}>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
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
              {drinks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label><br /><br />

          <label>Alergije (Ctrl+click za više)<br />
            <select multiple size={5} value={form.allergyIds.map(String)} onChange={(e) => handleMultiSelect(e, 'allergyIds')}>
              {allergies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
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

// ==================== APPROVAL DASHBOARD ====================

function ApprovalDashboard() {
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [decisions, setDecisions] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pending/section', { headers: authHeaders() });
      if (res.ok) {
        setPendingList(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectApplication = (pending) => {
    setSelectedId(pending.id);
    setMessage('');
    const initial = {};
    for (const key of Object.keys(pending.fieldData)) {
      if (pending.fieldStatus[key] === 'PENDING') {
        initial[key] = 'APPROVED';
      }
    }
    setDecisions(initial);
  };

  const toggleDecision = (field) => {
    setDecisions((prev) => ({
      ...prev,
      [field]: prev[field] === 'APPROVED' ? 'REJECTED' : 'APPROVED',
    }));
  };

  const submitReview = async () => {
    setMessage('');
    try {
      const res = await fetch(`/api/pending/${selectedId}/review`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisions }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Greška pri slanju.');
        return;
      }

      setMessage(data.message);
      setSelectedId(null);
      setDecisions({});
      loadPending();
    } catch (err) {
      setMessage('Mrežna greška.');
    }
  };

  const selected = pendingList.find((p) => p.id === selectedId);

  if (loading) return <p style={{ padding: '2rem' }}>Učitavanje zahtjeva...</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Zahtjevi za odobrenje</h2>

      {message && <p style={{ color: 'blue', fontWeight: 'bold' }}>{message}</p>}

      {pendingList.length === 0 && !message && <p>Nema zahtjeva na čekanju.</p>}

      {!selected && pendingList.length > 0 && (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={thStyle}>E-mail</th>
              <th style={thStyle}>Ime</th>
              <th style={thStyle}>Prezime</th>
              <th style={thStyle}>Matična sekcija</th>
              <th style={thStyle}>Datum prijave</th>
              <th style={thStyle}>Akcija</th>
            </tr>
          </thead>
          <tbody>
            {pendingList.map((p) => (
              <tr key={p.id}>
                <td style={tdStyle}>{p.googleEmail}</td>
                <td style={tdStyle}>{p.fieldData.firstName || '-'}</td>
                <td style={tdStyle}>{p.fieldData.lastName || '-'}</td>
                <td style={tdStyle}>{p.homeSection?.name}</td>
                <td style={tdStyle}>{new Date(p.createdAt).toLocaleDateString('hr')}</td>
                <td style={tdStyle}>
                  <button onClick={() => selectApplication(p)}>Pregledaj</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected && (
        <div>
          <button onClick={() => { setSelectedId(null); setDecisions({}); }} style={{ marginBottom: '1rem' }}>
            ← Natrag na popis
          </button>

          <h3>Prijava: {selected.googleEmail}</h3>

          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={thStyle}>Polje</th>
                <th style={thStyle}>Vrijednost</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Odluka</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(selected.fieldData).map(([key, value]) => {
                const fieldLabel = FIELD_LABELS[key] || key;
                const displayValue = Array.isArray(value) ? value.join(', ') : String(value ?? '');
                const currentStatus = selected.fieldStatus[key];
                const isPending = currentStatus === 'PENDING';

                return (
                  <tr key={key} style={{ background: !isPending ? '#f9f9f9' : 'white' }}>
                    <td style={tdStyle}>{fieldLabel}</td>
                    <td style={tdStyle}>{displayValue}</td>
                    <td style={{
                      ...tdStyle,
                      color: currentStatus === 'APPROVED' ? 'green' : currentStatus === 'REJECTED' ? 'red' : 'orange',
                    }}>
                      {currentStatus === 'PENDING' ? 'Na čekanju' : 'Odobreno'}
                    </td>
                    <td style={tdStyle}>
                      {isPending ? (
                        <button
                          onClick={() => toggleDecision(key)}
                          style={{
                            padding: '0.3rem 0.8rem',
                            background: decisions[key] === 'APPROVED' ? '#4CAF50' : '#f44336',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {decisions[key] === 'APPROVED' ? '✓ Prihvaćam' : '✗ Odbijam'}
                        </button>
                      ) : (
                        <span style={{ color: '#999' }}>✓ Odobreno ranije</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <br />
          <button
            onClick={submitReview}
            style={{ padding: '0.5rem 2rem', fontSize: '1rem', background: '#2196F3', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Pošalji odluke
          </button>
        </div>
      )}
    </div>
  );
}

// ==================== MAIN APP ====================

function App() {
  const [user, setUser] = useState(null);
  const [pending, setPending] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('profile');

  useEffect(() => {
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
      // Always try to refresh token to get latest member data
      await refreshToken();

      const res = await fetch('/api/auth/me', { headers: authHeaders() });

      if (!res.ok) {
        localStorage.removeItem('token');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setUser(data);

      if (data.isNewUser && data.hasPendingApplication) {
        const pendingRes = await fetch('/api/pending/me', { headers: authHeaders() });
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
    setPage('profile');
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Učitavanje...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  const appRole = user.member?.appRole || user.appRole;
  const isLeaderOrAdmin = appRole === 'VODITELJ_SEKCIJE' || appRole === 'ADMINISTRATOR';

  const content = (() => {
    if (page === 'approval' && isLeaderOrAdmin) {
      return <ApprovalDashboard />;
    }

    if (!user.isNewUser && user.member) {
      return <MemberView member={user.member} />;
    }

    if (user.isNewUser && pending) {
      return (
        <PendingView
          pending={pending}
          onUpdated={(updated) => setPending(updated)}
        />
      );
    }

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
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span>{user.email}</span>
          {isLeaderOrAdmin && (
            <>
              <button onClick={() => setPage('profile')} style={{ fontWeight: page === 'profile' ? 'bold' : 'normal' }}>
                Moj profil
              </button>
              <button onClick={() => setPage('approval')} style={{ fontWeight: page === 'approval' ? 'bold' : 'normal' }}>
                Zahtjevi
              </button>
            </>
          )}
        </div>
        <button onClick={handleLogout} style={{ padding: '0.3rem 1rem' }}>Odjava</button>
      </div>
      {content}
    </div>
  );
}

const thStyle = { border: '1px solid #ccc', padding: '0.5rem', textAlign: 'left', background: '#f5f5f5' };
const tdStyle = { border: '1px solid #ccc', padding: '0.5rem' };

export default App;
