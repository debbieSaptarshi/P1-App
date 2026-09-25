import { FormEvent, useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { api } from '../api';

type Event = {
  id: string;
  subjectName?: string;
  loggedByName?: string;
  caption?: string;
  context?: string;
  capturedAt: string;
  mediaPath?: string;
  reviewStatus: string;
  signals?: { extraOilTsp?: number };
};
type Note = { id: string; body: string; created_at: string };

export function HouseholdDay() {
  const [, params] = useRoute('/households/:id');
  const id = params?.id ?? '';
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [events, setEvents] = useState<Event[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [note, setNote] = useState('');
  const [invite, setInvite] = useState('');
  const [error, setError] = useState('');

  const load = async (day = date) => {
    const result = await api<{ events: Event[]; notes: Note[] }>(`/nutritionist/households/${id}/days/${day}`);
    setEvents(result.events ?? []);
    setNotes(result.notes ?? []);
  };

  useEffect(() => {
    if (!id) return;
    void load().catch((caught: Error) => setError(caught.message));
  }, [id, date]);

  const addNote = async (event: FormEvent) => {
    event.preventDefault();
    if (!note.trim()) return;
    await api(`/nutritionist/households/${id}/notes`, { method: 'POST', body: { body: note.trim(), localDate: date } });
    setNote('');
    await load();
  };

  const rotateInvite = async () => {
    const result = await api<{ inviteCode: string }>(`/nutritionist/households/${id}/invite`, { method: 'POST' });
    setInvite(result.inviteCode);
  };

  return (
    <div>
      <h1>Household day</h1>
      {error ? <p className="danger">{error}</p> : null}
      <div className="row" style={{ marginBottom: 16 }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 180 }} />
        <button className="secondary" onClick={() => void rotateInvite()}>New household invite</button>
        {invite ? <span>Code {invite}</span> : null}
      </div>
      {events.length === 0 ? <p className="muted">No meals this day.</p> : null}
      {events.map((meal) => (
        <article className="card meal" key={meal.id}>
          {meal.mediaPath?.startsWith('http') ? <img src={meal.mediaPath} alt="" /> : <div />}
          <div>
            <strong>{meal.subjectName ?? 'Unknown'}</strong>
            <p className="muted">Logged by {meal.loggedByName ?? 'someone'} · {new Date(meal.capturedAt).toLocaleTimeString()}</p>
            <p>{meal.caption || 'Photo logged'}</p>
            {meal.context ? <p className="muted">{meal.context}</p> : null}
            {typeof meal.signals?.extraOilTsp === 'number' ? <p className="muted">Extra oil: {meal.signals.extraOilTsp} tsp</p> : null}
          </div>
        </article>
      ))}
      <form className="card" onSubmit={(event) => void addNote(event)}>
        <h2>Notes</h2>
        {notes.map((item) => <p key={item.id}>{item.body}</p>)}
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Pattern, portion, or follow-up" />
        <button type="submit">Save note</button>
      </form>
    </div>
  );
}
