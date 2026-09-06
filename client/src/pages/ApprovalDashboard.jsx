import { useState, useEffect } from 'react';
import { authHeaders, jsonHeaders } from '../api/auth';
import { FIELD_LABELS } from '../constants';
import { thStyle, tdStyle } from '../styles';

export default function ApprovalDashboard() {
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
        headers: jsonHeaders(),
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

      {message && <p>{message}</p>}

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
            Natrag na popis
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
                  <tr key={key}>
                    <td style={tdStyle}>{fieldLabel}</td>
                    <td style={tdStyle}>{displayValue}</td>
                    <td style={tdStyle}>
                      {currentStatus === 'PENDING' ? 'Na čekanju' : 'Odobreno'}
                    </td>
                    <td style={tdStyle}>
                      {isPending ? (
                        <button onClick={() => toggleDecision(key)}>
                          {decisions[key] === 'APPROVED' ? 'Prihvaćam' : 'Odbijam'}
                        </button>
                      ) : (
                        <span>Odobreno ranije</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <br />
          <button onClick={submitReview}>
            Pošalji odluke
          </button>
        </div>
      )}
    </div>
  );
}
