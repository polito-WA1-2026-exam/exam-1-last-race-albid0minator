import { getStations, getStationLines, getEvents, createGame, addGameStep } from '../db/dao.js';
import { dbGet, dbRun } from '../db/db.js';
import {
  buildGraphLookups,
  orientSegmentsForPath,
  validatePath,
} from '../lib/pathValidation.js';

// BFS per calcolare le distanze minime da una stazione di partenza a tutte le altre stazioni raggiungibili.
// Restituisce una Map con stationId → distanza (in fermate).
function bfsAllDistances(adjacency, start) {
  const distances = new Map();
  distances.set(start, 0);
  const queue = [start];
  while (queue.length > 0) {
    const curr = queue.shift();
    const currDist = distances.get(curr);
    for (const neighbor of (adjacency.get(curr) ?? [])) {
      if (!distances.has(neighbor)) {
        distances.set(neighbor, currDist + 1);
        queue.push(neighbor);
      }
    }
  }
  return distances;
}

// Costruisce il grafo di adiacenza (per BFS start/end).
function buildAdjacency(stationLines) {
  const adjacency = new Map();
  const byLine = new Map();

  for (const sl of stationLines) {
    if (!byLine.has(sl.line_id)) byLine.set(sl.line_id, []);
    byLine.get(sl.line_id).push(sl);
  }

  for (const [, entries] of byLine) {
    const sorted = entries.slice().sort((a, b) => a.position - b.position);
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i].station_id;
      const b = sorted[i + 1].station_id;

      if (!adjacency.has(a)) adjacency.set(a, new Set());
      if (!adjacency.has(b)) adjacency.set(b, new Set());
      adjacency.get(a).add(b);
      adjacency.get(b).add(a);
    }
  }

  return adjacency;
}

// Assegna start e end casuali con distanza minima >= 3.
function pickStartEnd(stationIds, adjacency) {
  const candidates = [];
  for (const s of stationIds) {
    const distances = bfsAllDistances(adjacency, s);
    for (const [e, dist] of distances.entries()) {
      if (dist >= 3) {
        candidates.push([s, e]);
      }
    }
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Avvia una nuova partita per l'utente specificato.
 * Assegna una coppia di stazioni start/end valida e salva la partita nel DB come pendente.
 */
export async function startNewGame(userId) {
  const [stations, stationLines] = await Promise.all([getStations(), getStationLines()]);
  const adjacency = buildAdjacency(stationLines);
  const stationIds = new Set(stationLines.map(sl => sl.station_id));
  const pair = pickStartEnd(stationIds, adjacency);
  if (!pair) {
    throw new Error('Impossibile assegnare partenza e destinazione.');
  }
  const [startId, endId] = pair;

  const gameId = await createGame(userId, startId, endId, 0, -1);
  return { gameId, startStationId: startId, endStationId: endId };
}

/**
 * Valida il percorso di una partita, esegue la simulazione degli imprevisti e aggiorna i risultati sul DB.
 */
export async function submitGameRoute(userId, gameId, segments) {
  // Recupera la partita e verifica che appartenga all'utente
  const game = await dbGet(
    'SELECT * FROM games WHERE id = ? AND user_id = ?',
    [gameId, userId]
  );
  if (!game) {
    const err = new Error('Partita non trovata.');
    err.status = 404;
    throw err;
  }
  if (game.valid !== -1) {
    const err = new Error('Partita già completata.');
    err.status = 409;
    throw err;
  }

  const [stations, stationLines] = await Promise.all([getStations(), getStationLines()]);
  const { segmentLines, interchanges } = buildGraphLookups(stations, stationLines);

  const orientedSegments = orientSegmentsForPath(segments, game.start_station_id);
  const isValid = orientedSegments !== null
    && validatePath(
      orientedSegments,
      game.start_station_id,
      game.end_station_id,
      segmentLines,
      interchanges
    );

  if (!isValid) {
    await dbRun('UPDATE games SET valid = 0, score = 0 WHERE id = ?', [gameId]);
    return { valid: false, steps: [], finalScore: 0 };
  }

  // Percorso valido: esegui simulazione con eventi casuali
  const events = await getEvents();
  let coins = 20;
  const steps = [];

  for (let i = 0; i < orientedSegments.length; i++) {
    const event = events[Math.floor(Math.random() * events.length)];
    coins += event.effect;
    const coinsAfter = Math.max(0, coins);
    await addGameStep(gameId, i + 1, orientedSegments[i].from, orientedSegments[i].to, event.id, coinsAfter);
    steps.push({
      stepOrder: i + 1,
      fromStationId: orientedSegments[i].from,
      toStationId: orientedSegments[i].to,
      event: { id: event.id, description: event.description, effect: event.effect },
      coinsAfter,
    });
    coins = coinsAfter;
  }

  const finalScore = coins;
  await dbRun('UPDATE games SET valid = 1, score = ? WHERE id = ?', [finalScore, gameId]);

  return { valid: true, steps, finalScore };
}
