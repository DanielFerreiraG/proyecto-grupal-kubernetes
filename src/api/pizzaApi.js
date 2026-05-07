const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`API error ${response.status}`)
  }

  if (response.status === 204) return null

  return response.json()
}

export const pizzaApi = {
  listMatches: () => request('/matches'),
  createMatch: (payload) =>
    request('/matches', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMatch: (matchId) => request(`/matches/${matchId}`),
  addPlayer: (matchId, payload) =>
    request(`/matches/${matchId}/players`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  addSlice: (matchId, playerId) =>
    request(`/matches/${matchId}/players/${playerId}/slices`, {
      method: 'POST',
    }),
  removeSlice: (matchId, playerId) =>
    request(`/matches/${matchId}/players/${playerId}/slices`, {
      method: 'DELETE',
    }),
  finishMatch: (matchId) =>
    request(`/matches/${matchId}/finish`, {
      method: 'POST',
    }),
  getStats: (matchId) => request(`/matches/${matchId}/stats`),
}
