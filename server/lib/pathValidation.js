/** @typedef {{ from: number, to: number }} PathSegment */

export function stationId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function segmentKey(from, to) {
  const a = stationId(from);
  const b = stationId(to);
  if (a === null || b === null) return null;
  return `${Math.min(a, b)}-${Math.max(a, b)}`;
}

/**
 * Orienta i segmenti in sequenza partendo dalla stazione di partenza.
 * A↔B è indifferente per ogni passo: conta la continuità con l'ancora.
 */
export function orientSegmentsForPath(segments, startId) {
  const start = stationId(startId);
  if (!segments?.length || start === null) return null;

  const oriented = [];
  for (let i = 0; i < segments.length; i++) {
    const a = stationId(segments[i].from);
    const b = stationId(segments[i].to);
    if (a === null || b === null) return null;

    const anchor = i === 0 ? start : oriented[i - 1].to;
    if (a === anchor) oriented.push({ from: a, to: b });
    else if (b === anchor) oriented.push({ from: b, to: a });
    else return null;
  }
  return oriented;
}

/**
 * Verifica se esiste un'assegnazione di linea per ogni segmento
 * (stessa linea in continuità, oppure cambio solo alle interscambi).
 */
function canAssignLines(segments, segmentLines, interchanges) {
  const lineOptions = segments.map(seg => {
    const key = segmentKey(seg.from, seg.to);
    if (!key) return [];
    const lines = segmentLines.get(key);
    return lines ? [...lines] : [];
  });

  if (lineOptions.some(opts => opts.length === 0)) return false;

  function dfs(index, activeLine) {
    if (index === segments.length) return true;

    for (const lineId of lineOptions[index]) {
      if (index === 0) {
        if (dfs(index + 1, lineId)) return true;
      } else {
        const departStation = segments[index].from;
        if (lineId === activeLine) {
          if (dfs(index + 1, lineId)) return true;
        } else if (interchanges.has(departStation)) {
          if (dfs(index + 1, lineId)) return true;
        }
      }
    }
    return false;
  }

  return dfs(0, null);
}

/**
 * Valida il percorso orientato: start/end, continuità, segmenti unici, linee metro.
 */
export function validatePath(segments, startId, endId, segmentLines, interchanges) {
  const start = stationId(startId);
  const end = stationId(endId);
  if (!segments?.length || start === null || end === null) return false;
  if (segments[0].from !== start) return false;
  if (segments[segments.length - 1].to !== end) return false;

  for (let i = 1; i < segments.length; i++) {
    if (segments[i].from !== segments[i - 1].to) return false;
  }

  const usedSegments = new Set();
  for (const seg of segments) {
    const key = segmentKey(seg.from, seg.to);
    if (!key || usedSegments.has(key)) return false;
    usedSegments.add(key);
  }

  return canAssignLines(segments, segmentLines, interchanges);
}

export function buildGraphLookups(stations, stationLines) {
  const segmentLines = new Map();
  const byLine = new Map();

  for (const sl of stationLines) {
    if (!byLine.has(sl.line_id)) byLine.set(sl.line_id, []);
    byLine.get(sl.line_id).push(sl);
  }

  for (const [lineId, entries] of byLine) {
    const sorted = entries.slice().sort((a, b) => a.position - b.position);
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = stationId(sorted[i].station_id);
      const b = stationId(sorted[i + 1].station_id);
      if (a === null || b === null) continue;

      const key = segmentKey(a, b);
      if (!segmentLines.has(key)) segmentLines.set(key, new Set());
      segmentLines.get(key).add(lineId);
    }
  }

  const interchanges = new Set(
    stations
      .filter(s => Number(s.is_interchange) === 1)
      .map(s => stationId(s.id))
      .filter(id => id !== null)
  );

  return { segmentLines, interchanges };
}