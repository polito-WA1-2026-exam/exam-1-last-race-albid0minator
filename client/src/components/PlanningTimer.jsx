
export default function PlanningTimer({ timeLeft, totalSeconds = 90 }) {
  const isPanic = timeLeft <= 30;
  const isCritical = timeLeft <= 10;

  let timerColor = '#475569'; // default slate-600
  let containerClass = "d-flex align-items-center gap-2 border rounded-pill px-3 py-1.5 bg-white shadow-sm";
  let statusDesc = "Pianifica il tuo tragitto";

  if (isCritical) {
    timerColor = '#dc2626'; // red-600
    containerClass += " border-danger timer-shake";
    statusDesc = "CORRI!";
  } else if (isPanic) {
    timerColor = '#d97706'; // amber-600
    containerClass += " border-warning";
    statusDesc = "In scadenza!";
  } else {
    containerClass += " border-light";
  }

  return (
    <div 
      className={containerClass} 
      style={{ transition: 'all 0.3s ease' }}
      title={statusDesc}
    >
      <span className="fs-6 text-secondary d-none d-sm-inline">
        ⏱️
      </span>
      <div 
        className={`timer-digits fs-5 fw-bold mb-0 lh-1 ${isPanic ? 'timer-text-pulse' : ''}`} 
        style={{ color: timerColor }}
      >
        {timeLeft}s
      </div>
      <div className="bg-light rounded-pill overflow-hidden" style={{ height: '6px', width: '50px' }}>
        <div 
          className="h-100 transition-all"
          style={{ 
            width: `${(timeLeft / totalSeconds) * 100}%`,
            backgroundColor: timerColor,
            transition: 'width 1s linear'
          }}
        />
      </div>
      {(isPanic || isCritical) && (
        <span 
          className="fw-bold text-uppercase d-none d-md-inline" 
          style={{ color: timerColor, fontSize: '10px', letterSpacing: '0.5px' }}
        >
          {statusDesc}
        </span>
      )}
    </div>
  );
}

