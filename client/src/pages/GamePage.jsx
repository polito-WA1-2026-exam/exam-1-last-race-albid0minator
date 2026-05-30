import { useState } from 'react';
import NetworkMap from '../components/NetworkMap.jsx';
import MOCK_NETWORK from '../mock_network.json';

const PHASES = ['setup', 'planning', 'execution', 'result'];

export default function GamePage() {
  const [phase, setPhase] = useState('setup');
  const [selectedSegments, setSelectedSegments] = useState([]);

  const startStationId = MOCK_NETWORK.startStationId;
  const endStationId = MOCK_NETWORK.endStationId;

  function handleSegmentClick(seg) {
    setSelectedSegments(prev => {
      const exists = prev.some(s => s.from === seg.from && s.to === seg.to);
      if (exists) return prev.filter(s => !(s.from === seg.from && s.to === seg.to));
      return [...prev, seg];
    });
  }

  return (
    <div className="container py-4">

      {/* Indicatore fase — solo per sviluppo */}
      <div className="d-flex gap-2 mb-3">
        {PHASES.map(p => (
          <button
            key={p}
            className={`btn btn-sm ${phase === p ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => { setPhase(p); setSelectedSegments([]); }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* ── SETUP ─────────────────────────────────────── */}
      {phase === 'setup' && (
        <div>
          <h4 className="mb-1">Fase 1 — Setup</h4>
          <p className="text-muted mb-3">
            Studia la mappa. Tutte le linee sono visibili.
          </p>
          <NetworkMap
            stations={MOCK_NETWORK.stations}
            stationLines={MOCK_NETWORK.stationLines}
            segments={MOCK_NETWORK.segments}
            lines={MOCK_NETWORK.lines}
            showLines={true}
            startStationId={startStationId}
            endStationId={endStationId}
          />
          <div className="mt-3 d-flex gap-3 align-items-center">
            <div className="d-flex gap-2 flex-wrap">
              {MOCK_NETWORK.lines.map(l => (
                <span key={l.id} className="badge" style={{ background: l.color, fontSize: 13 }}>
                  {l.name}
                </span>
              ))}
              <span className="badge bg-success">Partenza</span>
              <span className="badge bg-danger">Arrivo</span>
            </div>
            <button className="btn btn-primary ms-auto" onClick={() => setPhase('planning')}>
              Sono pronto →
            </button>
          </div>
        </div>
      )}

      {/* ── PLANNING ──────────────────────────────────── */}


      {phase === 'planning' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-1">
            <h4 className="mb-0">Fase 2 — Planning</h4>
            <span className="badge bg-warning text-dark fs-6">⏱ 90s</span>
          </div>
          <p className="text-muted mb-1">
            Le linee sono nascoste. Seleziona i segmenti per costruire il percorso.
          </p>
          <p className="mb-3">
            <strong className="text-success">Partenza:</strong>{' '}
            {MOCK_NETWORK.stations.find(s => s.id === startStationId)?.name}
            {' → '}
            <strong className="text-danger">Arrivo:</strong>{' '}
            {MOCK_NETWORK.stations.find(s => s.id === endStationId)?.name}
          </p>
          <NetworkMap
            stations={MOCK_NETWORK.stations}
            stationLines={MOCK_NETWORK.stationLines}
            segments={MOCK_NETWORK.segments}
            lines={MOCK_NETWORK.lines}
            showLines={false}
            showInterchanges={false}
            selectedSegments={selectedSegments}
            startStationId={startStationId}
            endStationId={endStationId}
            onSegmentClick={handleSegmentClick}
          />
          <div className="mt-3 d-flex gap-2 align-items-center flex-wrap">
            <span className="text-muted">
              Segmenti selezionati: <strong>{selectedSegments.length}</strong>
            </span>
            {selectedSegments.length > 0 && (
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedSegments([])}>
                Azzera
              </button>
            )}
            <button
              className="btn btn-primary ms-auto"
              onClick={() => setPhase('execution')}
            >
              Conferma percorso →
            </button>
          </div>
        </div>
      )}

      {/* ── EXECUTION ─────────────────────────────────── */}



      {phase === 'execution' && (
        <div>
          <h4 className="mb-1">Fase 3 — Execution</h4>
          <p className="text-muted mb-3">
            Il percorso viene eseguito passo per passo.
            <em> (placeholder — da implementare con dati reali)</em>
          </p>
          <div className="card">
            <div className="card-body">
              <p>Passo 1: Porta Nord → Centrale — Evento: Viaggio tranquillo (+0) — Monete: 20</p>
              <p>Passo 2: Centrale → Repubblica — Evento: Segnale guasto (−2) — Monete: 18</p>
              <p>Passo 3: Repubblica → Duomo — Evento: Corsa rapida (+1) — Monete: 19</p>
              <p>Passo 4: Duomo → Porta Sud — Evento: Manutenzione (−1) — Monete: 18</p>
            </div>
          </div>
          <button className="btn btn-primary mt-3" onClick={() => setPhase('result')}>
            Vedi risultato →
          </button>
        </div>
      )}

      {/* ── RESULT ────────────────────────────────────── */}



      
      {phase === 'result' && (
        <div className="text-center py-5">
          <h2>Partita terminata</h2>
          <p className="fs-1 fw-bold">18 🪙</p>
          <p className="text-muted">
            {MOCK_NETWORK.stations.find(s => s.id === startStationId)?.name}
            {' → '}
            {MOCK_NETWORK.stations.find(s => s.id === endStationId)?.name}
          </p>
          <p className="text-muted small">
            Percorso A: NordOvest→…→NordEst★→CentroEst→SudEst (cambio R→A in NordEst)<br/>
            Percorso B: NordOvest→CentroOvest★→SudOvest★→SudEst (cambi G→G→B)
          </p>
          <button className="btn btn-success btn-lg mt-2" onClick={() => { setPhase('setup'); setSelectedSegments([]); }}>
            Nuova partita
          </button>
        </div>
      )}

    </div>
  );
}
