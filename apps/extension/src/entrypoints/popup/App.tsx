import { useEffect, useState } from 'react';
import { getTokens } from '../../shared/storage';
import { LoginView } from './LoginView';
import { MainView } from './MainView';

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    getTokens().then((tokens) => setAuthenticated(tokens !== null));
  }, []);

  if (authenticated === null) return null;

  if (!authenticated) {
    return <LoginView onLogin={() => setAuthenticated(true)} />;
  }

  return <MainView onLogout={() => setAuthenticated(false)} />;
}
