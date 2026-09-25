import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { api } from '../api';

type Snapshot = {
  profile?: { display_name: string; invite_code: string };
  households: { id: string; name: string; inviteCode?: string; members: { displayName: string }[] }[];
};

export function Clients() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const load = () => api<Snapshot>('/nutritionist/me').then(setData).catch((caught: Error) => setError(caught.message));

  useEffect(() => { void load(); }, []);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await api('/nutritionist/me', { method: 'PUT', body: { displayName: name || 'Nutritionist' } });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save profile');
    }
  };

  return (
    <div>
      <h1>Clients</h1>
      {error ? <p className="danger">{error}</p> : null}
      <form className="card" onSubmit={(event) => void saveProfile(event)}>
        <h2>Your profile</h2>
        <p className="muted">Clients enter this invite code during onboarding.</p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        <div className="row">
          <button type="submit">Save profile</button>
          {data?.profile ? <span>Code <strong>{data.profile.invite_code}</strong></span> : null}
        </div>
      </form>
      {data?.households.map((household) => (
        <Link key={household.id} href={`/households/${household.id}`}>
          <article className="card">
            <strong>{household.name}</strong>
            <p className="muted">{household.members.map((m) => m.displayName).join(', ')}</p>
            {household.inviteCode ? <p>Household invite {household.inviteCode}</p> : null}
          </article>
        </Link>
      ))}
    </div>
  );
}
