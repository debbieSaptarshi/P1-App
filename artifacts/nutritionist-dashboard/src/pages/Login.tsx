import { FormEvent, useState } from 'react';
import { supabase } from '../api';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const { error: nextError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (nextError) setError(nextError.message);
  };

  return (
    <form className="login card" onSubmit={(event) => void onSubmit(event)}>
      <h1>Nutritionist sign in</h1>
      <p className="muted">Review household meals, photos, and notes. This is not in the client app.</p>
      {error ? <p className="danger">{error}</p> : null}
      <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></label>
      <label>Password<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required /></label>
      <button disabled={busy} type="submit">{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}
