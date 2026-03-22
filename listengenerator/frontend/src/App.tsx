import { useState } from 'react';
import { hasToken, clearToken } from './api';
import Login from './components/Login';
import ListOverview from './components/ListOverview';
import Editor from './components/Editor';
type View = 'login' | 'overview' | 'editor';
export default function App() {
  const [view, setView] = useState<View>(hasToken() ? 'overview' : 'login');
  const [listName, setListName] = useState<string | null>(null);
  function handleLogin() {
    setView('overview');
  }
  function handleSelect(name: string) {
    setListName(name);
    setView('editor');
  }
  function handleBack() {
    setView('overview');
    setListName(null);
  }
  function handleLogout() {
    clearToken();
    setView('login');
    setListName(null);
  }
  if (view === 'login') return <Login onLogin={handleLogin} />;
  if (view === 'overview') return <ListOverview onSelect={handleSelect} onLogout={handleLogout} />;
  return <Editor listName={listName!} onBack={handleBack} onLogout={handleLogout} />;
}
