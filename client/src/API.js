const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

const NETWORK_ERROR_MSG = 'Impossibile contattare il server. Verifica che sia avviato.';

function apiError(message, status = null) {
  const err = new Error(message);
  if (status !== null) err.status = status;
  return err;
}

function errorMessageFromBody(body, status) {
  if (!body) return `Errore ${status}`;
  if (body.message) return body.message;
  if (body.error) return body.error;
  if (Array.isArray(body.errors) && body.errors[0]?.msg) return body.errors[0].msg;
  return `Errore ${status}`;
}

// Tutte le fetch passano per questo helper:
// - legge il corpo JSON se presente
// - lancia un errore con il messaggio del server se la risposta non è ok
async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      ...options,
    });
  } catch {
    throw apiError(NETWORK_ERROR_MSG);
  }

  const contentType = response.headers.get('content-type') ?? '';
  let body = null;
  if (contentType.includes('application/json')) {
    try {
      body = await response.json();
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    throw apiError(errorMessageFromBody(body, response.status), response.status);
  }

  return body;
}

// --- Auth ---

export async function login(credentials) {
  return request('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function logout() {
  await request('/api/sessions/current', { method: 'DELETE' });
}

export async function getCurrentSession() {
  try {
    return await request('/api/sessions/current');
  } catch (err) {
    if (err.status === 401) return null;
    throw err;
  }
}

// --- Rete ---

export async function getNetwork() {
  return request('/api/network');
}

// --- Partita ---

export async function createGame() {
  return request('/api/games', { method: 'POST' });
}

export async function submitGame(gameId, segments) {
  return request(`/api/games/${gameId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ segments }),
  });
}

// --- Classifica ---

export async function getRanking() {
  return request('/api/ranking');
}

export async function getGames(page = 1, limit = 25) {
  return request(`/api/games?page=${page}&limit=${limit}`);
}

export async function getEvents() {
  return request('/api/events');
}