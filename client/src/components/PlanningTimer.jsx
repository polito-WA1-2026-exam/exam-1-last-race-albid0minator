
export default function PlanningTimer({ timeLeft, totalSeconds = 90 }) {
  const isPanic    = timeLeft <= 30;
  const isCritical = timeLeft <= 10;

  const minutes    = Math.floor(timeLeft / 60);
  const seconds    = timeLeft % 60;
  const displayTime = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const progressPct = (timeLeft / totalSeconds) * 100;

  let digitColor    = '#1e40af';   // primary blue — leggibile su sfondo chiaro
  let progressColor = '#f59e0b';   // amber brand
  let shakeClass    = '';
  let statusText    = null;

  if (isCritical) {
    digitColor    = '#dc2626';
    progressColor = '#dc2626';
    shakeClass    = ' timer-shake';
    statusText    = 'CORRI!';
  } else if (isPanic) {
    digitColor    = '#d97706';
    progressColor = '#d97706';
    statusText    = 'SCADENZA';
  }

  return (
    <div
      className={`planning-timer${shakeClass}`}
      title={`${timeLeft} secondi rimanenti`}
    >
      <span className="planning-timer__label">TEMPO</span>

      <span
        className={`planning-timer__digits${isPanic ? ' timer-text-pulse' : ''}`}
        style={{ color: digitColor }}
      >
        {displayTime}
      </span>

      <span className="planning-timer__bar">
        <span
          className="planning-timer__bar-fill"
          style={{
            width: `${progressPct}%`,
            backgroundColor: progressColor,
            transition: 'width 1s linear, background-color 0.3s ease',
          }}
        />
      </span>

      {statusText && (
        <span className="planning-timer__status" style={{ color: digitColor }}>
          {statusText}
        </span>
      )}

      <span className="visually-hidden" aria-live="polite">
        {timeLeft} secondi rimanenti.{statusText ? ` ${statusText}` : ''}
      </span>
    </div>
  );
}
