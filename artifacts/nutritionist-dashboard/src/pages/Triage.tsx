import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { api } from '../api';

type Household = {
  id: string;
  name: string;
  mealsToday: number;
  needsSubject: number;
  members: { id: string; displayName: string }[];
};

export function Triage() {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    void api<{ households: Household[] }>('/nutritionist/households')
      .then((result) => setHouseholds(result.households ?? []))
      .catch((caught: Error) => setError(caught.message));
  }, []);

  const missing = households.filter((h) => h.mealsToday === 0);
  const pending = households.filter((h) => h.needsSubject > 0);

  return (
    <div>
      <h1>Triage</h1>
      {error ? <p className="danger">{error}. Create a nutritionist profile from Clients if you have not yet.</p> : null}
      <section>
        <h2>No meal today</h2>
        <div className="grid">
          {missing.length ? missing.map((h) => <HouseholdCard key={h.id} household={h} />) : <p className="muted">Every assigned household logged today.</p>}
        </div>
      </section>
      <section>
        <h2>Needs “who ate this?”</h2>
        <div className="grid">
          {pending.length ? pending.map((h) => <HouseholdCard key={h.id} household={h} />) : <p className="muted">No unassigned photos.</p>}
        </div>
      </section>
    </div>
  );
}

function HouseholdCard({ household }: { household: Household }) {
  return (
    <Link href={`/households/${household.id}`}>
      <article className="card">
        <strong>{household.name}</strong>
        <p className="muted">{household.members.map((m) => m.displayName).join(', ') || 'No members yet'}</p>
        <p>{household.mealsToday} meals today · {household.needsSubject} waiting</p>
      </article>
    </Link>
  );
}
