import { useEffect, useState } from 'react';
import { Link, Route, Switch, useLocation } from 'wouter';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './api';
import { Login } from './pages/Login';
import { Triage } from './pages/Triage';
import { Clients } from './pages/Clients';
import { HouseholdDay } from './pages/HouseholdDay';

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [location] = useLocation();

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!session) return <Login />;

  return (
    <div className="app">
      <header className="top">
        <div>
          <strong>Nutritionist dashboard</strong>
          <div className="muted">{session.user.email}</div>
        </div>
        <nav className="nav">
          <Link href="/" className={location === '/' ? 'active' : ''}>Triage</Link>
          <Link href="/clients" className={location === '/clients' ? 'active' : ''}>Clients</Link>
        </nav>
        <button className="secondary" onClick={() => void supabase.auth.signOut()}>Sign out</button>
      </header>
      <Switch>
        <Route path="/" component={Triage} />
        <Route path="/clients" component={Clients} />
        <Route path="/households/:id" component={HouseholdDay} />
      </Switch>
    </div>
  );
}
