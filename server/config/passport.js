import crypto from 'node:crypto';
import { Strategy as LocalStrategy } from 'passport-local';
import { dbGet } from '../db/db.js';

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

export function configurePassport(passport) {
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
}
