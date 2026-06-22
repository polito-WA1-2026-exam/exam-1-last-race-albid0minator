import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dbExec, dbRun } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function segLine(stationLines, a, b) {
  const byLine = {};
  for (const sl of stationLines) {
    (byLine[sl.line_id] ??= {})[sl.station_id] = sl.position;
  }
  for (const [lid, pos] of Object.entries(byLine)) {
    if (pos[a] != null && pos[b] != null && Math.abs(pos[a] - pos[b]) === 1)
      return Number(lid);
  }
  return null;
}

function findValidPaths(net, startId, endId) {
  const { stations, stationLines } = net;
  const stMap = Object.fromEntries(stations.map(s => [s.id, s]));

  const adj = {};
  for (const s of stations) adj[s.id] = [];

  const byLine = {};
  for (const sl of stationLines) {
    (byLine[sl.line_id] ??= []).push(sl);
  }

  for (const [lineId, entries] of Object.entries(byLine)) {
    const sorted = entries.slice().sort((a, b) => a.position - b.position);
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i].station_id;
      const b = sorted[i + 1].station_id;
      adj[a].push({ nb: b, lid: Number(lineId) });
      adj[b].push({ nb: a, lid: Number(lineId) });
    }
  }

  const startLines = stationLines.filter(sl => sl.station_id === startId).map(sl => sl.line_id);
  const queue   = startLines.map(l => ({ sid: startId, lid: l, path: [startId] }));
  const visited = new Set(startLines.map(l => `${startId}:${l}`));
  const results = [];

  while (queue.length) {
    const { sid, lid, path } = queue.shift();
    if (sid === endId) { results.push(path); continue; }

    for (const { nb, lid: elid } of adj[sid]) {
      if (elid !== lid) continue;
      const key = `${nb}:${elid}`;
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push({ sid: nb, lid: elid, path: [...path, nb] });
    }

    if (stMap[sid]?.is_interchange) {
      for (const sl of stationLines) {
        if (sl.station_id !== sid || sl.line_id === lid) continue;
        const key = `${sid}:${sl.line_id}`;
        if (visited.has(key)) continue;
        visited.add(key);
        queue.push({ sid, lid: sl.line_id, path });
      }
    }
  }
  return results;
}

function scryptHash(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) { reject(error); return; }
      resolve(derivedKey.toString('hex'));
    });
  });
}

async function buildUser(email, name, password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scryptHash(password, salt);
  return { email, name, hash, salt };
}

async function main() {
  // Schema
  await dbExec(`
    DROP TABLE IF EXISTS game_steps;
    DROP TABLE IF EXISTS games;
    DROP TABLE IF EXISTS events;
    DROP TABLE IF EXISTS station_lines;
    DROP TABLE IF EXISTS stations;
    DROP TABLE IF EXISTS lines;
    DROP TABLE IF EXISTS users;

    CREATE TABLE users (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name  TEXT NOT NULL,
      hash  TEXT NOT NULL,
      salt  TEXT NOT NULL
    );

    CREATE TABLE lines (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      name  TEXT UNIQUE NOT NULL,
      color TEXT NOT NULL
    );

    CREATE TABLE stations (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      name           TEXT UNIQUE NOT NULL,
      x              INTEGER NOT NULL,
      y              INTEGER NOT NULL,
      is_interchange INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE station_lines (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      station_id INTEGER NOT NULL REFERENCES stations(id),
      line_id    INTEGER NOT NULL REFERENCES lines(id),
      position   INTEGER NOT NULL,
      UNIQUE(line_id, position)
    );

    CREATE TABLE events (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      effect      INTEGER NOT NULL
    );

    CREATE TABLE games (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id          INTEGER NOT NULL REFERENCES users(id),
      start_station_id INTEGER NOT NULL REFERENCES stations(id),
      end_station_id   INTEGER NOT NULL REFERENCES stations(id),
      score            INTEGER NOT NULL,
      valid            INTEGER NOT NULL,
      played_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE game_steps (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id         INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      step_order      INTEGER NOT NULL,
      from_station_id INTEGER NOT NULL REFERENCES stations(id),
      to_station_id   INTEGER NOT NULL REFERENCES stations(id),
      event_id        INTEGER NOT NULL REFERENCES events(id),
      coins_after     INTEGER NOT NULL
    );
  `);

  // --- Users ---
  const usersData = [
    await buildUser('a@a.it', 'Alice', 'aaa'),
    await buildUser('b@b.it', 'Bob', 'bbb'),
    await buildUser('c@c.it', 'Carol', 'ccc'),
  ];
  for (const u of usersData) {
    await dbRun('INSERT INTO users (email, name, hash, salt) VALUES (?, ?, ?, ?)',
      [u.email, u.name, u.hash, u.salt]);
  }

  // --- Lines ---
  const networkPath = path.join(__dirname, 'network.json');
  const network = JSON.parse(fs.readFileSync(networkPath, 'utf8'));

  for (const l of network.lines) {
    await dbRun('INSERT INTO lines (id, name, color) VALUES (?, ?, ?)', [l.id, l.name, l.color]);
  }

  // --- Stations ---
  for (const s of network.stations) {
    await dbRun('INSERT INTO stations (id, name, x, y, is_interchange) VALUES (?, ?, ?, ?, ?)',
      [s.id, s.name, s.x, s.y, s.is_interchange ? 1 : 0]);
  }

  // --- Station_lines ---
  for (const sl of network.stationLines) {
    await dbRun('INSERT INTO station_lines (station_id, line_id, position) VALUES (?, ?, ?)',
      [sl.station_id, sl.line_id, sl.position]);
  }

  // --- Events ---
  const events = [
    { description: 'Viaggio tranquillo, nessuna sorpresa',   effect:  0 },
    { description: 'Binario sbagliato, ritardo',             effect: -2 },
    { description: 'Passeggero gentile ti cede il posto',    effect: +1 },
    { description: 'Sciopero parziale, corsa saltata',       effect: -4 },
    { description: 'Trovato portafoglio, ricompensa',        effect: +3 },
    { description: 'Coincidenza perfetta, guadagni tempo',   effect: +2 },
    { description: 'Traffico intenso, percorso più lungo',   effect: -1 },
    { description: 'Controllore amichevole, nessuna multa',  effect: +4 },
    { description: 'Guasto tecnico, ritardo prolungato',     effect: -3 },
  ];
  for (const e of events) {
    await dbRun('INSERT INTO events (description, effect) VALUES (?, ?)', [e.description, e.effect]);
  }

  // --- Games & game_steps per Alice (user_id=1) ---
  const paths = findValidPaths(network, network.startStationId, network.endStationId);
  const chosenPath1 = paths[0];
  const chosenPath2 = paths[1] || paths[0];

  // Partita 1 di Alice
  let aliceCoins1 = 20;
  const aliceSteps1 = [];
  const eventEffects = [0, -2, 1, -4, 3, 2, -1, 4];
  for (let i = 0; i < chosenPath1.length - 1; i++) {
    const from = chosenPath1[i];
    const to = chosenPath1[i + 1];
    const eventId = (i % 8) + 1;
    const effect = eventEffects[eventId - 1];
    aliceCoins1 = Math.max(0, aliceCoins1 + effect);
    aliceSteps1.push({ step_order: i + 1, from, to, event_id: eventId, coins_after: aliceCoins1 });
  }

  const g1 = await dbRun(
    'INSERT INTO games (user_id, start_station_id, end_station_id, score, valid) VALUES (?, ?, ?, ?, ?)',
    [1, network.startStationId, network.endStationId, aliceCoins1, 1]
  );
  for (const step of aliceSteps1) {
    await dbRun(
      'INSERT INTO game_steps (game_id, step_order, from_station_id, to_station_id, event_id, coins_after) VALUES (?, ?, ?, ?, ?, ?)',
      [g1.lastID, step.step_order, step.from, step.to, step.event_id, step.coins_after]
    );
  }

  // Partita 2 di Alice
  let aliceCoins2 = 20;
  const aliceSteps2 = [];
  for (let i = 0; i < chosenPath2.length - 1; i++) {
    const from = chosenPath2[i];
    const to = chosenPath2[i + 1];
    const eventId = ((i + 3) % 8) + 1;
    const effect = eventEffects[eventId - 1];
    aliceCoins2 = Math.max(0, aliceCoins2 + effect);
    aliceSteps2.push({ step_order: i + 1, from, to, event_id: eventId, coins_after: aliceCoins2 });
  }

  const g2 = await dbRun(
    'INSERT INTO games (user_id, start_station_id, end_station_id, score, valid) VALUES (?, ?, ?, ?, ?)',
    [1, network.startStationId, network.endStationId, aliceCoins2, 1]
  );
  for (const step of aliceSteps2) {
    await dbRun(
      'INSERT INTO game_steps (game_id, step_order, from_station_id, to_station_id, event_id, coins_after) VALUES (?, ?, ?, ?, ?, ?)',
      [g2.lastID, step.step_order, step.from, step.to, step.event_id, step.coins_after]
    );
  }

  // --- Games per Bob (user_id=2) ---
  let bobCoins = 20;
  const bobSteps = [];
  for (let i = 0; i < chosenPath1.length - 1; i++) {
    const from = chosenPath1[i];
    const to = chosenPath1[i + 1];
    const eventId = ((i + 5) % 8) + 1;
    const effect = eventEffects[eventId - 1];
    bobCoins = Math.max(0, bobCoins + effect);
    bobSteps.push({ step_order: i + 1, from, to, event_id: eventId, coins_after: bobCoins });
  }

  const g3 = await dbRun(
    'INSERT INTO games (user_id, start_station_id, end_station_id, score, valid) VALUES (?, ?, ?, ?, ?)',
    [2, network.startStationId, network.endStationId, bobCoins, 1]
  );
  for (const step of bobSteps) {
    await dbRun(
      'INSERT INTO game_steps (game_id, step_order, from_station_id, to_station_id, event_id, coins_after) VALUES (?, ?, ?, ?, ?, ?)',
      [g3.lastID, step.step_order, step.from, step.to, step.event_id, step.coins_after]
    );
  }

  // Partita 2 Bob: percorso invalido
  await dbRun(
    'INSERT INTO games (user_id, start_station_id, end_station_id, score, valid) VALUES (?, ?, ?, ?, ?)',
    [2, network.startStationId, network.endStationId, 0, 0]
  );

  // --- Game per Carol (user_id=3), così anche il terzo utente compare in classifica ---
  let carolCoins = 20;
  const carolSteps = [];
  for (let i = 0; i < chosenPath2.length - 1; i++) {
    const from = chosenPath2[i];
    const to = chosenPath2[i + 1];
    const eventId = ((i + 1) % 8) + 1;
    const effect = eventEffects[eventId - 1];
    carolCoins = Math.max(0, carolCoins + effect);
    carolSteps.push({ step_order: i + 1, from, to, event_id: eventId, coins_after: carolCoins });
  }

  const g4 = await dbRun(
    'INSERT INTO games (user_id, start_station_id, end_station_id, score, valid) VALUES (?, ?, ?, ?, ?)',
    [3, network.startStationId, network.endStationId, carolCoins, 1]
  );
  for (const step of carolSteps) {
    await dbRun(
      'INSERT INTO game_steps (game_id, step_order, from_station_id, to_station_id, event_id, coins_after) VALUES (?, ?, ?, ?, ?, ?)',
      [g4.lastID, step.step_order, step.from, step.to, step.event_id, step.coins_after]
    );
  }

}

main().catch(error => {
  console.error('Errore init_db:', error);
  process.exitCode = 1;
});
