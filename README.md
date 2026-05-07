# Pizza Corrida

App web de contador de pizza corrida con ranking y estadisticas por jugador.

Stack: React + Vite (frontend), Spring Boot (backend), PostgreSQL (base de datos), Docker Compose / Kubernetes.

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

---

## Despliegue en Kubernetes (Minikube)

### Requisitos previos

```bash
# Instalar Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Instalar kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

### Parte 1: Preparación del entorno

```bash
# Iniciar el cluster local
minikube start

# Verificar nodos
kubectl get nodes

# Crear namespace devops-lab
kubectl apply -f k8s/namespace.yaml

# Verificar namespace
kubectl get namespaces
```

### Parte 2 y 3: Construir imágenes Docker dentro de Minikube

Para usar imagenes locales en Minikube sin un registry externo, hay que construirlas dentro del Docker daemon de Minikube:

```bash
# Apuntar Docker CLI al daemon de Minikube
eval $(minikube docker-env)

# Construir imagen del backend
docker build -t pizza-corrida-backend:latest ./backend

# Construir imagen del frontend
docker build -t pizza-corrida-frontend:latest ./frontend

# Verificar que las imágenes existen
docker images | grep pizza-corrida
```

### Parte 2: Desplegar base de datos

```bash
# Crear Secret con credenciales de PostgreSQL
kubectl apply -f k8s/postgres/secret.yaml

# Crear PersistentVolumeClaim para almacenamiento
kubectl apply -f k8s/postgres/pvc.yaml

# Crear Deployment de PostgreSQL
kubectl apply -f k8s/postgres/deployment.yaml

# Crear Service interno (ClusterIP)
kubectl apply -f k8s/postgres/service.yaml

# Verificar que el pod de postgres esta Running
kubectl get pods -n devops-lab
```

### Parte 3: Desplegar backend

```bash
# Crear ConfigMap con configuración del backend
kubectl apply -f k8s/backend/configmap.yaml

# Crear Deployment del backend
kubectl apply -f k8s/backend/deployment.yaml

# Crear Service (NodePort en puerto 30300)
kubectl apply -f k8s/backend/service.yaml

# Verificar pods
kubectl get pods -n devops-lab
```

### Parte 4: Desplegar frontend

```bash
# Obtener la IP de Minikube
minikube ip
# Ejemplo de salida: 192.168.49.2

# Editar k8s/frontend/configmap.yaml y reemplazar MINIKUBE_IP con la IP obtenida
# Ejemplo: VITE_API_URL: "http://192.168.49.2:30300/api"

# Aplicar ConfigMap del frontend
kubectl apply -f k8s/frontend/configmap.yaml

# Crear Deployment del frontend
kubectl apply -f k8s/frontend/deployment.yaml

# Crear Service (NodePort en puerto 30517)
kubectl apply -f k8s/frontend/service.yaml
```

### Parte 5: Validación

```bash
# Ver todos los pods en estado Running
kubectl get pods -n devops-lab

# Ver todos los servicios activos
kubectl get services -n devops-lab

# Ver todos los recursos del namespace
kubectl get all -n devops-lab

# Obtener URLs de los servicios expuestos
minikube service frontend-service -n devops-lab --url
minikube service backend-service -n devops-lab --url

# Ver logs del backend
kubectl logs -n devops-lab deployment/backend

# Ver logs del frontend
kubectl logs -n devops-lab deployment/frontend

# Verificar comunicación: ejecutar curl desde dentro del cluster
kubectl run test-curl --image=curlimages/curl -it --rm -n devops-lab -- \
  curl http://backend-service:3000/api/matches
```

### Parte 6: Escalado y resiliencia

```bash
# Escalar backend a 3 replicas
kubectl scale deployment backend --replicas=3 -n devops-lab

# Verificar que hay 3 pods del backend
kubectl get pods -n devops-lab

# Eliminar un pod manualmente (reemplazar <pod-name> con el nombre real)
kubectl delete pod <pod-name> -n devops-lab

# Verificar recreación automática (Kubernetes lo recrea solo)
kubectl get pods -n devops-lab -w
```

### URLs de acceso

Una vez desplegado, la aplicación queda disponible en:

| Servicio | URL |
|---|---|
| Frontend | `http://<minikube-ip>:30517` |
| Backend API | `http://<minikube-ip>:30300/api` |
| Swagger UI | `http://<minikube-ip>:30300/swagger-ui.html` |

Obtener la IP con: `minikube ip`

### Comandos utiles de kubectl

```bash
# Describir un pod (ver eventos y errores)
kubectl describe pod <pod-name> -n devops-lab

# Ver logs en tiempo real
kubectl logs -f deployment/backend -n devops-lab

# Ver el estado de todos los recursos
kubectl get all -n devops-lab

# Aplicar todos los manifiestos de una vez
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/

# Eliminar todo el namespace (limpieza)
kubectl delete namespace devops-lab

# Ver el Secret (valores en base64)
kubectl get secret postgres-secret -n devops-lab -o yaml

# Ver el ConfigMap del backend
kubectl describe configmap backend-config -n devops-lab
```

### Limpiar el entorno

```bash
# Eliminar todos los recursos del namespace
kubectl delete namespace devops-lab

# Detener Minikube
minikube stop

# Eliminar el cluster (borrado completo)
minikube delete
```
