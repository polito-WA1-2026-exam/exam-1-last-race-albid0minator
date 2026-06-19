import cors from 'cors';
import express from 'express';
import session from 'express-session';
import morgan from 'morgan';
import passport from 'passport';
import { configurePassport } from './config/passport.js';
import authRouter from './routes/auth.js';
import networkRouter from './routes/network.js';
import gameRouter from './routes/game.js';

const app = express();
const PORT = process.env.PORT ?? 3001;
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'replace-this-secret-in-production';

configurePassport(passport);

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true
  })
);
app.use(express.json());
app.use(morgan('dev'));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax'
    }
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use('/api', authRouter);
app.use('/api', networkRouter);
app.use('/api', gameRouter);

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(500).json({ error: 'Errore interno del server.' });
});

app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.info(`Server ready at http://localhost:${PORT}`);
  }
});
