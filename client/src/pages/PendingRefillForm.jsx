import { useState, useEffect } from 'react';
import { jsonHeaders } from '../api/auth';
import { useLookupData } from '../useLookupData';
import { FIELD_LABELS } from '../constants';
import { tdStyle } from '../styles';
import FieldRenderer from '../components/FieldRenderer';

export default function PendingRefillForm({ pending, fieldsToRefill, onUpdated }) {
  const lookups = useLookupData();
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
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
        headers: jsonHeaders(),
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
                <td style={tdStyle}>{FIELD_LABELS[key] || key}</td>
                <td style={tdStyle}>
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
            <FieldRenderer
              fieldKey={key}
              form={form}
              onChange={handleChange}
              onMultiSelect={handleMultiSelect}
              lookups={lookups}
            />
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
