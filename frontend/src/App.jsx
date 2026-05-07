import { useMemo, useState } from 'react'
import './App.css'

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

const initialPlayers = [
  { id: uid(), name: 'Dani', slices: 0 },
  { id: uid(), name: 'Mica', slices: 0 },
  { id: uid(), name: 'Leo', slices: 0 },
]

function App() {
  const [activeView, setActiveView] = useState('game')
  const [players, setPlayers] = useState(initialPlayers)
  const [newPlayer, setNewPlayer] = useState('')

  const totalSlices = useMemo(
    () => players.reduce((total, player) => total + player.slices, 0),
    [players],
  )

  const leader = useMemo(() => {
    if (players.length === 0 || totalSlices === 0) return null
    return [...players].sort((a, b) => b.slices - a.slices)[0]
  }, [players, totalSlices])

  const averageSlices =
    players.length === 0 ? 0 : (totalSlices / players.length).toFixed(1)

  const addPlayer = (event) => {
    event.preventDefault()
    const name = newPlayer.trim()

    if (!name) return

    setPlayers((currentPlayers) => [
      ...currentPlayers,
      { id: uid(), name, slices: 0 },
    ])
    setNewPlayer('')
  }

  const incrementSlices = (playerId) => {
    setPlayers((currentPlayers) =>
      currentPlayers.map((player) =>
        player.id === playerId
          ? { ...player, slices: player.slices + 1 }
          : player,
      ),
    )
  }

  const decrementSlices = (playerId) => {
    setPlayers((currentPlayers) =>
      currentPlayers.map((player) =>
        player.id === playerId
          ? { ...player, slices: Math.max(0, player.slices - 1) }
          : player,
      ),
    )
  }

  const resetMatch = () => {
    setPlayers((currentPlayers) =>
      currentPlayers.map((player) => ({ ...player, slices: 0 })),
    )
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Pizza corrida</p>
          <h1>Contador de porciones</h1>
        </div>

        <nav className="view-switcher" aria-label="Vistas">
          <button
            className={activeView === 'game' ? 'active' : ''}
            type="button"
            onClick={() => setActiveView('game')}
          >
            Partida
          </button>
          <button
            className={activeView === 'stats' ? 'active' : ''}
            type="button"
            onClick={() => setActiveView('stats')}
          >
            Estadisticas
          </button>
        </nav>
      </section>

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

      {activeView === 'game' ? (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Jugadores</h2>
              <p>Sumen una porcion cada vez que alguien coma.</p>
            </div>
            <button className="ghost-button" type="button" onClick={resetMatch}>
              Reiniciar
            </button>
          </div>

          <form className="add-player" onSubmit={addPlayer}>
            <input
              aria-label="Nombre del jugador"
              placeholder="Nombre del jugador"
              value={newPlayer}
              onChange={(event) => setNewPlayer(event.target.value)}
            />
            <button type="submit">Agregar</button>
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
                    onClick={() => decrementSlices(player.id)}
                  >
                    -
                  </button>
                  <strong>{player.slices}</strong>
                  <button
                    aria-label={`Sumar porcion a ${player.name}`}
                    type="button"
                    onClick={() => incrementSlices(player.id)}
                  >
                    +
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="panel stats-panel">
          <div className="panel-header">
            <div>
              <h2>Estadisticas</h2>
              <p>Datos simples para guardar como historial de partida.</p>
            </div>
          </div>

          <div className="ranking">
            {[...players]
              .sort((a, b) => b.slices - a.slices)
              .map((player, index) => {
                const percent =
                  totalSlices === 0 ? 0 : Math.round((player.slices / totalSlices) * 100)

                return (
                  <article className="ranking-row" key={player.id}>
                    <div className="rank-number">{index + 1}</div>
                    <div className="rank-content">
                      <div className="rank-label">
                        <strong>{player.name}</strong>
                        <span>{percent}%</span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                    <strong>{player.slices}</strong>
                  </article>
                )
              })}
          </div>
        </section>
      )}
    </main>
  )
}

export default App
