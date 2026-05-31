import cors from 'cors';
import express from 'express';
import session from 'express-session';
import morgan from 'morgan';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import crypto from 'node:crypto';
import { dbGet } from './db/db.js';
import authRouter from './routes/auth.js';
import networkRouter from './routes/network.js';
import gameRouter from './routes/game.js';

const app = express();
const PORT = process.env.PORT ?? 3001;
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'replace-this-secret-in-production';

function scryptHash(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey.toString('hex'));
    });
  });
}

async function verifyPassword(user, password) {
  const candidateHash = await scryptHash(password, user.salt);
  return crypto.timingSafeEqual(Buffer.from(candidateHash, 'hex'), Buffer.from(user.hash, 'hex'));
}

passport.use(
  new LocalStrategy({ usernameField: 'email', passwordField: 'password' }, async (email, password, done) => {
    try {
      const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
      if (!user) {
        return done(null, false, { message: 'Email o password non validi.' });
      }

      const isPasswordValid = await verifyPassword(user, password);
      if (!isPasswordValid) {
        return done(null, false, { message: 'Email o password non validi.' });
      }

      return done(null, { id: user.id, email: user.email, name: user.name });
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await dbGet('SELECT id, email, name FROM users WHERE id = ?', [id]);
    if (!user) {
      return done(null, false);
    }
    return done(null, user);
  } catch (error) {
    return done(error);
  }
});

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

app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
});