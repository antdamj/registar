import {
  FIELD_LABELS,
  GENDER_OPTIONS,
  MEMBERSHIP_LEVEL_OPTIONS,
  DIET_TYPE_OPTIONS,
} from '../constants';

export default function FieldRenderer({ fieldKey, form, onChange, onMultiSelect, lookups }) {
  const key = fieldKey;
  const label = FIELD_LABELS[key] || key;
  const { sections = [], teams = [], drinks = [], allergies = [] } = lookups || {};

  const renderSelect = (options, req) => (
    <label>{label}{req ? ' *' : ''}<br />
      <select name={key} value={form[key] || ''} onChange={onChange} required={req}>
        <option value="">-- Odaberite --</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );

  const renderMultiSelect = (items, size, req) => (
    <label>{label}{req ? ' *' : ''}<br />
      <select
        multiple
        size={size}
        value={(form[key] || []).map(String)}
        onChange={(e) => onMultiSelect(e, key)}
        required={req}
      >
        {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
      </select>
    </label>
  );

  if (key === 'gender') return renderSelect(GENDER_OPTIONS, true);
  if (key === 'membershipLevel') return renderSelect(MEMBERSHIP_LEVEL_OPTIONS, true);
  if (key === 'dietType') return renderSelect(DIET_TYPE_OPTIONS, true);

  if (key === 'homeSectionId') {
    return (
      <label>{label} *<br />
        <select name={key} value={form[key] || ''} onChange={onChange} required>
          <option value="">-- Odaberite --</option>
          {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
    );
  }
  if (key === 'sectionIds') return renderMultiSelect(sections, 5, false);
  if (key === 'teamIds') return renderMultiSelect(teams, 3, false);
  if (key === 'drinkIds') return renderMultiSelect(drinks, 5, true);
  if (key === 'allergyIds') return renderMultiSelect(allergies, 5, false);

  if (key === 'acceptedDocuments') {
    return (
      <label>
        <input name={key} type="checkbox" checked={form[key] || false} onChange={onChange} required />
        {' '}Prihvaćam akte i dokumente udruge *
      </label>
    );
  }

  if (key === 'dateOfBirth' || key === 'memberSince' || key === 'fullMemberSince') {
    const req = key !== 'fullMemberSince';
    return (
      <label>{label} {req ? '*' : ''}<br />
        <input name={key} type="date" value={form[key] || ''} onChange={onChange} required={req} />
      </label>
    );
  }

  if (key === 'privateEmail') {
    return (
      <label>{label} *<br />
        <input name={key} type="email" value={form[key] || ''} onChange={onChange} required />
      </label>
    );
  }

  if (key === 'oib') {
    return (
      <label>{label} *<br />
        <input name={key} value={form[key] || ''} onChange={onChange} maxLength={11} pattern="\d{11}" required />
      </label>
    );
  }

  return (
    <label>{label} *<br />
      <input name={key} value={form[key] || ''} onChange={onChange} required />
    </label>
  );
}
