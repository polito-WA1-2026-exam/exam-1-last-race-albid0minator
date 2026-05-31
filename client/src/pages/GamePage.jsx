import { useState, useEffect, useRef } from 'react';
import NetworkMap from '../components/NetworkMap.jsx';
import PlanningTimer from '../components/PlanningTimer.jsx';
import { getNetwork, createGame, submitGame } from '../API.js';

const PLANNING_SECONDS = 90;

export default function GamePage() {
  // phase determina quale schermata renderizzare.
  // Inizia a 'loading' anziché 'setup' perché il setup richiede i dati dal server
  // e non possiamo mostrare nulla finché non arrivano.
  const [phase, setPhase] = useState('loading');
  const [error, setError] = useState(null);

  // Dati della rete e della partita corrente.
  // Separati perché la rete è statica (stessa per tutta la sessione),
  // mentre gameId/start/end variano ad ogni nuova partita.
  const [network, setNetwork] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [startStationId, setStartStationId] = useState(null);
  const [endStationId, setEndStationId] = useState(null);

  // Segmenti selezionati dall'utente nella fase Planning.
  const [selectedSegments, setSelectedSegments] = useState([]);

  // Timer countdown per la fase Planning.
  const [timeLeft, setTimeLeft] = useState(PLANNING_SECONDS);

  // Risposta del server dopo la submit: { valid, steps, finalScore }
  const [result, setResult] = useState(null);

  // Quanti passi dell'esecuzione sono stati rivelati all'utente.
  // I passi vengono mostrati uno alla volta: l'utente clicca "Avanti" per vedere il successivo.
  const [visibleSteps, setVisibleSteps] = useState(0);

  // ── PATTERN "LATEST REF" ──────────────────────────────────────────────
  // Il problema: setInterval cattura le variabili chiuse al momento della sua creazione.
  // Se leggiamo `selectedSegments` dentro il callback del timer, leggeremo sempre il valore
  // iniziale (stale closure), non quello corrente.
  //
  // Soluzione: aggiorniamo un ref sincronamente ad ogni render.
  // I ref non causano re-render e sono sempre accessibili nel loro valore corrente.
  const selectedSegmentsRef = useRef([]);
  const handleSubmitRef = useRef(null);

  // Aggiornamento dei ref dopo ogni render (non durante il render, per soddisfare le regole React 19).
  useEffect(() => {
    selectedSegmentsRef.current = selectedSegments;
    handleSubmitRef.current = handleSubmit;
  });

  // ── INIZIALIZZAZIONE ──────────────────────────────────────────────────
  // loadGameData contiene solo setState chiamate asincrone (dopo await),
  // quindi è sicuro chiamarla dall'effect senza violare le regole React 19.
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

  // initGame resetta lo stato in modo sincrono e poi avvia il fetch.
  // Chiamata dai bottoni "Nuova partita" e "Riprova" (non dall'effect).
  function initGame() {
    setPhase('loading');
    setError(null);
    setSelectedSegments([]);
    setResult(null);
    setVisibleSteps(0);
    void loadGameData();
  }

  // Al montaggio la fase è già 'loading' (stato iniziale), basta avviare il fetch.
  useEffect(() => {
    void loadGameData();
  }, []);

  // ── TIMER PLANNING ────────────────────────────────────────────────────
  // L'effect si attiva solo quando phase diventa 'planning' (grazie alla dipendenza [phase]).
  // Il cleanup (return) cancella l'interval se:
  //   a) l'utente clicca "Conferma" prima dello scadere (phase cambia → effect si riesegue)
  //   b) il componente si smonta
  useEffect(() => {
    if (phase !== 'planning') return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // handleSubmitRef.current è sempre aggiornato ad ogni render (vedi sotto),
          // quindi richiamiamo la versione più recente senza stale closure.
          handleSubmitRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  // ── SUBMIT PERCORSO ───────────────────────────────────────────────────
  async function handleSubmit() {
    // Leggiamo i segmenti tramite ref, non da state, perché questa funzione
    // viene chiamata anche dal timer (che avrebbe una closure stale sullo state).
    const segments = selectedSegmentsRef.current;
    setPhase('submitting');
    setError(null);
    try {
      const res = await submitGame(gameId, segments);
      setResult(res);
      setVisibleSteps(0);
      setPhase('execution');
    } catch (err) {
      // Errore di rete o del server: torniamo a un fase di errore invece di bloccarci silenziosamente.
      setError(err.message);
      setPhase('error');
    }
  }

  // ── GESTIONE SEGMENTI ─────────────────────────────────────────────────
  // Toggle: click su un segmento già selezionato lo deseleziona, click su uno nuovo lo aggiunge.
  // Usiamo la forma funzionale di setSelectedSegments per evitare di chiudere su un valore stale.
  function handleSegmentClick(seg) {
    setSelectedSegments(prev => {
      // Verifica se il segmento è già presente (in qualsiasi direzione)
      const exists = prev.some(s => 
        (s.from === seg.from && s.to === seg.to) || 
        (s.from === seg.to   && s.to === seg.from)
      );
      
      if (exists) {
        // Rimuove il segmento (in qualsiasi direzione)
        return prev.filter(s => 
          !((s.from === seg.from && s.to === seg.to) || 
            (s.from === seg.to   && s.to === seg.from))
        );
      }
      
      // Determina l'orientamento corretto basandoci sull'ultimo nodo del percorso corrente
      let orientedSeg = { from: seg.from, to: seg.to };
      if (prev.length === 0) {
        // Se è il primo segmento, deve partire da startStationId
        if (seg.to === startStationId) {
          orientedSeg = { from: seg.to, to: seg.from };
        }
      } else {
        // Altrimenti deve attaccarsi all'ultimo nodo del segmento precedente
        const lastStation = prev[prev.length - 1].to;
        if (seg.to === lastStation) {
          orientedSeg = { from: seg.to, to: seg.from };
        }
      }
      
      return [...prev, orientedSeg];
    });
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

  // Shorthand per trovare il nome di una stazione dato il suo ID.
  const stationName = id => network.stations.find(s => s.id === id)?.name ?? `#${id}`;

  return (
    <div className="container-fluid px-4 py-4" style={{ maxWidth: 1400 }}>

      {/* ── SETUP (Fase 1) ────────────────────────────────────────────────
          Mappa completa con linee visibili. L'utente studia la rete prima che
          le informazioni vengano nascoste nella fase successiva.
      */}
      {phase === 'setup' && (
        <div>
          <h4 className="mb-1">Fase 1 — Setup</h4>
          <p className="text-muted mb-3">
            Studia la mappa. Tutte le linee sono visibili. Nota le stazioni di interscambio.
          </p>
          <NetworkMap
            stations={network.stations}
            stationLines={network.stationLines}
            segments={network.segments}
            lines={network.lines}
            showLines={true}
            startStationId={startStationId}
            endStationId={endStationId}
            height={620}
          />
          <div className="mt-3 d-flex gap-3 align-items-center flex-wrap">
            <div className="d-flex gap-2 flex-wrap">
              <span className="badge bg-success">Partenza</span>
              <span className="badge bg-danger">Arrivo</span>
            </div>
            <button className="btn btn-primary ms-auto" onClick={() => { setTimeLeft(PLANNING_SECONDS); setPhase('planning'); }}>
              Sono pronto →
            </button>
          </div>
        </div>
      )}

      {/* ── PLANNING (Fase 2) ─────────────────────────────────────────────
          Le linee sono nascoste. L'utente ha 90 secondi per costruire il percorso.
          showLines={false}: la NetworkMap mostra solo stazioni e segmenti, senza colori linea.
          showInterchanges={false}: non rivelare le stazioni di interscambio (informazione utile).
      */}
      {phase === 'planning' && (
        <div>
          {/* Top header instructions */}
          <div className="mb-4">
            <h4 className="mb-1">Fase 2 — Planning</h4>
            <p className="text-muted mb-0">
              Le linee sono nascoste. Seleziona i segmenti sulla mappa per costruire il percorso.
            </p>
          </div>

          <div className="row g-4">
            {/* Left Column: Insertion zone */}
            <div className="col-lg-8 col-md-7">
              <div className="d-flex flex-column h-100">
                <div className="card shadow-sm border-0 mb-3 overflow-hidden">
                  <div className="card-body p-0">
                    <NetworkMap
                      stations={network.stations}
                      stationLines={network.stationLines}
                      segments={network.segments}
                      lines={network.lines}
                      showLines={false}
                      showInterchanges={false}
                      selectedSegments={selectedSegments}
                      startStationId={startStationId}
                      endStationId={endStationId}
                      onSegmentClick={handleSegmentClick}
                      height={540}
                    />
                  </div>
                </div>

                <div className="d-flex gap-2 align-items-center justify-content-between flex-wrap">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-secondary py-2 px-3 fs-6">
                      Segmenti: <strong>{selectedSegments.length}</strong>
                    </span>
                    {selectedSegments.length > 0 && (
                      <button className="btn btn-outline-danger btn-sm" onClick={() => setSelectedSegments([])}>
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

            {/* Right Column: Clean Timer & Recap Panel */}
            <div className="col-lg-4 col-md-5">
              <div className="d-flex flex-column gap-4">
                {/* PlanningTimer Component (No box design, just clean text layout) */}
                <PlanningTimer timeLeft={timeLeft} totalSeconds={PLANNING_SECONDS} />

                {/* Journey Recap Card */}
                <div className="card shadow-sm border-0 bg-white p-3">
                  <h5 className="border-bottom pb-2 mb-3 text-secondary fw-bold">Riepilogo Percorso</h5>
                  <div className="d-flex flex-column gap-3">
                    <div>
                      <small className="text-muted d-block text-uppercase fw-bold">Partenza</small>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge rounded-circle bg-success p-2" style={{ width: 10, height: 10 }} />
                        <strong className="text-dark fs-6">{stationName(startStationId)}</strong>
                      </div>
                    </div>
                    
                    <div className="ps-1 text-muted fs-5">↓</div>
                    
                    <div>
                      <small className="text-muted d-block text-uppercase fw-bold">Arrivo</small>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge rounded-circle bg-danger p-2" style={{ width: 10, height: 10 }} />
                        <strong className="text-dark fs-6">{stationName(endStationId)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EXECUTION (Fase 3) ────────────────────────────────────────────
          I passi vengono rivelati uno alla volta tramite "Avanti".
          Se il percorso è invalido, il server restituisce valid=false e steps=[].
      */}
      {phase === 'execution' && result && (
        <div>
          <h4 className="mb-3">Fase 3 — Esecuzione</h4>

          {!result.valid && (
            <div className="alert alert-danger mb-3">
              Percorso non valido o incompleto. Hai perso tutte le monete (0 🪙).
            </div>
          )}

          {result.valid && (
            <>
              {/* Mostra solo i passi già rivelati (slice fino a visibleSteps) */}
              {result.steps.slice(0, visibleSteps).map((step, i) => (
                <div key={i} className="card mb-2">
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

              {/* Pulsante per rivelare il passo successivo, o per passare al risultato */}
              {visibleSteps < result.steps.length ? (
                <button
                  className="btn btn-outline-primary mt-2"
                  onClick={() => setVisibleSteps(v => v + 1)}
                >
                  Avanti →
                </button>
              ) : (
                <button className="btn btn-primary mt-2" onClick={() => setPhase('result')}>
                  Vedi risultato →
                </button>
              )}
            </>
          )}

          {!result.valid && (
            <button className="btn btn-primary mt-2" onClick={() => setPhase('result')}>
              Vedi risultato →
            </button>
          )}
        </div>
      )}

      {/* ── RESULT (Fase 4) ───────────────────────────────────────────────
          Punteggio finale. Se result.valid è false, il punteggio è 0.
          "Nuova partita" ricrea tutto da zero (nuova chiamata a initGame).
      */}
      {phase === 'result' && (
        <div className="text-center py-5">
          <h2>Partita terminata</h2>
          <p className="fs-1 fw-bold">{result?.valid ? result.finalScore : 0} 🪙</p>
          <p className="text-muted">
            {stationName(startStationId)} → {stationName(endStationId)}
          </p>
          {!result?.valid && (
            <p className="text-danger">Percorso non valido — tutte le monete perse.</p>
          )}
          <button className="btn btn-success btn-lg mt-2" onClick={initGame}>
            Nuova partita
          </button>
        </div>
      )}

    </div>
  );
}
