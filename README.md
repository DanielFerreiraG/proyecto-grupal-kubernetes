# Pizza Corrida

App web de contador de pizza corrida con ranking y estadisticas por jugador.

Stack: React + Vite (frontend), Spring Boot (backend), PostgreSQL (base de datos), Docker Compose.

## Levantar el proyecto (Ubuntu)

```bash
# 1. Instalar Docker
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER && newgrp docker

# 2. Clonar el repositorio
git clone <url-del-repo>
cd <nombre-del-repo>

# 3. Copiar el .env del frontend
cp frontend/.env.example frontend/.env

# 4. Levantar todos los servicios
docker compose up --build
```

Listo. Los servicios quedan disponibles en:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- PostgreSQL: localhost:5432

## Comandos utiles

```bash
# Levantar en background
docker compose up --build -d

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio especifico (backend | frontend | postgres)
docker compose logs -f backend

# Detener los servicios
docker compose down

# Detener y borrar la base de datos
docker compose down -v
```

## Variables de entorno

El backend usa `backend/.env` (ya incluido en el repo con valores para Docker).
Si necesitas ajustarlo:

```bash
cp backend/.env.example backend/.env
# Editar backend/.env con tus valores
```

| Variable | Valor por defecto | Descripcion |
|---|---|---|
| `PORT` | `3000` | Puerto del backend |
| `DB_HOST` | `postgres` | Host de la DB (nombre del servicio Docker) |
| `DB_PORT` | `5432` | Puerto de PostgreSQL |
| `DB_NAME` | `pizza_corrida` | Nombre de la base de datos |
| `DB_USERNAME` | `postgres` | Usuario de la DB |
| `DB_PASSWORD` | `postgres123` | Contrasena de la DB |
| `CORS_ORIGIN` | `http://localhost:5173` | Origen permitido por CORS |
| `VITE_API_URL` | `http://localhost:3000/api` | URL del backend (frontend) |
