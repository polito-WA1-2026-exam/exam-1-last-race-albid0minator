import { useState, useEffect, useMemo, useRef } from 'react';
import NetworkMap from '../components/NetworkMap.jsx';
import PlanningTimer from '../components/PlanningTimer.jsx';
import GameAudio from '../components/GameAudio.jsx';
import SegmentList from '../components/SegmentList.jsx';
import { getNetwork, createGame, submitGame } from '../API.js';

const PLANNING_SECONDS = 90;

function resultMessage(score, valid) {
  if (!valid) return { text: 'Il percorso era sbagliato — hai perso tutto.', cls: 'text-danger' };
  if (score > 15) return { text: 'Ottimo percorso! 🏆', cls: 'text-success fw-bold' };
  if (score >= 8)  return { text: 'Buon risultato!', cls: 'text-primary' };
  if (score >= 1)  return { text: 'Potevi fare meglio...', cls: 'text-warning' };
  return { text: 'Purtroppo hai terminato le monete.', cls: 'text-danger' };
}

export default function GamePage() {
  const [phase, setPhase] = useState('loading');
  const [error, setError] = useState(null);

  const [network, setNetwork] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [startStationId, setStartStationId] = useState(null);
  const [endStationId, setEndStationId] = useState(null);

  const [selectedSegments, setSelectedSegments] = useState([]);
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [timeLeft, setTimeLeft] = useState(PLANNING_SECONDS);
  const [result, setResult] = useState(null);
  const [visibleSteps, setVisibleSteps] = useState(0);

  // ── PATTERN "LATEST REF" ──────────────────────────────────────────────
  const selectedSegmentsRef = useRef([]);
  const handleSubmitRef = useRef(null);

  useEffect(() => {
    selectedSegmentsRef.current = selectedSegments;
    handleSubmitRef.current = handleSubmit;
  });

  // ── INIZIALIZZAZIONE ──────────────────────────────────────────────────
  // La partita viene creata in Setup così partenza/arrivo sono visibili sulla mappa.
  // beginPlanning() riusa lo stesso gameId senza crearne uno nuovo.
  async function loadGameData() {
    try {
      const [net, game] = await Promise.all([getNetwork(), createGame()]);
      setNetwork(net);
      setGameId(game.gameId);
      setStartStationId(game.startStationId);
      setEndStationId(game.endStationId);
      setPhase('setup');
    } catch (err) {
      setError(err.message);
      setPhase('error');
    }
  }

  function beginPlanning() {
    setSelectedSegments([]);
    setHoveredSegment(null);
    setTimeLeft(PLANNING_SECONDS);
    setPhase('planning');
  }

  function initGame() {
    setPhase('loading');
    setError(null);
    setGameId(null);
    setStartStationId(null);
    setEndStationId(null);
    setSelectedSegments([]);
    setHoveredSegment(null);
    setResult(null);
    setVisibleSteps(0);
    void loadGameData();
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadGameData();
  }, []);

  // ── TIMER PLANNING ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'planning') return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  // ── AUTOMATIC EXECUTION PLAYBACK ──────────────────────────────────────
  useEffect(() => {
    if (phase !== 'execution' || !result) return;

    if (!result.valid) {
      // Se invalido, aspetta 2 secondi e passa alla schermata finale
      const timer = setTimeout(() => {
        setPhase('result');
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Se valido, rivela un passo alla volta ogni 0.5 secondi (500ms)
    if (visibleSteps < result.steps.length) {
      const timer = setTimeout(() => {
        setVisibleSteps(v => v + 1);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      // Quando tutti i passi sono visibili, aspetta 1 secondo e passa a 'result'
      const timer = setTimeout(() => {
        setPhase('result');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, result, visibleSteps]);

  const stationById = useMemo(
    () => new Map((network?.stations ?? []).map(station => [station.id, station])),
    [network?.stations]
  );

  const stationName = id => stationById.get(id)?.name ?? `#${id}`;

  // ── SUBMIT PERCORSO ───────────────────────────────────────────────────
  async function handleSubmit() {
    const segments = selectedSegmentsRef.current;
    setPhase('submitting');
    setError(null);
    try {
      const res = await submitGame(gameId, segments);
      setResult(res);
      setVisibleSteps(0);
      setPhase('execution');
    } catch (err) {
      setError(err.message);
      setPhase('error');
    }
  }

  // ── GESTIONE SEGMENTI ─────────────────────────────────────────────────
  function handleSegmentSelect(seg) {
    setSelectedSegments(prev => {
      const from = seg.from_station_id;
      const to = seg.to_station_id;

      // Se il segmento è già selezionato, lo deseleziona (lo rimuove dal percorso)
      const isAlreadySelected = prev.some(
        s => (s.from === from && s.to === to) || (s.from === to && s.to === from)
      );
      if (isAlreadySelected) {
        return prev.filter(
          s => !((s.from === from && s.to === to) || (s.from === to && s.to === from))
        );
      }

      const currentStation = prev.length === 0 ? startStationId : prev[prev.length - 1].to;

      let orientedSeg;
      if (from === currentStation) {
        orientedSeg = { from, to };
      } else if (to === currentStation) {
        orientedSeg = { from: to, to: from };
      } else {
        orientedSeg = { from, to };
      }

      const next = [...prev, orientedSeg];
      return next;
    });
  }

  function undoLastSegment() {
    setSelectedSegments(prev => prev.slice(0, -1));
  }

  // ── RENDERING ─────────────────────────────────────────────────────────

  if (phase === 'loading' || phase === 'submitting') {
    return (
      <div className="container py-5 text-center text-muted">
        {phase === 'submitting' ? 'Validazione percorso…' : 'Caricamento partita…'}
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error ?? 'Errore sconosciuto.'}</div>
        <button className="btn btn-primary" onClick={initGame}>Riprova</button>
      </div>
    );
  }


  // Stazione evidenziata come "ultimo nodo del percorso corrente"
  const currentNodeId = selectedSegments.length === 0
    ? startStationId
    : selectedSegments[selectedSegments.length - 1].to;

  // Monete correnti visibili nella fase execution
  const currentCoins = visibleSteps === 0 ? 20 : result?.steps[visibleSteps - 1].coinsAfter;

  const compactLayout = phase === 'setup' || phase === 'planning';
  const gameViewportHeight = 'calc(100dvh - 88px)';

  return (
    <div
      className="container-fluid px-4 pt-2 pb-3 d-flex flex-column"
      style={{
        maxWidth: 1400,
        minHeight: compactLayout ? gameViewportHeight : 'auto',
        height: compactLayout ? gameViewportHeight : 'auto',
        overflow: compactLayout ? 'hidden' : 'visible',
      }}
    >

      {/* ── SETUP (Fase 1) ──────────────────────────────────────────────── */}
      {phase === 'setup' && (
        <div className="d-flex flex-column flex-grow-1" style={{ minHeight: 0, overflow: 'hidden' }}>
          <div className="flex-shrink-0">
            <h4 className="mb-1">Fase 1 — Setup</h4>
            <p className="text-muted mb-2">
              Studia la mappa. Tutte le linee sono visibili. Quando sei pronto, inizia il planning:
              avrai <strong>90 secondi</strong> per costruire il percorso con le linee nascoste.
            </p>
          </div>

          <div className="flex-grow-1" style={{ minHeight: 0 }}>
            <NetworkMap
              stations={network.stations}
              stationLines={network.stationLines}
              segments={network.segments}
              lines={network.lines}
              showLines={true}
              startStationId={startStationId}
              endStationId={endStationId}
              height="100%"
            />
          </div>

          <div className="mt-2 d-flex gap-3 align-items-center flex-wrap flex-shrink-0">
            <div className="d-flex gap-2 flex-wrap align-items-center">
              <span className="badge bg-success py-2 px-3">
                Partenza: <strong>{stationName(startStationId)}</strong>
              </span>
              <span className="badge bg-danger py-2 px-3">
                Arrivo: <strong>{stationName(endStationId)}</strong>
              </span>
            </div>
            <button
              className="btn btn-brand ms-auto"
              onClick={beginPlanning}
            >
              Sono pronto — inizia il timer →
            </button>
          </div>
        </div>
      )}

      {/* ── PLANNING (Fase 2) ─────────────────────────────────────────────
          Le linee sono nascoste. L'utente ha 90 secondi per costruire il percorso.
          In Planning la NetworkMap mostra solo stazioni e nomi: i segmenti si scelgono dalla lista.
          showInterchanges={false}: non rivelare le stazioni di interscambio (informazione utile).
      */}
      {phase === 'planning' && (
        <div className="d-flex flex-column flex-grow-1" style={{ minHeight: 0, overflow: 'hidden' }}>
          {/* Top header instructions with audio control & timer */}
          <div className="mb-2 d-flex justify-content-between align-items-center flex-wrap gap-3 py-2 px-3 game-phase-header">
            <div>
              <h4 className="mb-1 text-primary fw-bold">Fase 2 — Planning</h4>
              <p className="text-muted mb-0 small">
                Le linee sono nascoste. Scegli i segmenti dalla lista, in ordine, per costruire il percorso.
              </p>
            </div>
            <div className="d-flex align-items-center gap-3">
              <PlanningTimer timeLeft={timeLeft} totalSeconds={PLANNING_SECONDS} />
              <GameAudio phase={phase} />
            </div>
          </div>

          <div
            className="flex-grow-1"
            style={{
              minHeight: 0,
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 2.2fr) minmax(320px, 1fr)',
              gap: '1rem',
            }}
          >
            <div className="d-flex" style={{ minHeight: 0 }}>
              <div className="d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
                <div className="game-map-card mb-2 flex-grow-1 d-flex flex-column" style={{ minHeight: 0 }}>
                  <div className="card-body p-0 flex-grow-1 d-flex flex-column" style={{ minHeight: 0 }}>
                    <NetworkMap
                      stations={network.stations}
                      stationLines={network.stationLines}
                      segments={network.segments}
                      lines={network.lines}
                      showLines={false}
                      showInterchanges={false}
                      startStationId={startStationId}
                      endStationId={endStationId}
                      currentNodeId={currentNodeId}
                      height="100%"
                      selectedSegments={selectedSegments}
                      hoveredSegment={hoveredSegment}
                    />
                  </div>
                </div>

                <div className="d-flex gap-2 align-items-center justify-content-between flex-wrap" style={{ flexShrink: 0 }}>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-secondary py-2 px-3 fs-6">
                      Segmenti: <strong>{selectedSegments.length}</strong>
                    </span>
                    {selectedSegments.length > 0 && (
                      <button className="btn btn-outline-secondary btn-sm" onClick={undoLastSegment}>
                        Annulla ultimo
                      </button>
                    )}
                    {selectedSegments.length > 0 && (
                      <button className="btn btn-outline-danger btn-sm" onClick={() => { setSelectedSegments([]); }}>
                        Azzera percorso
                      </button>
                    )}
                  </div>
                  <button className="btn btn-primary ms-auto" onClick={handleSubmit}>
                    Conferma percorso →
                  </button>
                </div>
              </div>
            </div>

            <div className="d-flex" style={{ minHeight: 0 }}>
              <div className="d-flex flex-column gap-2 flex-grow-1" style={{ minHeight: 0, overflow: 'hidden' }}>
                {/* Indicazione Partenza e Destinazione */}
                <div className="route-endpoints-card">
                  <div className="card-body py-2 px-3">
                    <div className="d-flex align-items-center justify-content-center gap-3">
                      <div className="d-flex align-items-center gap-2">
                        <span className="d-inline-flex align-items-center justify-content-center rounded-circle fw-bold text-white bg-success shadow-sm" style={{ width: '22px', height: '22px', fontSize: '9px', minWidth: '22px' }}>
                          DA
                        </span>
                        <span className="text-secondary fw-bold" style={{ fontSize: '13.5px' }}>
                          {stationName(startStationId)}
                        </span>
                      </div>
                      
                      <span className="text-muted fw-bold" style={{ fontSize: '14px' }}>➔</span>
                      
                      <div className="d-flex align-items-center gap-2">
                        <span className="d-inline-flex align-items-center justify-content-center rounded-circle fw-bold text-white bg-danger shadow-sm" style={{ width: '22px', height: '22px', fontSize: '9px', minWidth: '22px' }}>
                          A
                        </span>
                        <span className="text-secondary fw-bold" style={{ fontSize: '13.5px' }}>
                          {stationName(endStationId)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lista segmenti da selezionare */}
                <SegmentList
                  segments={network.segments}
                  selectedSegments={selectedSegments}
                  stationName={stationName}
                  onSegmentSelect={handleSegmentSelect}
                  onSegmentHover={setHoveredSegment}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EXECUTION (Fase 3) ──────────────────────────────────────────── */}
      {phase === 'execution' && result && (
        <div>
          <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
            <h4 className="mb-0">Fase 3 — Esecuzione</h4>
            {result.valid && (
              <span className="badge bg-primary fs-6 ms-auto">
                🪙 {currentCoins} monete
              </span>
            )}
          </div>

          {!result.valid && (
            <div className="alert alert-danger mb-3">
              Percorso non valido o incompleto. Hai perso tutte le monete (0 🪙).
            </div>
          )}

          {result.valid && (
            <>
              {result.steps.slice(0, visibleSteps).map((step, i) => (
                <div key={i} className="card mb-2 step-fade-in">
                  <div className="card-body py-2 d-flex align-items-center gap-2 flex-wrap">
                    <span>
                      <strong>Passo {step.stepOrder}:</strong>{' '}
                      {stationName(step.fromStationId)} → {stationName(step.toStationId)}
                    </span>
                    <span className="text-muted mx-1">|</span>
                    <span>{step.event.description}</span>
                    <span className={`badge ${step.event.effect >= 0 ? 'bg-success' : 'bg-danger'}`}>
                      {step.event.effect >= 0 ? '+' : ''}{step.event.effect}
                    </span>
                    <span className="ms-auto fw-bold">🪙 {step.coinsAfter}</span>
                  </div>
                </div>
              ))}

              <div className="d-flex align-items-center gap-3 mt-3">
                {visibleSteps < result.steps.length ? (
                  <>
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Simulazione in corso...</span>
                    </div>
                    <span className="text-muted">Esecuzione in corso...</span>
                    <button className="btn btn-outline-secondary btn-sm ms-auto" onClick={() => setPhase('result')}>
                      Salta animazione →
                    </button>
                  </>
                ) : (
                  <span className="text-muted ms-auto">Completato! Reindirizzamento...</span>
                )}
              </div>
            </>
          )}

          {!result.valid && (
            <div className="d-flex align-items-center gap-3 mt-3">
              <span className="text-muted">Reindirizzamento...</span>
              <button className="btn btn-outline-secondary btn-sm ms-auto" onClick={() => setPhase('result')}>
                Salta →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── RESULT (Fase 4) ─────────────────────────────────────────────── */}
      {phase === 'result' && (
        <div className="text-center py-5">
          <div className="result-panel">
            <h2 className="fw-bold mb-3">Partita terminata</h2>
            <p className="result-score mb-2">{result?.valid ? result.finalScore : 0} 🪙</p>
            <p className="text-muted mb-3">
              {stationName(startStationId)} → {stationName(endStationId)}
            </p>
            {result && (
              <p className={resultMessage(result.valid ? result.finalScore : 0, result.valid).cls}>
                {resultMessage(result.valid ? result.finalScore : 0, result.valid).text}
              </p>
            )}
            <button className="btn btn-brand btn-lg mt-3 px-4" onClick={initGame}>
              Nuova partita
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
