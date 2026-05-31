import { useState, useEffect } from 'react';
import { getRanking } from '../API.js';

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
      <div className="container py-4">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  if (!ranking) {
    return <div className="container py-5 text-center text-muted">Caricamento classifica…</div>;
  }

  return (
    <div className="container py-4" style={{ maxWidth: 600 }}>
      <h4 className="mb-3">Classifica — miglior punteggio per giocatore</h4>

      {ranking.length === 0 ? (
        <p className="text-muted">Nessuna partita giocata ancora.</p>
      ) : (
        <table className="table table-striped align-middle">
          <thead>
            <tr>
              <th style={{ width: 48 }}>#</th>
              <th>Giocatore</th>
              <th className="text-end">Miglior punteggio</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((entry, i) => (
              <tr key={entry.user_id}>
                <td className="fw-bold">{i + 1}</td>
                <td>{entry.name}</td>
                <td className="text-end fw-bold">{entry.best_score} 🪙</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
