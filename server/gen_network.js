import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── STATIONS DATA & COORDINATES ──────────────────────────────────────────────
const STATIONS_METADATA = [
  { id: 1, name: 'Châtelet', type: 'center', r: 0, theta: 0 },
  
  // Inner Ring (R = 100)
  { id: 2, name: 'Louvre - Rivoli', type: 'inner', r: 100, theta: 0 },
  { id: 3, name: 'Palais Royal', type: 'inner', r: 100, theta: 45 },
  { id: 4, name: 'Tuileries', type: 'inner', r: 100, theta: 90 },
  { id: 5, name: 'Concorde', type: 'inner', r: 100, theta: 135 },
  { id: 6, name: 'Cité', type: 'inner', r: 100, theta: 180 },
  { id: 7, name: 'Bastille', type: 'inner', r: 100, theta: 225 },
  { id: 8, name: 'République', type: 'inner', r: 100, theta: 270 },
  { id: 9, name: 'Belleville', type: 'inner', r: 100, theta: 315 },
  
  // Outer Ring (R = 200)
  { id: 10, name: 'Opéra', type: 'outer', r: 200, theta: 0 },
  { id: 18, name: 'Nation', type: 'outer', r: 200, theta: 22.5 },
  { id: 11, name: 'Saint-Paul', type: 'outer', r: 200, theta: 45 },
  { id: 12, name: 'Hôtel de Ville', type: 'outer', r: 200, theta: 90 },
  { id: 19, name: 'Pigalle', type: 'outer', r: 200, theta: 112.5 },
  { id: 13, name: 'Rambuteau', type: 'outer', r: 200, theta: 135 },
  { id: 14, name: 'Pont Neuf', type: 'outer', r: 200, theta: 180 },
  { id: 20, name: 'Montmartre', type: 'outer', r: 200, theta: 202.5 },
  { id: 15, name: 'Madeleine', type: 'outer', r: 200, theta: 225 },
  { id: 16, name: 'Gare de Lyon', type: 'outer', r: 200, theta: 270 },
  { id: 17, name: 'Bercy', type: 'outer', r: 200, theta: 315 },

  // Suburban Stations (R = 280)
  { id: 21, name: 'La Défense', type: 'suburban', r: 280, theta: 180 },
  { id: 22, name: 'Château de Vincennes', type: 'suburban', r: 280, theta: 0 },
  { id: 23, name: 'Mairie de Clichy', type: 'suburban', r: 280, theta: 270 },
  { id: 24, name: 'Mairie d\'Ivry', type: 'suburban', r: 280, theta: 90 },
  { id: 25, name: 'Pont de Neuilly', type: 'suburban', r: 280, theta: 225 },
  { id: 26, name: 'Gallieni', type: 'suburban', r: 280, theta: 45 },
  { id: 27, name: 'Basilique de Saint-Denis', type: 'suburban', r: 280, theta: 315 },
  { id: 28, name: 'Pont de Sèvres', type: 'suburban', r: 280, theta: 135 }
];

function getCoords(r, thetaDeg) {
  // Centro dello schermo impostato a (400, 240) per centrare in un viewport 800x480
  const thetaRad = (thetaDeg * Math.PI) / 180;
  const x = Math.round(400 + r * Math.cos(thetaRad));
  const y = Math.round(240 + r * Math.sin(thetaRad));
  return { x, y };
}

// ─── BFS CON VINCOLO CAMBIO-LINEA ────────────────────────────────────────────
function findValidPaths(net, startId, endId) {
  const { stations, stationLines, segments } = net;
  const stMap = Object.fromEntries(stations.map(s => [s.id, s]));

  const adj = {};
  for (const s of stations) adj[s.id] = [];
  for (const seg of segments) {
    const lid = segLine(stationLines, seg.from_station_id, seg.to_station_id);
    if (lid == null) continue;
    adj[seg.from_station_id].push({ nb: seg.to_station_id, lid });
    adj[seg.to_station_id].push({ nb: seg.from_station_id, lid });
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

// ─── GENERATORE PRINCIPALE ──────────────────────────────────────────────────
function generate() {
  const stations = STATIONS_METADATA.map(s => {
    const coords = getCoords(s.r, s.theta);
    return {
      id: s.id,
      name: s.name,
      x: coords.x,
      y: coords.y,
      is_interchange: false // Verrà calcolato alla fine in base alle linee
    };
  });

  const lines = [
    { id: 1, name: 'Rossa', color: '#E53935' },
    { id: 2, name: 'Verde', color: '#43A047' },
    { id: 3, name: 'Blu', color: '#1E88E5' },
    { id: 4, name: 'Indaco', color: '#3F51B5' },
    { id: 5, name: 'Gialla', color: '#FDD835' },
    { id: 6, name: 'Viola', color: '#8E24AA' },
    { id: 7, name: 'Arancione', color: '#FB8C00' },
    { id: 8, name: 'Azzurra', color: '#00ACC1' }
  ];

  const stationLines = [];

  function addLineRoute(lineId, stationIds) {
    stationIds.forEach((sid, pos) => {
      stationLines.push({ station_id: sid, line_id: lineId, position: pos + 1 });
    });
  }

  // 1. Linee Radiali (attraversano il centro Châtelet ed estendono oltre la periferia)
  // Line 1 (Rossa): La Défense ➔ Pont Neuf ➔ Cité ➔ Châtelet ➔ Louvre - Rivoli ➔ Opéra ➔ Château de Vincennes
  addLineRoute(1, [21, 14, 6, 1, 2, 10, 22]);

  // Line 2 (Verde): Mairie de Clichy ➔ Gare de Lyon ➔ République ➔ Châtelet ➔ Tuileries ➔ Hôtel de Ville ➔ Mairie d'Ivry
  addLineRoute(2, [23, 16, 8, 1, 4, 12, 24]);

  // Line 3 (Blu): Pont de Neuilly ➔ Madeleine ➔ Bastille ➔ Châtelet ➔ Palais Royal ➔ Saint-Paul ➔ Gallieni
  addLineRoute(3, [25, 15, 7, 1, 3, 11, 26]);

  // Line 4 (Indaco): Basilique de Saint-Denis ➔ Bercy ➔ Belleville ➔ Châtelet ➔ Concorde ➔ Rambuteau ➔ Pont de Sèvres
  addLineRoute(4, [27, 17, 9, 1, 5, 13, 28]);

  // 2. Linee Orbitali (Cerchi concentrici)
  // Line 5 (Gialla, Anello Interno): Louvre ➔ Palais Royal ➔ Tuileries ➔ Concorde ➔ Cité ➔ Bastille ➔ République ➔ Belleville ➔ Louvre
  addLineRoute(5, [2, 3, 4, 5, 6, 7, 8, 9, 2]);

  // Line 6 (Viola, Anello Esterno): Opéra ➔ Nation ➔ Saint-Paul ➔ Hôtel de Ville ➔ Pigalle ➔ Rambuteau ➔ Pont Neuf ➔ Montmartre ➔ Madeleine ➔ Gare de Lyon ➔ Bercy ➔ Opéra
  addLineRoute(6, [10, 18, 11, 12, 19, 13, 14, 20, 15, 16, 17, 10]);

  // 3. Linee di Transizione Diagonale (Ponticelle interne/esterne)
  // Line 7 (Arancione): Nation ➔ Palais Royal ➔ Tuileries ➔ Pigalle
  addLineRoute(7, [18, 3, 4, 19]);

  // Line 8 (Azzurra): Montmartre ➔ Bastille ➔ République ➔ Gare de Lyon
  addLineRoute(8, [20, 7, 8, 16]);

  // Costruiamo i segmenti dai percorsi consecutivi
  const segments = [];
  const addedSegments = new Set();
  
  function addSeg(from, to) {
    const a = Math.min(from, to);
    const b = Math.max(from, to);
    const key = `${a}-${b}`;
    if (!addedSegments.has(key)) {
      addedSegments.add(key);
      segments.push({ from_station_id: a, to_station_id: b });
    }
  }

  const byLine = {};
  for (const sl of stationLines) {
    (byLine[sl.line_id] ??= []).push(sl);
  }
  for (const [lineId, entries] of Object.entries(byLine)) {
    const sorted = [...entries].sort((a, b) => a.position - b.position);
    for (let i = 0; i < sorted.length - 1; i++) {
      addSeg(sorted[i].station_id, sorted[i + 1].station_id);
    }
  }

  // Ricalcoliamo is_interchange: se ha 2 o più linee, è un interscambio
  for (const s of stations) {
    const count = stationLines.filter(sl => sl.station_id === s.id).length;
    s.is_interchange = (count >= 2);
  }

  return { lines, stations, stationLines, segments };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const net = generate();

const startId = 1, endId = 16;
const paths = findValidPaths(net, startId, endId);

// Analizziamo tutte le coppie possibili di stazioni nel net generato per assicurarci la compatibilità con le specifiche del gioco
const validPairs = [];
const stationsList = net.stations;
for (let i = 0; i < stationsList.length; i++) {
  for (let j = 0; j < stationsList.length; j++) {
    if (i === j) continue;
    const s1 = stationsList[i].id;
    const s2 = stationsList[j].id;
    const p = findValidPaths(net, s1, s2);
    if (p.length > 0) {
      const minLen = Math.min(...p.map(path => path.length - 1));
      if (minLen >= 3) {
        validPairs.push({ from: s1, to: s2, dist: minLen });
      }
    }
  }
}

net.startStationId = startId;
net.endStationId = endId;

const outputPath = path.join(__dirname, 'db', 'network.json');
fs.writeFileSync(outputPath, JSON.stringify(net, null, 2));

console.log(`// Mappa Radiale Generata con Successo!`);
console.log(`// Percorsi validi tra 1 e 16 (${paths.length}): ${paths.map(p => p.join('➔')).join(' | ')}`);
console.log(`// Linee totali: ${net.lines.length}`);
console.log(`// Coppie di stazioni valide totali (raggiungibili con distanza >= 3): ${validPairs.length}`);
console.log(`// Salvato correttamente su server/db/network.json`);
