# Pizza Corrida Frontend

Frontend en React + Vite para una app mobile/web simple de contador de pizza corrida.

La app permite:

- Agregar jugadores.
- Sumar o restar porciones comidas por jugador.
- Ver total, lider y promedio de porciones.
- Cambiar a una vista de estadisticas con ranking y porcentajes.

## Instalacion

```bash
npm install
```

## Ejecutar en desarrollo

```bash
npm run dev
```

## Compilar

```bash
npm run build
```

## API esperada

El listado propuesto de endpoints esta en [ENDPOINTS.md](./ENDPOINTS.md).

Cuando el backend este listo, crear un archivo `.env`:

```txt
VITE_API_URL=http://localhost:3000/api
```

Por ahora la pantalla funciona con estado local para que el frontend pueda demostrarse sin backend.
