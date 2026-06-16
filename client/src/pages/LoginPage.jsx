import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { login } from '../API.js';

export default function LoginPage({ onLogin, user }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  if (user) return <Navigate to="/game" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await login({ email, password });
      onLogin(data.user);
    } catch (err) {
      setError(err.message ?? 'Credenziali non valide.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center p-3" style={{ minHeight: 'calc(100vh - 75px)' }} id="login-page-container">
      <div className="surface-card p-4 p-md-5 w-100" style={{ maxWidth: 480 }}>
        <div className="text-center mb-4">
          <i className="bi bi-train-front text-warning" style={{ fontSize: '3rem' }}></i>
          <h3 className="fw-bold mt-2 mb-1" style={{ letterSpacing: '-0.5px' }}>Accedi a Last Race</h3>
          <p className="text-muted small">Inserisci le tue credenziali per iniziare il viaggio</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold text-secondary" style={{ fontSize: '14px' }}>Email</label>
            <input
              type="email"
              className="form-control form-control-lg"
              style={{ fontSize: '15px' }}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="Inserisci la tua email"
            />
          </div>
          
          <div className="mb-4">
            <label className="form-label fw-semibold text-secondary" style={{ fontSize: '14px' }}>Password</label>
            <div className="input-group input-group-merge">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control form-control-lg border-end-0"
                style={{ fontSize: '15px' }}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                id="input-password"
                placeholder="Inserisci la password"
              />
              <button
                className="btn btn-lg border-start-0"
                type="button"
                onMouseDown={() => setShowPassword(true)}
                onMouseUp={() => setShowPassword(false)}
                onMouseLeave={() => setShowPassword(false)}
                onTouchStart={() => setShowPassword(true)}
                onTouchEnd={() => setShowPassword(false)}
                title="Mostra password"
                style={{ cursor: 'pointer' }}
                id="btn-toggle-password"
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
              </button>
            </div>
          </div>
          
          {error && (
            <div className="alert alert-danger py-2 px-3 small border-0 rounded-3 mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-octagon-fill fs-6"></i>
              <span>{error}</span>
            </div>
          )}
          
          <button className="btn login-submit-button btn-lg w-100 py-2.5 fw-semibold fs-6 shadow-sm" type="submit" disabled={loading}>
            {loading ? (
              <span className="d-flex align-items-center justify-content-center gap-2">
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Accesso in corso...</span>
              </span>
            ) : (
              'Accedi'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
