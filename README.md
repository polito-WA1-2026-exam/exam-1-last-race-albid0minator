# Exam #1: "Last Race"
## Student: s361878 BOR ALBERTO

> **Avvio:** `cd server && nodemon index.js` (porta 3001) · `cd client && npm run dev` (porta 5173)  
> Il database SQLite pre-seedato è incluso nel repository (`server/database.db`).

---

## React Client Application Routes

| Route | Descrizione | Accesso |
|-------|-------------|---------|
| `/` | Home con istruzioni del gioco. Gli utenti autenticati vedono i pulsanti per giocare e la classifica. | Tutti |
| `/login` | Form di login (email + password). Redirect a `/game` se già autenticati. | Tutti |
| `/game` | Fasi del gioco: Setup → Planning (90s) → Execution → Result. | Solo registrati |
| `/ranking` | Classifica generale con il miglior punteggio per giocatore. | Solo registrati |
| `/history` | Storico personale delle partite con paginazione. | Solo registrati |
| `/events` | Elenco pubblico di tutti i Bonus & Malus con descrizione ed effetto. | Tutti |
| `*` | Route non riconosciute → redirect a `/`. | — |

---

## API Server

Prefisso comune: `/api/` · Autenticazione: session cookie (Passport.js) · Middleware `isLoggedIn` sulle route protette.

### Autenticazione

- **GET `/api/sessions/current`**
  - Parametri: nessuno.
  - Risposta (200): `{ loggedIn: true, user: { id, email, name } }`
  - Risposta (401): `{ loggedIn: false, user: null }`

- **POST `/api/sessions`**
  - Body: `{ email: string, password: string }`
  - Risposta (200): `{ loggedIn: true, user: { id, email, name } }`
  - Risposta (401): `{ message: string }`

- **DELETE `/api/sessions/current`**
  - Parametri: nessuno.
  - Risposta (204): nessun body.

### Rete, eventi e classifica

- **GET `/api/network`** *(protetta)*
  - Risposta (200): `{ lines, stations, stationLines, segments }` dove `segments` è un array di `{ from_station_id, to_station_id }`.

- **GET `/api/ranking`** *(protetta)*
  - Risposta (200): array di `{ user_id, name, best_score, games_played }` ordinato per `best_score` decrescente.

- **GET `/api/events`**
  - Risposta (200): array di `{ id, description, effect }` (effetto intero da -4 a +4).

### Partite

- **POST `/api/games`** *(protetta)*
  - Body: nessuno. Crea una partita con partenza/destinazione casuali (distanza minima 3 segmenti).
  - Risposta (201): `{ gameId, startStationId, endStationId }`

- **POST `/api/games/:id/submit`** *(protetta)*
  - Path: `id` (integer). Body: `{ segments: [{ from, to }, ...] }`
  - Risposta (200) percorso invalido: `{ valid: false, steps: [], finalScore: 0 }`
  - Risposta (200) percorso valido: `{ valid: true, steps: [...], finalScore: number }` — ogni step: `{ stepOrder, fromStationId, toStationId, event: { id, description, effect }, coinsAfter }`
  - Risposta (400/404/409): errori di validazione, partita non trovata o già completata.

- **GET `/api/games`** *(protetta)*
  - Query: `page` (default 1), `limit` (default 25, max 50).
  - Risposta (200): `{ games, total, page, limit, totalPages }` — ogni game: `{ id, user_id, start_station_id, end_station_id, score, valid, played_at, start_station_name, end_station_name }`.

---

## Database Tables

| Tabella | Scopo |
|---------|-------|
| `users` | Utenti registrati: `id`, `email`, `name`, `hash` (scrypt), `salt` |
| `lines` | Linee metro: `id`, `name`, `color` |
| `stations` | Stazioni: `id`, `name`, coordinate `x`, `y` |
| `station_lines` | Appartenenza stazione–linea con `position` (ordine sulla linea) |
| `events` | Eventi casuali: `id`, `description`, `effect` (-4 … +4) |
| `games` | Partite: `id`, `user_id`, `start_station_id`, `end_station_id`, `score`, `valid` (-1=pending, 0=invalida, 1=valida), `played_at` |
| `game_steps` | Passi di partite valide: `id`, `game_id`, `step_order`, `from_station_id`, `to_station_id`, `event_id`, `coins_after` |

Il file `server/database.db` è committato nel repository, già popolato con i dati minimi richiesti dall'esame.

---

## Main React Components

| Componente | File | Ruolo |
|------------|------|-------|
| `Navigation` | `components/Navigation.jsx` | Barra di navigazione con link condizionati allo stato di autenticazione |
| `NetworkMap` | `components/NetworkMap.jsx` | Mappa rete metro (React Flow): linee in Setup, solo stazioni in Planning |
| `SegmentList` | `components/SegmentList.jsx` | Lista segmenti selezionabili con ricerca e ordinamento |
| `PlanningTimer` | `components/PlanningTimer.jsx` | Timer 90 secondi con feedback visivo |
| `GameAudio` | `components/GameAudio.jsx` | Audio ambientale nella fase Planning |
| `HomePage` | `pages/HomePage.jsx` | Istruzioni e presentazione del gioco |
| `LoginPage` | `pages/LoginPage.jsx` | Form di login |
| `GamePage` | `pages/GamePage.jsx` | Orchestratore delle 4 fasi di gioco |
| `RankingPage` | `pages/RankingPage.jsx` | Classifica generale |
| `HistoryPage` | `pages/HistoryPage.jsx` | Storico partite paginato |
| `EventsPage` | `pages/EventsPage.jsx` | Tabella eventi Bonus & Malus |

---

## Screenshot

Inserire qui due screenshot prima della consegna (salvarli in `img/`):

| File | Contenuto |
|------|-----------|
| `img/ranking.png` | Pagina classifica generale |
| `img/game.png` | Schermata durante una partita (fase Planning o Execution) |

![Classifica](./img/ranking.png)

![Durante una partita](./img/game.png)

---

## Users Credentials

| Nome  | Email   | Password |
|-------|---------|----------|
| Alice | a@a.it  | aaa      |
| Bob   | b@b.it  | bbb      |
| Carol | c@c.it  | ccc      |

Alice e Bob hanno partite già giocate nel database.

---

## Use of AI Tools

Claude e Codex è stato utilizzato per la struttura iniziale delle API Express, la logica di validazione del percorso, e per controllare che i componenti react scritti fossero corretti e producessero il risultato sperato  componenti React. Tutto il codice generato è stato revisionato manualmente, testato avviando server e client, e adattato per rispettare i vincoli del progetto  nel client, protezione route.