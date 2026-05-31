import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { getStations, getStationLines, getEvents, createGame, addGameStep } from '../db/dao.js';
import { isLoggedIn } from '../middleware/index.js';

const router = Router();

// BFS per calcolare la distanza minima in fermate tra due stazioni nel grafo della rete.
// Restituisce il numero di fermate (archi), o Infinity se non raggiungibile.
function bfsDistance(adjacency, start, end) {
  if (start === end) return 0;
  const visited = new Set([start]);
  const queue = [{ id: start, dist: 0 }];
  while (queue.length > 0) {
    const { id, dist } = queue.shift();
    for (const neighbor of (adjacency.get(id) ?? [])) {
      if (neighbor === end) return dist + 1;
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ id: neighbor, dist: dist + 1 });
      }
    }
  }
  return Infinity;
}

// Costruisce il grafo di adiacenza e le strutture di lookup.
// Usa il flag is_interchange dalla stazione (non derivato dal conteggio linee)
// per preservare le "trap" stations: su 2+ linee ma senza diritto di cambio.
function buildGraph(stations, stationLines) {
  const adjacency = new Map();    // stationId → Set<neighborId>
  const segmentLines = new Map(); // "minId-maxId" → Set<lineId>

  const byLine = new Map();
  for (const sl of stationLines) {
    if (!byLine.has(sl.line_id)) byLine.set(sl.line_id, []);
    byLine.get(sl.line_id).push(sl);
  }

  for (const [lineId, entries] of byLine) {
    const sorted = entries.slice().sort((a, b) => a.position - b.position);
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i].station_id;
      const b = sorted[i + 1].station_id;

      if (!adjacency.has(a)) adjacency.set(a, new Set());
      if (!adjacency.has(b)) adjacency.set(b, new Set());
      adjacency.get(a).add(b);
      adjacency.get(b).add(a);

      const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
      if (!segmentLines.has(key)) segmentLines.set(key, new Set());
      segmentLines.get(key).add(lineId);
    }
  }

  const interchanges = new Set(
    stations.filter(s => s.is_interchange).map(s => s.id)
  );

  return { adjacency, segmentLines, interchanges };
}

// Assegna start e end casuali con distanza minima >= 3.
function pickStartEnd(stationIds, adjacency) {
  const ids = [...stationIds];
  const candidates = [];
  for (const s of ids) {
    for (const e of ids) {
      if (s !== e && bfsDistance(adjacency, s, e) >= 3) {
        candidates.push([s, e]);
      }
    }
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// Valida il percorso inviato dal client.
// Restituisce true se valido, false altrimenti.
function validatePath(segments, startId, endId, segmentLines, interchanges) {
  if (!segments || segments.length === 0) return false;
  if (segments[0].from !== startId) return false;
  if (segments[segments.length - 1].to !== endId) return false;

  // Verifica continuità
  for (let i = 1; i < segments.length; i++) {
    if (segments[i].from !== segments[i - 1].to) return false;
  }

  let currentLine = null;
  for (const seg of segments) {
    const key = `${Math.min(seg.from, seg.to)}-${Math.max(seg.from, seg.to)}`;
    const lines = segmentLines.get(key);
    if (!lines || lines.size === 0) return false; // segmento non esiste

    if (currentLine === null) {
      // Primo segmento: scegli una linea qualsiasi
      currentLine = [...lines][0];
    } else if (lines.has(currentLine)) {
      // La linea corrente copre ancora il segmento → ok
    } else {
      // Cambio linea: solo se from è interscambio
      if (!interchanges.has(seg.from)) return false;
      const newLine = [...lines][0];
      currentLine = newLine;
    }
  }
  return true;
}

// POST /api/games — avvia una nuova partita, assegna start e end
router.post('/games', isLoggedIn, async (req, res, next) => {
  try {
    const [stations, stationLines] = await Promise.all([getStations(), getStationLines()]);
    const { adjacency, segmentLines, interchanges } = buildGraph(stations, stationLines);
    const stationIds = new Set(stationLines.map(sl => sl.station_id));
    const pair = pickStartEnd(stationIds, adjacency);
    if (!pair) {
      return res.status(500).json({ error: 'Impossibile assegnare partenza e destinazione.' });
    }
    const [startId, endId] = pair;

    // Salva la partita come pendente (valid=-1 = pending, distinto da valid=0 = invalida)
    const gameId = await createGame(req.user.id, startId, endId, 0, -1);

    return res.status(201).json({ gameId, startStationId: startId, endStationId: endId });
  } catch (err) {
    return next(err);
  }
});

// POST /api/games/:id/submit — riceve il percorso, valida, esegue, salva
router.post(
  '/games/:id/submit',
  isLoggedIn,
  body('segments').isArray().withMessage('Percorso mancante.'),
  body('segments.*.from').isInt({ min: 1 }).withMessage('Stazione non valida.'),
  body('segments.*.to').isInt({ min: 1 }).withMessage('Stazione non valida.'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const gameId = parseInt(req.params.id, 10);
    if (isNaN(gameId)) return res.status(400).json({ error: 'ID partita non valido.' });

    try {
      const { dbGet, dbRun } = await import('../db/db.js');

      // Recupera la partita e verifica che appartenga all'utente corrente
      const game = await dbGet(
        'SELECT * FROM games WHERE id = ? AND user_id = ?',
        [gameId, req.user.id]
      );
      if (!game) return res.status(404).json({ error: 'Partita non trovata.' });
      if (game.valid !== -1) {
        return res.status(409).json({ error: 'Partita già completata.' });
      }

      const [stations, stationLines] = await Promise.all([getStations(), getStationLines()]);
      const { segmentLines, interchanges } = buildGraph(stations, stationLines);

      const { segments } = req.body;
      const isValid = validatePath(segments, game.start_station_id, game.end_station_id, segmentLines, interchanges);

      if (!isValid) {
        await dbRun('UPDATE games SET valid = 0, score = 0 WHERE id = ?', [gameId]);
        return res.json({ valid: false, steps: [], finalScore: 0 });
      }

      // Percorso valido: esegui simulazione con eventi casuali
      const events = await getEvents();
      let coins = 20;
      const steps = [];

      for (let i = 0; i < segments.length; i++) {
        const event = events[Math.floor(Math.random() * events.length)];
        coins += event.effect;
        const coinsAfter = Math.max(0, coins);
        await addGameStep(gameId, i + 1, segments[i].from, segments[i].to, event.id, coinsAfter);
        steps.push({
          stepOrder: i + 1,
          fromStationId: segments[i].from,
          toStationId: segments[i].to,
          event: { id: event.id, description: event.description, effect: event.effect },
          coinsAfter,
        });
        coins = coinsAfter; // propaga il valore clampato
      }

      const finalScore = coins;
      await dbRun('UPDATE games SET valid = 1, score = ? WHERE id = ?', [finalScore, gameId]);

      return res.json({ valid: true, steps, finalScore });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
