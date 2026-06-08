import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { getGamesByUserPaged, countGamesByUser } from '../db/dao.js';
import { isLoggedIn } from '../middleware/index.js';
import * as gameService from '../services/gameService.js';

const router = Router();

// POST /api/games — avvia una nuova partita, assegna start e end
router.post('/games', isLoggedIn, async (req, res, next) => {
  try {
    const gameData = await gameService.startNewGame(req.user.id);
    return res.status(201).json(gameData);
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
      const result = await gameService.submitGameRoute(req.user.id, gameId, req.body.segments);
      return res.json(result);
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      return next(err);
    }
  }
);

// GET /api/games — recupera lo storico delle ultime partite dell'utente loggato con paginazione
router.get('/games', isLoggedIn, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 25); // cap at 50, default 25
    const offset = (page - 1) * limit;

    const [games, total] = await Promise.all([
      getGamesByUserPaged(req.user.id, limit, offset),
      countGamesByUser(req.user.id)
    ]);

    return res.json({
      games,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
