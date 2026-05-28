import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { pizzaApi } from './api/pizzaApi'

function App() {
  const [view, setView] = useState('matches')
  const [matches, setMatches] = useState([])
  const [currentMatch, setCurrentMatch] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [newPlayer, setNewPlayer] = useState('')
  const [newMatchName, setNewMatchName] = useState('')

  useEffect(() => {
    loadMatches()
  }, [])

  const loadMatches = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await pizzaApi.listMatches()
      setMatches(data)
    } catch {
      setError('No se pudo cargar la lista de partidas.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMatch = async (e) => {
    e.preventDefault()
    const name = newMatchName.trim()
    if (!name) return
    setLoading(true)
    setError(null)
    try {
      const match = await pizzaApi.createMatch({ name })
      setCurrentMatch(match)
      setNewMatchName('')
      setView('game')
    } catch {
      setError('No se pudo crear la partida.')
    } finally {
      setLoading(false)
    }
  }

  const openMatch = async (matchId) => {
    setLoading(true)
    setError(null)
    try {
      const match = await pizzaApi.getMatch(matchId)
      setCurrentMatch(match)
      setView('game')
    } catch {
      setError('No se pudo abrir la partida.')
    } finally {
      setLoading(false)
    }
  }

  const openStats = async (matchId) => {
    setLoading(true)
    setError(null)
    try {
      const data = await pizzaApi.getStats(matchId)
      setStats(data)
      setView('stats')
    } catch {
      setError('No se pudieron cargar las estadísticas.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPlayer = async (e) => {
    e.preventDefault()
    const name = newPlayer.trim()
    if (!name) return
    setLoading(true)
    setError(null)
    try {
      const player = await pizzaApi.addPlayer(currentMatch.id, { name })
      setCurrentMatch((m) => ({ ...m, players: [...m.players, player] }))
      setNewPlayer('')
    } catch {
      setError('No se pudo agregar el jugador.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSlice = async (playerId) => {
    setCurrentMatch((m) => ({
      ...m,
      players: m.players.map((p) =>
        p.id === playerId ? { ...p, slices: p.slices + 1 } : p,
      ),
    }))
    try {
      const updated = await pizzaApi.addSlice(currentMatch.id, playerId)
      setCurrentMatch((m) => ({
        ...m,
        players: m.players.map((p) => (p.id === playerId ? updated : p)),
      }))
    } catch {
      setCurrentMatch((m) => ({
        ...m,
        players: m.players.map((p) =>
          p.id === playerId ? { ...p, slices: p.slices - 1 } : p,
        ),
      }))
      setError('No se pudo sumar la porción.')
    }
  }

  const handleRemoveSlice = async (playerId) => {
    setCurrentMatch((m) => ({
      ...m,
      players: m.players.map((p) =>
        p.id === playerId ? { ...p, slices: Math.max(0, p.slices - 1) } : p,
      ),
    }))
    try {
      const updated = await pizzaApi.removeSlice(currentMatch.id, playerId)
      setCurrentMatch((m) => ({
        ...m,
        players: m.players.map((p) => (p.id === playerId ? updated : p)),
      }))
    } catch {
      setCurrentMatch((m) => ({
        ...m,
        players: m.players.map((p) =>
          p.id === playerId ? { ...p, slices: p.slices + 1 } : p,
        ),
      }))
      setError('No se pudo restar la porción.')
    }
  }

  const handleFinishMatch = async () => {
    setLoading(true)
    setError(null)
    try {
      await pizzaApi.finishMatch(currentMatch.id)
      const data = await pizzaApi.getStats(currentMatch.id)
      setStats(data)
      setView('stats')
    } catch {
      setError('No se pudo finalizar la partida.')
    } finally {
      setLoading(false)
    }
  }

  const goToMatches = async () => {
    setCurrentMatch(null)
    setStats(null)
    setView('matches')
    await loadMatches()
  }

  const players = currentMatch?.players ?? []

  const totalSlices = useMemo(
    () => players.reduce((total, p) => total + p.slices, 0),
    [players],
  )

  const leader = useMemo(() => {
    if (players.length === 0 || totalSlices === 0) return null
    return [...players].sort((a, b) => b.slices - a.slices)[0]
  }, [players, totalSlices])

  const averageSlices =
    players.length === 0 ? 0 : (totalSlices / players.length).toFixed(1)

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Pizza corrida</p>
          <h1>Contador de porciones</h1>
        </div>

        {view !== 'matches' && (
          <button className="back-button" type="button" onClick={goToMatches}>
            ← Partidas
          </button>
        )}
      </section>

      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button type="button" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* VISTA: Lista de partidas */}
      {view === 'matches' && (
        <>
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Nueva partida</h2>
                <p>Ingresá un nombre para comenzar.</p>
              </div>
            </div>
            <form className="create-match-form" onSubmit={handleCreateMatch}>
              <input
                aria-label="Nombre de la partida"
                placeholder="Nombre de la partida"
                value={newMatchName}
                onChange={(e) => setNewMatchName(e.target.value)}
                disabled={loading}
              />
              <button type="submit" disabled={loading}>
                {loading ? '...' : 'Crear'}
              </button>
            </form>
          </section>

          <section className="panel" style={{ marginTop: 16 }}>
            <div className="panel-header">
              <div>
                <h2>Partidas</h2>
                <p>Continuá una partida existente.</p>
              </div>
            </div>

            {loading && matches.length === 0 && (
              <p className="loading-text">Cargando...</p>
            )}

            {!loading && matches.length === 0 && (
              <p className="empty-text">No hay partidas todavía.</p>
            )}

            <div className="matches-list">
              {matches.map((match) => (
                <article className="match-card" key={match.id}>
                  <div>
                    <h3>{match.name}</h3>
                    <span className={`status-badge ${match.status}`}>
                      {match.status === 'active' ? 'Activa' : 'Finalizada'}
                    </span>
                  </div>
                  <div className="match-card-actions">
                    {match.status === 'active' ? (
                      <button
                        type="button"
                        onClick={() => openMatch(match.id)}
                        disabled={loading}
                      >
                        Continuar
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="outline-button"
                        onClick={() => openStats(match.id)}
                        disabled={loading}
                      >
                        Ver stats
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {/* VISTA: Partida activa */}
      {view === 'game' && currentMatch && (
        <>
          <section className="summary-grid" aria-label="Resumen de la partida">
            <article>
              <span>Total</span>
              <strong>{totalSlices}</strong>
              <small>porciones comidas</small>
            </article>
            <article>
              <span>Lider</span>
              <strong>{leader ? leader.name : '-'}</strong>
              <small>{leader ? `${leader.slices} porciones` : 'sin consumo aun'}</small>
            </article>
            <article>
              <span>Promedio</span>
              <strong>{averageSlices}</strong>
              <small>por jugador</small>
            </article>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>{currentMatch.name}</h2>
                <p>Sumá una porción cada vez que alguien coma.</p>
              </div>
              <button
                className="ghost-button"
                type="button"
                onClick={handleFinishMatch}
                disabled={loading}
              >
                Finalizar partida
              </button>
            </div>

            <form className="add-player" onSubmit={handleAddPlayer}>
              <input
                aria-label="Nombre del jugador"
                placeholder="Nombre del jugador"
                value={newPlayer}
                onChange={(e) => setNewPlayer(e.target.value)}
                disabled={loading}
              />
              <button type="submit" disabled={loading}>
                {loading ? '...' : 'Agregar'}
              </button>
            </form>

            <div className="players-list">
              {players.map((player) => (
                <article className="player-row" key={player.id}>
                  <div>
                    <h3>{player.name}</h3>
                    <p>{player.slices} porciones</p>
                  </div>
                  <div className="counter-controls">
                    <button
                      aria-label={`Restar porcion a ${player.name}`}
                      type="button"
                      onClick={() => handleRemoveSlice(player.id)}
                      disabled={loading}
                    >
                      -
                    </button>
                    <strong>{player.slices}</strong>
                    <button
                      aria-label={`Sumar porcion a ${player.name}`}
                      type="button"
                      onClick={() => handleAddSlice(player.id)}
                      disabled={loading}
                    >
                      +
                    </button>
                  </div>
                </article>
              ))}

              {players.length === 0 && (
                <p className="empty-text">Aún no hay jugadores. ¡Agregá uno!</p>
              )}
            </div>
          </section>
        </>
      )}

      {/* VISTA: Estadísticas */}
      {view === 'stats' && stats && (
        <>
          <section className="summary-grid" aria-label="Resumen estadístico">
            <article>
              <span>Total</span>
              <strong>{stats.totalSlices}</strong>
              <small>porciones comidas</small>
            </article>
            <article>
              <span>Lider</span>
              <strong>{stats.leader ? stats.leader.name : '-'}</strong>
              <small>
                {stats.leader ? `${stats.leader.slices} porciones` : 'sin consumo'}
              </small>
            </article>
            <article>
              <span>Promedio</span>
              <strong>{stats.averageSlices.toFixed(1)}</strong>
              <small>por jugador</small>
            </article>
          </section>

          <section className="panel stats-panel">
            <div className="panel-header">
              <div>
                <h2>Estadísticas</h2>
                <p>Ranking final de la partida.</p>
              </div>
            </div>

            <div className="ranking">
              {stats.ranking.map((entry, index) => (
                <article className="ranking-row" key={entry.playerId}>
                  <div className="rank-number">{index + 1}</div>
                  <div className="rank-content">
                    <div className="rank-label">
                      <strong>{entry.name}</strong>
                      <span>{entry.percentage}%</span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${entry.percentage}%` }}
                      />
                    </div>
                  </div>
                  <strong>{entry.slices}</strong>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  )
}

export default App
