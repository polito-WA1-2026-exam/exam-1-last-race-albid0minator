import { Link } from 'react-router-dom';
import metroHeroImg from '../assets/Gemini_Generated_Image_lkw8flkw8flkw8fl.png';

export default function HomePage({ user }) {
  return (
    <div className="container py-5" id="home-page-container">
      {/* Hero Section */}
      <div className="p-5 mb-4 hero-panel text-white" id="hero-section">
        <div className="row align-items-center g-4">
          <div className="col-lg-7">
            <div className="metro-kicker mb-3">Metro Control</div>
            <div className="d-flex align-items-center gap-3 mb-2">
              <i className="bi bi-train-front text-warning" style={{ fontSize: '2.5rem' }}></i>
              <h1 className="display-4 fw-bold mb-0" style={{ letterSpacing: '-1px' }}>Last Race</h1>
            </div>
            <p className="fs-5 mb-4 hero-subtitle">
              Un entusiasmante gioco di orientamento e memoria ispirato al celebre gioco da tavolo <em>"Race the Rails"</em>.
              Memorizza le linee della metropolitana sotterranea, pianifica la rotta migliore prima che scada il tempo e gestisci gli imprevisti di viaggio!
            </p>
            {user && (
              <div className="d-flex gap-3 align-items-center flex-wrap">
                <Link className="btn btn-brand btn-lg px-4 fw-semibold d-flex align-items-center gap-2" to="/game" id="btn-play-game">
                  <i className="bi bi-controller fs-5"></i> Gioca Ora
                </Link>
                <Link className="btn btn-outline-light btn-lg px-4 d-flex align-items-center gap-2" to="/ranking" id="btn-view-ranking">
                  <i className="bi bi-trophy fs-5"></i> Classifica
                </Link>
                <span className="text-secondary-light ms-2" style={{ color: '#cbd5e1' }}>
                  Bentornato, <strong>{user.name}</strong>!
                </span>
              </div>
            )}
          </div>
          <div className="col-lg-5 text-center">
            <img 
              src={metroHeroImg} 
              alt="Last Race Subway" 
              className="img-fluid rounded-4 shadow-lg metro-hero-image"
              style={{ maxHeight: '280px', width: '100%', objectFit: 'cover' }} 
            />
          </div>
        </div>
      </div>

      {/* Informative section for Anonymous Users */}
      {!user && (
        <div className="surface-card mb-5 p-4 text-center" id="anonymous-info-card">
          <div className="card-body py-4">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-3" style={{ width: 60, height: 60 }}>
              <i className="bi bi-info-circle-fill fs-3"></i>
            </div>
            <h4 className="fw-bold mb-2">Pronto a Salire a Bordo?</h4>
            <p className="text-muted mx-auto mb-4" style={{ maxWidth: '600px', fontSize: '15px' }}>
              Accedi con il tuo account di gioco per visualizzare la mappa interattiva della metropolitana, pianificare la tua corsa sotterranea ed entrare nella classifica generale.
            </p>
            <Link className="btn btn-primary px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2" to="/login" id="btn-login-cta">
              <i className="bi bi-box-arrow-in-right"></i> Effettua l'Accesso
            </Link>
          </div>
        </div>
      )}

      {/* Regole del Gioco */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <div className="metro-section-line" aria-hidden="true" />
        <h2 className="fw-bold mb-0" id="section-rules-title">Come Funziona il Gioco</h2>
      </div>

      {/* Metro route strip — le 4 fasi come fermate su un tracciato */}
      <div className="metro-route-strip mb-3" aria-hidden="true">
        <div className="metro-route-stop">
          <div className="metro-route-stop__dot" style={{ background: '#1e40af', color: '#fff' }}>1</div>
          <div className="metro-route-stop__name">Setup</div>
        </div>
        <div className="metro-route-stop">
          <div className="metro-route-stop__dot" style={{ background: '#f59e0b', color: '#0f172a' }}>2</div>
          <div className="metro-route-stop__name">Planning</div>
        </div>
        <div className="metro-route-stop">
          <div className="metro-route-stop__dot" style={{ background: '#0891b2', color: '#fff' }}>3</div>
          <div className="metro-route-stop__name">Execution</div>
        </div>
        <div className="metro-route-stop">
          <div className="metro-route-stop__dot" style={{ background: '#16a34a', color: '#fff' }}>4</div>
          <div className="metro-route-stop__name">Risultato</div>
        </div>
      </div>

      <div className="row row-cols-1 row-cols-md-4 g-4 mb-5" id="game-steps-row">
        {/* Step 1 */}
        <div className="col">
          <div className="surface-card metro-step-card h-100" style={{ '--step-line': '#1e40af' }} id="step-card-1">
            <div className="card-body p-4">
              <div className="metro-step-icon d-inline-flex align-items-center justify-content-center rounded-3 mb-3">
                <i className="bi bi-eye-fill fs-5"></i>
              </div>
              <h5 className="card-title fw-bold">Fase 1: Setup</h5>
              <p className="card-text text-muted small">
                Studia con attenzione la mappa metropolitana con tutte le linee colorate visibili. Memorizza le connessioni e le stazioni di interscambio.
              </p>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="col">
          <div className="surface-card metro-step-card h-100" style={{ '--step-line': '#f59e0b' }} id="step-card-2">
            <div className="card-body p-4">
              <div className="metro-step-icon d-inline-flex align-items-center justify-content-center rounded-3 mb-3 text-dark">
                <i className="bi bi-alarm-fill fs-5"></i>
              </div>
              <h5 className="card-title fw-bold">Fase 2: Planning</h5>
              <p className="card-text text-muted small">
                Partenza e arrivo ti vengono assegnati a caso. Le linee spariscono! Hai 90 secondi per ricostruire a memoria e selezionare i segmenti di connessione.
              </p>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="col">
          <div className="surface-card metro-step-card h-100" style={{ '--step-line': '#0891b2' }} id="step-card-3">
            <div className="card-body p-4">
              <div className="metro-step-icon d-inline-flex align-items-center justify-content-center rounded-3 mb-3">
                <i className="bi bi-lightning-fill fs-5"></i>
              </div>
              <h5 className="card-title fw-bold">Fase 3: Execution</h5>
              <p className="card-text text-muted small">
                Il server valida la rotta. Se valida, percorri i segmenti e affronti eventi casuali (ritardi, coincidenze, incontri) che tolgono o aggiungono monete.
              </p>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="col">
          <div className="surface-card metro-step-card h-100" style={{ '--step-line': '#16a34a' }} id="step-card-4">
            <div className="card-body p-4">
              <div className="metro-step-icon d-inline-flex align-items-center justify-content-center rounded-3 mb-3">
                <i className="bi bi-flag-fill fs-5"></i>
              </div>
              <h5 className="card-title fw-bold">Fase 4: Risultato</h5>
              <p className="card-text text-muted small">
                Arriva alla stazione di destinazione. Il tuo punteggio finale corrisponde alle monete salvate. Un percorso incompleto o non valido azzera il punteggio.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-5" id="rules-details-row">
        {/* Regole di Connessione e Interscambi */}
        <div className="col-md-7">
          <div className="surface-card p-4 h-100" id="rules-details-card">
            <h4 className="fw-bold mb-3">Dettagli e Regole di Viaggio</h4>
            <ul className="list-group list-group-flush">
              <li className="list-group-item border-0 px-0 py-3 d-flex align-items-start gap-3 bg-white">
                <span className="badge bg-success-subtle text-success p-2 rounded-circle"><i className="bi bi-ruler fs-5 d-block"></i></span>
                <div>
                  <strong className="d-block mb-1">Distanza di Sicurezza</strong>
                  <span className="text-muted small">Ogni viaggio garantisce una distanza minima di almeno 3 stazioni di percorso tra il punto di partenza e la destinazione.</span>
                </div>
              </li>
              <li className="list-group-item border-0 px-0 py-3 d-flex align-items-start gap-3 bg-white">
                <span className="badge bg-danger-subtle text-danger p-2 rounded-circle"><i className="bi bi-signpost-2 fs-5 d-block"></i></span>
                <div>
                  <strong className="d-block mb-1">Regole di Cambio Linea</strong>
                  <span className="text-muted small">Puoi cambiare linea metropolitana solo ed esclusivamente all'interno delle stazioni abilitate come stazioni di interscambio (interchanges).</span>
                </div>
              </li>
              <li className="list-group-item border-0 px-0 py-3 d-flex align-items-start gap-3 bg-white">
                <span className="badge p-2 rounded-circle" style={{ color: '#075985', backgroundColor: '#e0f2fe' }}><i className="bi bi-coin fs-5 d-block"></i></span>
                <div>
                  <strong className="d-block mb-1">Budget e Punteggio</strong>
                  <span className="text-muted small">Inizi ogni corsa con un budget fisso di 20 monete. Gli imprevisti di viaggio estratti casualmente cambieranno il budget (con variazioni da -4 a +4 per ogni tratta).</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Informazioni Rete */}
        <div className="col-md-5">
          <div className="surface-card p-4 h-100" id="network-info-card">
            <h4 className="fw-bold mb-3">La Nostra Rete Metro</h4>

            {/* Mini SVG metro schematic — illustrativo */}
            <svg className="mini-metro-map" viewBox="0 0 210 145" aria-hidden="true" focusable="false">
              <rect width="210" height="145" fill="#f8fafc" rx="6"/>
              {/* Line D vertical (amber) */}
              <line x1="105" y1="15" x2="105" y2="112" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
              {/* Line A horizontal (red) */}
              <line x1="15" y1="32" x2="195" y2="32" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
              {/* Line B horizontal (blue) */}
              <line x1="15" y1="63" x2="195" y2="63" stroke="#1e40af" strokeWidth="3" strokeLinecap="round"/>
              {/* Line C horizontal (green) */}
              <line x1="15" y1="94" x2="195" y2="94" stroke="#16a34a" strokeWidth="3" strokeLinecap="round"/>
              {/* Stations on A */}
              <circle cx="15" cy="32" r="5" fill="#fff" stroke="#ef4444" strokeWidth="2"/>
              <circle cx="60" cy="32" r="5" fill="#fff" stroke="#ef4444" strokeWidth="2"/>
              <circle cx="150" cy="32" r="5" fill="#fff" stroke="#ef4444" strokeWidth="2"/>
              <circle cx="195" cy="32" r="5" fill="#fff" stroke="#ef4444" strokeWidth="2"/>
              {/* Stations on B */}
              <circle cx="15" cy="63" r="5" fill="#fff" stroke="#1e40af" strokeWidth="2"/>
              <circle cx="60" cy="63" r="5" fill="#fff" stroke="#1e40af" strokeWidth="2"/>
              <circle cx="150" cy="63" r="5" fill="#fff" stroke="#1e40af" strokeWidth="2"/>
              <circle cx="195" cy="63" r="5" fill="#fff" stroke="#1e40af" strokeWidth="2"/>
              {/* Stations on C */}
              <circle cx="15" cy="94" r="5" fill="#fff" stroke="#16a34a" strokeWidth="2"/>
              <circle cx="60" cy="94" r="5" fill="#fff" stroke="#16a34a" strokeWidth="2"/>
              <circle cx="150" cy="94" r="5" fill="#fff" stroke="#16a34a" strokeWidth="2"/>
              <circle cx="195" cy="94" r="5" fill="#fff" stroke="#16a34a" strokeWidth="2"/>
              {/* Line D endpoints */}
              <circle cx="105" cy="15" r="5" fill="#fff" stroke="#f59e0b" strokeWidth="2"/>
              <circle cx="105" cy="112" r="5" fill="#fff" stroke="#f59e0b" strokeWidth="2"/>
              {/* Interchanges (D incrocia A, B, C) */}
              <circle cx="105" cy="32" r="8" fill="#fff" stroke="#0f172a" strokeWidth="2"/>
              <circle cx="105" cy="32" r="3.5" fill="#0f172a"/>
              <circle cx="105" cy="63" r="8" fill="#fff" stroke="#0f172a" strokeWidth="2"/>
              <circle cx="105" cy="63" r="3.5" fill="#0f172a"/>
              <circle cx="105" cy="94" r="8" fill="#fff" stroke="#0f172a" strokeWidth="2"/>
              <circle cx="105" cy="94" r="3.5" fill="#0f172a"/>
              {/* Legend */}
              <rect x="8" y="122" width="12" height="4" fill="#ef4444" rx="2"/>
              <text x="23" y="126.5" fill="#64748b" fontSize="7" fontFamily="sans-serif">A</text>
              <rect x="35" y="122" width="12" height="4" fill="#1e40af" rx="2"/>
              <text x="50" y="126.5" fill="#64748b" fontSize="7" fontFamily="sans-serif">B</text>
              <rect x="62" y="122" width="12" height="4" fill="#16a34a" rx="2"/>
              <text x="77" y="126.5" fill="#64748b" fontSize="7" fontFamily="sans-serif">C</text>
              <rect x="89" y="122" width="12" height="4" fill="#f59e0b" rx="2"/>
              <text x="104" y="126.5" fill="#64748b" fontSize="7" fontFamily="sans-serif">D</text>
              <circle cx="122" cy="124" r="4.5" fill="#fff" stroke="#0f172a" strokeWidth="1.5"/>
              <circle cx="122" cy="124" r="2" fill="#0f172a"/>
              <text x="130" y="126.5" fill="#64748b" fontSize="7" fontFamily="sans-serif">= interscambio</text>
            </svg>

            <p className="text-muted small">
              La rete è composta da <strong>4 linee</strong> e almeno <strong>12 stazioni</strong>, con 3 stazioni di interscambio.
            </p>
            <div className="bg-light p-3 rounded-3 border mb-3">
              <h6 className="fw-bold mb-2">Composizione:</h6>
              <div className="d-flex justify-content-between mb-2 small border-bottom pb-1">
                <span>Linee Totali</span>
                <span className="fw-bold text-dark">&ge; 4</span>
              </div>
              <div className="d-flex justify-content-between mb-2 small border-bottom pb-1">
                <span>Stazioni Totali</span>
                <span className="fw-bold text-dark">17-20</span>
              </div>
              <div className="d-flex justify-content-between small">
                <span>Interscambi Abilitati</span>
                <span className="fw-bold text-dark">&ge; 3</span>
              </div>
            </div>
            <p className="text-muted small mb-0">
              Usa il tempo a disposizione nella fase di setup per visualizzare la legenda dei colori di ciascuna linea e studiare le zone ad alta intensità di stazioni.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
