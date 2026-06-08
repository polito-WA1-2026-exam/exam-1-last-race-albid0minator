const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

// Tutte le fetch passano per questo helper:
// - legge il corpo JSON se presente
// - lancia un errore con il messaggio del server se la risposta non è ok
// Centralizzare qui evita di duplicare questo controllo in ogni funzione.
async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // necessario per inviare il cookie di sessione
    ...options,
  })

  const contentType = response.headers.get('content-type') ?? ''
  const body = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    throw new Error(body?.message ?? body?.error ?? `Errore ${response.status}`)
  }

  return body
}

// --- Auth ---

export async function login(credentials) {
  return request('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export async function logout() {
  // DELETE /api/sessions/current restituisce 204 (no body): request gestisce già il caso null
  await request('/api/sessions/current', { method: 'DELETE' })
}

export async function getCurrentSession() {
  // Questo endpoint risponde 401 se non autenticati (non un errore "vero"):
  // catchiamo e restituiamo null così App.jsx può distinguere "non loggato" da errori di rete.
  try {
    return await request('/api/sessions/current')
  } catch {
    return null
  }
}

// --- Rete ---

// La rete non cambia mai: stazioni, linee, segmenti.
// Il client la scarica una volta sola all'avvio del gioco.
export async function getNetwork() {
  return request('/api/network')
}

// --- Partita ---

// POST /api/games crea una nuova partita sul server.
// Il server sceglie casualmente start e end (distanza minima 3 fermate)
// e restituisce { gameId, startStationId, endStationId }.
export async function createGame() {
  return request('/api/games', { method: 'POST' })
}

// POST /api/games/:id/submit invia il percorso costruito dall'utente.
// segments è un array di { from, to } in ordine.
// Il server valida, simula gli eventi, e restituisce { valid, steps, finalScore }.
export async function submitGame(gameId, segments) {
  return request(`/api/games/${gameId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ segments }),
  })
}

// --- Classifica ---

export async function getRanking() {
  return request('/api/ranking')
}

// --- Partite utente ---
export async function getGames(page = 1, limit = 25) {
  return request(`/api/games?page=${page}&limit=${limit}`)
}

// --- Eventi ---
export async function getEvents() {
  return request('/api/events')
}