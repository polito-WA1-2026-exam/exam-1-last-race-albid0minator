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

export async function getGamesByUserPaged(userId, limit, offset) {
  return dbAll(`
    SELECT g.id, g.score, g.valid, g.played_at,
           s1.name as start_station_name,
           s2.name as end_station_name
    FROM games g
    JOIN stations s1 ON g.start_station_id = s1.id
    JOIN stations s2 ON g.end_station_id = s2.id
    WHERE g.user_id = ?
    ORDER BY g.played_at DESC
    LIMIT ? OFFSET ?
  `, [userId, limit, offset]);
}

export async function countGamesByUser(userId) {
  const result = await dbGet('SELECT COUNT(*) as total FROM games WHERE user_id = ?', [userId]);
  return result ? result.total : 0;
}

// --- Classifica ---

export async function getRanking() {
  return dbAll(`
    SELECT u.id as user_id, u.name, MAX(g.score) as best_score, COUNT(*) as games_played
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
