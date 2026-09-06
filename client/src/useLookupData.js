import { useState, useEffect } from 'react';
import { authHeaders } from './api/auth';

// Fetches lookup data (sections, teams, drinks, allergies) used by the forms.
export function useLookupData() {
  const [sections, setSections] = useState([]);
  const [teams, setTeams] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [allergies, setAllergies] = useState([]);

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

  return { sections, teams, drinks, allergies };
}
