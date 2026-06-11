import { useState, useEffect } from 'react';
import { getGames } from '../API.js';

const PAGE_SIZE = 25;

export default function HistoryPage() {
  const [games, setGames] = useState(null);
  const [totalGames, setTotalGames] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    getGames(page, PAGE_SIZE)
      .then(res => {
        if (!cancelled) {
          setGames(res.games);
          setTotalGames(res.total);
          setTotalPages(res.totalPages);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page]);

  if (error) {
    return (
      <div className="container py-4" id="history-error-container">
        <div className="alert alert-danger shadow-sm">{error}</div>
      </div>
    );
  }

  if (loading && !games) {
    return (
      <div className="container py-5 text-center text-muted" id="history-loading-container">
        <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
          <span className="visually-hidden">Caricamento in corso...</span>
        </div>
        Caricamento storico partite…
      </div>
    );
  }

  const formatStatus = (valid) => {
    switch (valid) {
      case 1:
        return <span className="badge bg-success-subtle text-success border border-success-subtle py-1.5 px-3 rounded-pill fw-medium">Valida</span>;
      case 0:
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle py-1.5 px-3 rounded-pill fw-medium">Non Valida</span>;
      case -1:
        return <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle py-1.5 px-3 rounded-pill fw-medium">Incompleta</span>;
      default:
        return <span className="badge bg-dark py-1.5 px-3 rounded-pill">Sconosciuto</span>;
    }
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: 900 }} id="history-page-container">
      <div className="d-flex align-items-center gap-3 mb-4">
        <div className="page-header-icon" style={{ width: 45, height: 45 }}>
          <i className="bi bi-clock-history fs-5"></i>
        </div>
        <div>
          <h4 className="mb-0 fw-bold text-dark">Le Mie Partite</h4>
          <p className="text-muted small mb-0">Riepilogo e storico dei tuoi viaggi in metropolitana</p>
        </div>
      </div>

      {games && games.length === 0 ? (
        <div className="surface-card p-5 text-center" id="no-history-card">
          <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle mb-3" style={{ width: 60, height: 60 }}>
            <i className="bi bi-controller text-muted fs-3"></i>
          </div>
          <h5 className="fw-bold text-dark mb-2">Ancora nessun viaggio registrato</h5>
          <p className="text-muted small mx-auto mb-3" style={{ maxWidth: 350 }}>
            Inizia a giocare per testare le tue abilità e visualizzare qui il resoconto dettagliato di ogni tua partita.
          </p>
        </div>
      ) : (
        <div className="surface-card overflow-hidden" id="history-table-card" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s ease' }}>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 table-app">
              <thead>
                <tr>
                  <th className="px-4 py-3" style={{ width: 65 }}>Corsa</th>
                  <th className="py-3">Data e Ora</th>
                  <th className="py-3">Partenza</th>
                  <th className="py-3">Destinazione</th>
                  <th className="py-3 text-center">Esito</th>
                  <th className="px-4 py-3 text-end">Monete</th>
                </tr>
              </thead>
              <tbody>
                {games && games.map((game, i) => {
                  const matchNumber = totalGames - (page - 1) * PAGE_SIZE - i;
                  return (
                    <tr key={game.id} style={{ transition: 'background-color 0.15s ease' }}>
                      <td className="px-4 py-3 fw-bold text-muted" style={{ fontSize: '14px' }}>
                        #{matchNumber}
                      </td>
                      <td className="py-3 text-secondary" style={{ fontSize: '14px' }}>
                        {formatDate(game.played_at)}
                      </td>
                      <td className="py-3 fw-semibold text-dark-emphasis" style={{ fontSize: '14.5px' }}>
                        {game.start_station_name}
                      </td>
                      <td className="py-3 fw-semibold text-dark-emphasis" style={{ fontSize: '14.5px' }}>
                        {game.end_station_name}
                      </td>
                      <td className="py-3 text-center">
                        {formatStatus(game.valid)}
                      </td>
                      <td className="px-4 py-3 text-end fw-bold text-primary fs-6">
                        {game.score} <i className="bi bi-coin ms-1" aria-label="monete" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="card-footer bg-light bg-gradient border-top py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <small className="text-muted">
                Mostrate <strong>{games ? games.length : 0}</strong> di <strong>{totalGames}</strong> partite (Pagina <strong>{page}</strong> di <strong>{totalPages}</strong>)
              </small>
              <nav aria-label="Navigazione pagine">
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${page === 1 || loading ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}>
                      Precedente
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <li key={pageNum} className={`page-item ${page === pageNum ? 'active' : ''} ${loading ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => setPage(pageNum)} disabled={loading}>
                          {pageNum}
                        </button>
                      </li>
                    );
                  })}
                  <li className={`page-item ${page === totalPages || loading ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading}>
                      Successiva
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
