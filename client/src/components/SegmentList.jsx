import { useMemo, useState } from 'react';

function segmentKey(from, to) {
  return `${Math.min(from, to)}-${Math.max(from, to)}`;
}

export default function SegmentList({
  segments = [],
  selectedSegments = [],
  stationName,
  onSegmentSelect,
  onSegmentHover,
}) {
  const [filterQuery, setFilterQuery] = useState('');

  const segmentUsageCounts = useMemo(() => {
    const counts = new Map();

    for (const seg of selectedSegments) {
      const key = segmentKey(seg.from, seg.to);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return counts;
  }, [selectedSegments]);

  const sortedSegments = useMemo(
    () => [...segments].sort((a, b) => {
      const labelA = `${stationName(a.from_station_id)} ${stationName(a.to_station_id)}`;
      const labelB = `${stationName(b.from_station_id)} ${stationName(b.to_station_id)}`;
      return labelA.localeCompare(labelB, 'it');
    }),
    [segments, stationName]
  );

  const filteredSegments = useMemo(() => {
    if (!filterQuery.trim()) return sortedSegments;
    const query = filterQuery.toLowerCase().trim();
    return sortedSegments.filter(seg => {
      const fromName = stationName(seg.from_station_id).toLowerCase();
      const toName = stationName(seg.to_station_id).toLowerCase();
      return fromName.includes(query) || toName.includes(query);
    });
  }, [sortedSegments, filterQuery, stationName]);

  // Float selected segments to the top of the list
  const finalSegments = useMemo(() => {
    return [...filteredSegments].sort((a, b) => {
      const isSelectedA = (segmentUsageCounts.get(segmentKey(a.from_station_id, a.to_station_id)) ?? 0) > 0;
      const isSelectedB = (segmentUsageCounts.get(segmentKey(b.from_station_id, b.to_station_id)) ?? 0) > 0;

      if (isSelectedA && !isSelectedB) return -1;
      if (!isSelectedA && isSelectedB) return 1;
      
      const labelA = `${stationName(a.from_station_id)} ${stationName(a.to_station_id)}`;
      const labelB = `${stationName(b.from_station_id)} ${stationName(b.to_station_id)}`;
      return labelA.localeCompare(labelB, 'it');
    });
  }, [filteredSegments, segmentUsageCounts, stationName]);

  return (
    <div className="surface-card surface-card--flat segment-panel d-flex flex-column">
      <div className="d-flex align-items-center justify-content-between gap-2 border-bottom pb-2 mb-2">
        <h5 className="mb-0 fw-bold">Segmenti disponibili</h5>
        <span className="badge bg-light text-dark border">
          {filterQuery.trim() ? `${finalSegments.length}/${sortedSegments.length}` : sortedSegments.length}
        </span>
      </div>

      <div className="position-relative mb-2">
        <label className="visually-hidden" htmlFor="segment-search">Cerca una stazione</label>
        <i className="bi bi-search segment-search-icon" aria-hidden="true" />
        <input
          id="segment-search"
          type="text"
          className="form-control form-control-sm segment-search-input"
          placeholder="Cerca stazione (es. Châtelet)..."
          value={filterQuery}
          onChange={e => setFilterQuery(e.target.value)}
        />
        {filterQuery && (
          <button
            type="button"
            className="btn btn-sm segment-search-clear"
            onClick={() => setFilterQuery('')}
            aria-label="Pulisci ricerca"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="list-group segment-list overflow-auto flex-grow-1">
        {finalSegments.length === 0 ? (
          <div className="text-center py-3 text-muted small italic">
            Nessun segmento trovato per "{filterQuery}"
          </div>
        ) : (
          finalSegments.map(seg => {
            const fromName = stationName(seg.from_station_id);
            const toName = stationName(seg.to_station_id);
            const isSelected = (segmentUsageCounts.get(segmentKey(seg.from_station_id, seg.to_station_id)) ?? 0) > 0;

            return (
              <button
                key={segmentKey(seg.from_station_id, seg.to_station_id)}
                type="button"
                className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between gap-2 py-2 ${isSelected ? 'is-selected' : ''}`}
                onClick={() => onSegmentSelect(seg)}
                onMouseEnter={() => onSegmentHover?.(seg)}
                onMouseLeave={() => onSegmentHover?.(null)}
                aria-pressed={isSelected}
              >
                <span className="text-start small fw-semibold">
                  {fromName} - {toName}
                </span>
                {isSelected && (
                  <span className="badge bg-warning text-dark flex-shrink-0">
                    <i className="bi bi-check-lg me-1" aria-hidden="true" />
                    Selezionato
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
