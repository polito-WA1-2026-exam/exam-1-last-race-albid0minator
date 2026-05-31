
export default function PlanningTimer({ timeLeft, totalSeconds = 90 }) {
  const isPanic = timeLeft <= 30;
  const isCritical = timeLeft <= 10;

  let alertText = "TEMPO RIMANENTE";
  let statusDesc = "Pianifica il tuo tragitto sulla mappa";
  let containerClass = "";

  if (isCritical) {
    alertText = " CRITICO! ";
    statusDesc = " CORRI! IL TEMPO STA SCADENDO! ";
    containerClass = "timer-shake";
  } else if (isPanic) {
    alertText = " IN SCADENZA ";
    statusDesc = "Sbrigati, invio automatico imminente!";
  }

  return (
    <div className={`text-center py-3 ${containerClass}`} style={{ transition: 'all 0.3s ease' }}>
      {/* Alert Header Label */}
      <div className="mb-1">
        <span className="fs-6 text-uppercase fw-bold text-secondary tracking-wider d-block">
          {alertText}
        </span>
      </div>

      {/* Red Monospace Digits */}
      <div 
        className={`timer-digits display-1 my-1 fw-bold ${isPanic ? 'timer-text-pulse' : ''}`} 
        style={{ color: '#dc2626' }}
      >
        {timeLeft}s
      </div>

      {/* Instructions / Warnings */}
      <div className="mt-2 px-2 fw-semibold text-secondary" style={{ fontSize: '14px' }}>
        {statusDesc}
      </div>

      {/* Red Progress Bar */}
      <div className="w-100 bg-light border rounded-pill mt-3 overflow-hidden" style={{ height: '8px' }}>
        <div 
          className="bg-danger h-100 transition-all"
          style={{ 
            width: `${(timeLeft / totalSeconds) * 100}%`,
            transition: 'width 1s linear'
          }}
        />
      </div>
    </div>
  );
}
