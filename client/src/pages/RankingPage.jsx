import { useState, useEffect } from 'react';
import { getRanking } from '../API.js';

const MEDALS = ['🥇', '🥈', '🥉'];

function rankDisplay(index) {
  if (index < 3) {
    return (
      <span className={`rank-medal rank-medal--${index + 1}`} aria-hidden="true">
        {MEDALS[index]}
      </span>
    );
  }
  return <span className="fw-bold text-muted">{index + 1}</span>;
}

export default function RankingPage() {
  const [ranking, setRanking] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getRanking()
      .then(setRanking)
      .catch(err => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="container py-4 page-container">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  if (!ranking) {
    return (
      <div className="container py-5 text-center text-muted page-container">
        <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
        Caricamento classifica…
      </div>
    );
  }

  return (
    <div className="container py-4 page-container" style={{ maxWidth: 720 }}>
      <div className="d-flex align-items-center gap-3 mb-4">
        <div className="page-header-icon">
          <i className="bi bi-trophy-fill fs-5" />
        </div>
        <div>
          <h4 className="mb-0 fw-bold">Classifica generale</h4>
          <p className="text-muted small mb-0">Miglior punteggio raggiunto da ogni giocatore</p>
        </div>
      </div>

      {ranking.length === 0 ? (
        <div className="surface-card p-5 text-center">
          <p className="text-muted mb-0">Nessuna partita giocata ancora.</p>
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 table-app">
              <thead>
                <tr>
                  <th className="ps-4 py-3" style={{ width: 56 }}>#</th>
                  <th className="py-3">Giocatore</th>
                  <th className="py-3 text-end">Partite valide</th>
                  <th className="pe-4 py-3 text-end">Miglior punteggio</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((entry, i) => (
                  <tr key={entry.user_id}>
                    <td className="ps-4 py-3">{rankDisplay(i)}</td>
                    <td className="py-3 fw-semibold">{entry.name}</td>
                    <td className="py-3 text-end text-muted">{entry.games_played}</td>
                    <td className="pe-4 py-3 text-end fw-bold text-primary fs-6">
                      {entry.best_score} 🪙
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}