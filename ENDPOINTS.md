# Endpoints propuestos

Base URL local sugerida:

```txt
http://localhost:3000/api
```

## Partidas

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| `GET` | `/matches` | Listar partidas guardadas. |
| `POST` | `/matches` | Crear una partida nueva. |
| `GET` | `/matches/:matchId` | Obtener una partida con sus jugadores. |
| `POST` | `/matches/:matchId/finish` | Finalizar una partida y dejarla en historial. |

### Crear partida

```json
{
  "name": "Pizza corrida viernes",
  "players": ["Dani", "Mica", "Leo"]
}
```

### Respuesta de partida

```json
{
  "id": "match_123",
  "name": "Pizza corrida viernes",
  "status": "active",
  "createdAt": "2026-05-07T21:00:00.000Z",
  "players": [
    {
      "id": "player_1",
      "name": "Dani",
      "slices": 4
    }
  ]
}
```

## Jugadores

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| `POST` | `/matches/:matchId/players` | Agregar jugador a una partida. |
| `POST` | `/matches/:matchId/players/:playerId/slices` | Sumar una porcion al jugador. |
| `DELETE` | `/matches/:matchId/players/:playerId/slices` | Restar una porcion al jugador. |

### Agregar jugador

```json
{
  "name": "Sofi"
}
```

## Estadisticas

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| `GET` | `/matches/:matchId/stats` | Obtener estadisticas de una partida. |

### Respuesta de estadisticas

```json
{
  "matchId": "match_123",
  "totalSlices": 18,
  "averageSlices": 4.5,
  "leader": {
    "id": "player_1",
    "name": "Dani",
    "slices": 7
  },
  "ranking": [
    {
      "playerId": "player_1",
      "name": "Dani",
      "slices": 7,
      "percentage": 39
    }
  ]
}
```

## Variables del frontend

Crear `.env` cuando exista backend:

```txt
VITE_API_URL=http://localhost:3000/api
```
