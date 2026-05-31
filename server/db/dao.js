import { dbGet, dbAll, dbRun } from './db.js';

// --- Rete ---

export async function getLines() {
  return dbAll('SELECT id, name, color FROM lines ORDER BY id');
}

export async function getStations() {
  return dbAll('SELECT id, name, x, y, is_interchange FROM stations ORDER BY id');
}

export async function getStationLines() {
  return dbAll('SELECT id, station_id, line_id, position FROM station_lines ORDER BY line_id, position');
}

// --- Utenti ---

export async function getUserByEmail(email) {
  return dbGet('SELECT * FROM users WHERE email = ?', [email]);
}

// --- Partite ---

export async function createGame(userId, startStationId, endStationId, score, valid) {
  const result = await dbRun(
    'INSERT INTO games (user_id, start_station_id, end_station_id, score, valid) VALUES (?, ?, ?, ?, ?)',
    [userId, startStationId, endStationId, score, valid]
  );
  return result.lastID;
}

export async function addGameStep(gameId, stepOrder, fromStationId, toStationId, eventId, coinsAfter) {
  return dbRun(
    'INSERT INTO game_steps (game_id, step_order, from_station_id, to_station_id, event_id, coins_after) VALUES (?, ?, ?, ?, ?, ?)',
    [gameId, stepOrder, fromStationId, toStationId, eventId, coinsAfter]
  );
}

export async function getGamesByUser(userId) {
  return dbAll(
    'SELECT id, start_station_id, end_station_id, score, valid, played_at FROM games WHERE user_id = ? ORDER BY played_at DESC',
    [userId]
  );
}

// --- Classifica ---

export async function getRanking() {
  return dbAll(`
    SELECT u.id as user_id, u.name, MAX(g.score) as best_score
    FROM games g
    JOIN users u ON u.id = g.user_id
    WHERE g.valid = 1
    GROUP BY g.user_id
    ORDER BY best_score DESC
  `);
}

// --- Eventi ---

export async function getEvents() {
  return dbAll('SELECT id, description, effect FROM events ORDER BY id');
}
