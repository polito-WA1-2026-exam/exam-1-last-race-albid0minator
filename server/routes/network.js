import { Router } from 'express';
import { getLines, getStations, getStationLines, getEvents } from '../db/dao.js';
import { isLoggedIn } from '../middleware/index.js';

const router = Router();

router.get('/network', isLoggedIn, async (req, res, next) => {
  try {
    const [lines, stations, stationLines] = await Promise.all([
      getLines(),
      getStations(),
      getStationLines(),
    ]);

    // Deriva i segmenti da station_lines: coppie di stazioni adiacenti sulla stessa linea
    const segmentMap = new Map();
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
        const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
        if (!segmentMap.has(key)) {
          segmentMap.set(key, { from_station_id: Math.min(a, b), to_station_id: Math.max(a, b) });
        }
      }
    }
    const segments = Array.from(segmentMap.values());

    return res.json({ lines, stations, stationLines, segments });
  } catch (err) {
    return next(err);
  }
});

router.get('/ranking', isLoggedIn, async (req, res, next) => {
  try {
    const { getRanking } = await import('../db/dao.js');
    const ranking = await getRanking();
    return res.json(ranking);
  } catch (err) {
    return next(err);
  }
});

router.get('/events', isLoggedIn, async (req, res, next) => {
  try {
    const events = await getEvents();
    return res.json(events);
  } catch (err) {
    return next(err);
  }
});

export default router;
