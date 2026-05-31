import { useEffect, useState } from 'react';
import { getEvents } from '../API.js';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getEvents()
      .then(data => {
        // Ordina gli eventi in base all'effetto decrescente (dai bonus più ricchi ai malus più pesanti)
        const sorted = [...data].sort((a, b) => b.effect - a.effect);
        setEvents(sorted);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message ?? 'Impossibile caricare gli eventi.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Caricamento eventi...</span>
        </div>
        <p className="mt-2 text-muted">Caricamento degli eventi del server...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-octagon-fill me-2"></i> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5" id="events-page-container">
      <div className="d-flex align-items-center gap-3 mb-4">
        <div className="bg-primary bg-gradient text-white rounded-3 p-3 d-flex align-items-center justify-content-center" style={{ width: 56, height: 56 }}>
          <i className="bi bi-coin fs-3"></i>
        </div>
        <div>
          <h1 className="fw-bold mb-1">Tabella Bonus & Malus</h1>
          <p className="text-muted mb-0">Tutti gli eventi imprevisti che possono verificarsi lungo i segmenti del tuo percorso.</p>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Info card */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
            <h4 className="fw-bold mb-3">Gli Imprevisti di Viaggio</h4>
            <p className="text-muted small">
              Durante la fase di <strong>Execution</strong>, per ciascun segmento che compone il tuo percorso valido, il server estrae in modo del tutto casuale uno degli eventi sottostanti.
            </p>
            <p className="text-muted small">
              L'effetto dell'evento viene applicato istantaneamente sul tuo budget corrente, che inizia sempre con un valore base di <strong>20 monete</strong>.
            </p>
            <div className="alert alert-info border-info-subtle p-3 rounded-3 mb-0 small" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
              <i className="bi bi-info-circle-fill me-2"></i>
              Il punteggio finale non può mai scendere sotto lo zero. Eventuali punteggi negativi verranno registrati e visualizzati come <strong>0 monete</strong>.
            </div>
          </div>
        </div>

        {/* List of events */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="ps-4 py-3" style={{ width: '25%' }}>Impatto</th>
                    <th scope="col" className="py-3" style={{ width: '55%' }}>Descrizione dell'Evento</th>
                    <th scope="col" className="pe-4 py-3 text-end" style={{ width: '20%' }}>Variazione</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(e => {
                    let badgeClass = 'bg-secondary-subtle text-secondary';
                    let icon = 'bi-dash-lg';
                    let effectText = '0';
                    let effectColor = 'text-secondary';

                    if (e.effect > 0) {
                      badgeClass = 'bg-success-subtle text-success';
                      icon = 'bi-arrow-up-circle-fill';
                      effectText = `+${e.effect}`;
                      effectColor = 'text-success fw-bold';
                    } else if (e.effect < 0) {
                      badgeClass = 'bg-danger-subtle text-danger';
                      icon = 'bi-arrow-down-circle-fill';
                      effectText = `${e.effect}`;
                      effectColor = 'text-danger fw-bold';
                    }

                    return (
                      <tr key={e.id}>
                        <td className="ps-4 py-3">
                          <span className={`badge ${badgeClass} px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1`}>
                            <i className={`bi ${icon}`}></i>
                            {e.effect > 0 ? 'Bonus' : e.effect < 0 ? 'Malus' : 'Neutro'}
                          </span>
                        </td>
                        <td className="py-3 text-dark fw-semibold">
                          {e.description}
                        </td>
                        <td className={`pe-4 py-3 text-end ${effectColor} fs-5`}>
                          {effectText} <i className="bi bi-coin small"></i>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
