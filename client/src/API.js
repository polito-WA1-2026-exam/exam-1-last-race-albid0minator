const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return response.json()
  }

  return null
}

export async function login(credentials) {
  const response = await fetch(`${API_URL}/api/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(credentials)
  })

  const payload = await parseResponse(response)
  if (!response.ok) {
    throw new Error(payload?.message ?? 'Login fallito')
  }

  return payload
}

export async function logout() {
  const response = await fetch(`${API_URL}/api/sessions/current`, {
    method: 'DELETE',
    credentials: 'include'
  })

  if (!response.ok && response.status !== 204) {
    throw new Error('Logout fallito')
  }
}

export async function getCurrentSession() {
  const response = await fetch(`${API_URL}/api/sessions/current`, {
    credentials: 'include'
  })

  if (!response.ok) {
    return null
  }

  return response.json()
}