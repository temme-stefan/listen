import { useState } from 'react';
import { login } from '../api';
interface Props {
  onLogin: () => void;
}
export default function Login({ onLogin }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(password);
      onLogin();
    } catch {
      setError('Falsches Passwort');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="login-wrapper">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>🎁 Listengenerator</h1>
        <label>
          Passwort
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Anmelden…' : 'Anmelden'}
        </button>
      </form>
    </div>
  );
}
