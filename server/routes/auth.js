import { Router } from 'express';
import passport from 'passport';

const router = Router();

router.get('/sessions/current', (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ loggedIn: false, user: null });
  }
  return res.json({ loggedIn: true, user: req.user });
});

router.post('/sessions', (req, res, next) => {
  passport.authenticate('local', (error, user, info) => {
    if (error) {
      return next(error);
    }
    if (!user) {
      return res.status(401).json({ message: info?.message ?? 'Credenziali non valide.' });
    }
    req.login(user, loginError => {
      if (loginError) {
        return next(loginError);
      }
      return res.json({ loggedIn: true, user });
    });
  })(req, res, next);
});

router.delete('/sessions/current', (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(204).end();
  }
  req.logout(error => {
    if (error) {
      return next(error);
    }
    req.session.destroy(sessionError => {
      if (sessionError) {
        return next(sessionError);
      }
      res.clearCookie('connect.sid');
      return res.status(204).end();
    });
  });
});

export default router;
