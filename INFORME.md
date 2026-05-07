# Informe – Despliegue de Aplicación en Kubernetes Local

**Materia:** DevOps  
**Proyecto:** Grupal  
**Fecha de entrega:** 2026-05-07  

---

## 1. Descripción del proyecto

Se desarrolló e implementó **Pizza Corrida**, una aplicación web para gestionar partidas de un juego de conteo de pizzas, con ranking y estadísticas por jugador.

El objetivo principal del proyecto fue la infraestructura y el despliegue, no la aplicación en sí. La aplicación fue utilizada como vehículo para aplicar conceptos reales de Kubernetes: namespaces, pods, deployments, services, configmaps, secrets, volúmenes persistentes y escalabilidad.

### Arquitectura del sistema

```
Usuario (browser)
    ↓  NodePort :30517
Frontend — React + Vite  (Pod en Kubernetes)
    ↓  NodePort :30300 / ClusterIP interno
Backend — Spring Boot API REST  (Pod en Kubernetes)
    ↓  ClusterIP :5432
Base de datos — PostgreSQL 16  (Pod en Kubernetes + PersistentVolume)
```

### Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19, Vite, Node 20-alpine |
| Backend | Java 17, Spring Boot 3, Maven |
| Base de datos | PostgreSQL 16-alpine |
| Orquestación | Kubernetes (Minikube) |
| Contenedores | Docker (imágenes multi-stage) |

---

## 2. Pasos de instalación y comandos ejecutados

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

# Verificar que el nodo está disponible
kubectl get nodes

# Crear el namespace devops-lab
kubectl apply -f k8s/namespace.yaml

# Verificar namespace creado
kubectl get namespaces
```

### Parte 2 y 3: Construir imágenes Docker dentro de Minikube

```bash
# Apuntar Docker CLI al daemon interno de Minikube
eval $(minikube docker-env)

# Construir imagen del backend
docker build -t pizza-corrida-backend:latest ./backend

# Construir imagen del frontend
docker build -t pizza-corrida-frontend:latest ./frontend

# Verificar imágenes disponibles
docker images | grep pizza-corrida
```

### Parte 2: Despliegue de la base de datos

```bash
# Crear Secret con credenciales de PostgreSQL
kubectl apply -f k8s/postgres/secret.yaml

# Crear PersistentVolumeClaim para almacenamiento persistente
kubectl apply -f k8s/postgres/pvc.yaml

# Crear Deployment de PostgreSQL
kubectl apply -f k8s/postgres/deployment.yaml

# Crear Service interno (ClusterIP)
kubectl apply -f k8s/postgres/service.yaml

# Verificar que el pod está Running
kubectl get pods -n devops-lab
```

### Parte 3: Despliegue del backend

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

### Parte 4: Despliegue del frontend

```bash
# Obtener la IP de Minikube
minikube ip
# Salida de ejemplo: 192.168.49.2

# Editar k8s/frontend/configmap.yaml y reemplazar MINIKUBE_IP con la IP obtenida
# VITE_API_URL: "http://192.168.49.2:30300/api"

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

# Obtener URLs de acceso
minikube service frontend-service -n devops-lab --url
minikube service backend-service -n devops-lab --url

# Verificar comunicación interna desde dentro del cluster
kubectl run test-curl --image=curlimages/curl -it --rm -n devops-lab -- \
  curl http://backend-service:3000/api/matches
```

### Parte 6: Escalado y resiliencia

```bash
# Escalar backend a 3 réplicas
kubectl scale deployment backend --replicas=3 -n devops-lab

# Verificar que hay 3 pods del backend corriendo
kubectl get pods -n devops-lab

# Eliminar un pod manualmente para probar la recreación
kubectl delete pod <nombre-del-pod> -n devops-lab

# Observar en tiempo real cómo Kubernetes lo recrea
kubectl get pods -n devops-lab -w
```

---

## 3. Problemas encontrados y soluciones

### Problema 1: Imágenes no encontradas por Kubernetes (`ErrImageNeverPull`)

**Descripción:** Al construir las imágenes Docker con el daemon del sistema host y aplicar los manifiestos, los pods del backend y frontend fallaban con el error `ErrImageNeverPull`. Kubernetes no encontraba las imágenes locales.

**Causa:** Minikube corre su propio Docker daemon interno, separado del Docker del sistema operativo. Las imágenes construidas en el host no son visibles para Kubernetes dentro de Minikube.

**Solución:** Antes de construir las imágenes, apuntar el cliente Docker al daemon interno de Minikube con el comando:

```bash
eval $(minikube docker-env)
```

A partir de ese momento, las imágenes construidas quedan disponibles directamente para Kubernetes. Además, se configuró `imagePullPolicy: Never` en los deployments para que Kubernetes nunca intente descargar la imagen de un registry externo.

---

### Problema 2: El frontend no conectaba con el backend (`VITE_API_URL` incorrecto)

**Descripción:** Al acceder al frontend, las llamadas a la API fallaban con errores de red. El frontend intentaba conectarse a una IP incorrecta.

**Causa:** Vite embebe las variables de entorno en tiempo de build (compilación), no en tiempo de ejecución. Esto significa que `VITE_API_URL` se hardcodea en el JavaScript generado. Si el ConfigMap tenía el placeholder `MINIKUBE_IP` sin reemplazar, el frontend intentaba conectarse a esa URL literal.

**Solución:** Obtener la IP real de Minikube con `minikube ip`, actualizar manualmente `k8s/frontend/configmap.yaml` con esa IP, y luego reconstruir la imagen del frontend (ya con el valor correcto en el entorno) antes de aplicar los manifiestos.

---

### Problema 3: Backend en `CrashLoopBackOff` por dependencia de la base de datos

**Descripción:** El pod del backend entraba en `CrashLoopBackOff` inmediatamente después de iniciar.

**Causa:** El backend intentaba conectarse a PostgreSQL durante el arranque, pero el pod de la base de datos todavía no había terminado de inicializarse y no estaba lista para aceptar conexiones.

**Diagnóstico:**
```bash
kubectl describe pod <backend-pod> -n devops-lab
kubectl logs <backend-pod> -n devops-lab
```

Los logs mostraban errores de conexión JDBC a `postgres-service:5432`.

**Solución:** Esperar a que el pod de PostgreSQL esté en estado `Running` y su readinessProbe sea exitosa antes de aplicar el deployment del backend. El readinessProbe configurado en el deployment de postgres (`pg_isready`) garantiza que el servicio solo recibe tráfico cuando la base de datos está lista.

---

## 4. Respuestas al cuestionario

### 1. ¿Cuál es la diferencia entre un Pod y un Deployment?

Un **Pod** es la unidad mínima de ejecución en Kubernetes: contiene uno o más contenedores que comparten red y almacenamiento. Sin embargo, un Pod por sí solo es efímero — si falla o se elimina, no se recupera automáticamente.

Un **Deployment** es un controlador que gestiona el ciclo de vida de los pods. Define cuántas réplicas deben estar corriendo en todo momento y se encarga de recrear pods si fallan, actualizar versiones de forma controlada y escalar horizontalmente. En el proyecto, cada componente (postgres, backend, frontend) tiene su propio Deployment que garantiza que siempre exista al menos una instancia corriendo.

---

### 2. ¿Por qué Kubernetes recrea un pod automáticamente?

Kubernetes implementa el principio de **estado deseado** (desired state). Al definir `replicas: 1` en un Deployment, el sistema registra que siempre debe haber 1 pod corriendo. Un componente llamado **Controller Manager** monitorea continuamente el estado real del clúster y lo compara con el estado deseado. Si detecta que un pod fue eliminado o falló, automáticamente crea uno nuevo para reconciliar ambos estados.

Esto se verificó en el proyecto ejecutando `kubectl delete pod <nombre>` — Kubernetes inmediatamente comenzó a crear un pod de reemplazo, visible con `kubectl get pods -w`.

---

### 3. ¿Qué problema resuelve un Service?

Los pods en Kubernetes tienen direcciones IP dinámicas que cambian cada vez que se recrean. Sin un Service, sería imposible que el backend siempre encuentre a PostgreSQL, ya que la IP puede haber cambiado.

Un **Service** provee una IP y nombre DNS estables que actúan como punto de entrada fijo hacia un conjunto de pods. En el proyecto:

- El `postgres-service` (ClusterIP) permite que el backend siempre alcance la base de datos usando el hostname `postgres-service`, sin importar cuántas veces se haya recreado el pod.
- Los services de tipo **NodePort** del backend y frontend exponen la aplicación fuera del clúster en puertos fijos (30300 y 30517), permitiendo el acceso desde el browser.

---

### 4. ¿Cuál es la diferencia entre ConfigMap y Secret?

Ambos son mecanismos para externalizar la configuración de los contenedores, pero difieren en su propósito y nivel de protección:

- **ConfigMap**: almacena datos de configuración no sensibles en texto plano, como `DB_HOST`, `DB_PORT`, `PORT` y `CORS_ORIGIN`. Es legible directamente con `kubectl get configmap`.

- **Secret**: almacena información sensible como contraseñas y credenciales. Los valores se codifican en base64 y Kubernetes ofrece mecanismos adicionales de protección (acceso restringido por RBAC, posibilidad de cifrado en reposo). En el proyecto, las credenciales de PostgreSQL (`POSTGRES_USER`, `POSTGRES_PASSWORD`) se almacenan en un Secret que tanto el Deployment de postgres como el del backend consumen mediante referencias directas (`secretKeyRef`).

La separación evita que credenciales sensibles queden expuestas junto a la configuración general.

---

### 5. ¿Qué ocurre si un pod falla constantemente?

Kubernetes intenta reiniciar el pod automáticamente, pero aplica una política de **backoff exponencial**: espera 10 segundos, luego 20, 40, y así sucesivamente hasta un máximo de 5 minutos entre reintentos. Si el pod continúa fallando, entra en estado **CrashLoopBackOff**.

Este estado indica que el contenedor arranca, falla, Kubernetes lo reinicia, vuelve a fallar, y así en bucle. El pod permanece en el clúster (visible con `kubectl get pods`) pero no procesa tráfico. Para diagnosticarlo se utilizan `kubectl logs <pod>` para ver el error del contenedor y `kubectl describe pod <pod>` para ver los eventos del ciclo de vida registrados por Kubernetes.

---

### 6. ¿Cómo se logra la escalabilidad en Kubernetes?

Kubernetes permite escalar horizontalmente un Deployment cambiando el número de réplicas:

```bash
kubectl scale deployment backend --replicas=3 -n devops-lab
```

Esto crea 3 pods del backend corriendo en paralelo. El Service del backend distribuye el tráfico entre los 3 pods automáticamente, actuando como load balancer interno. Si uno falla, los otros dos siguen atendiendo requests mientras Kubernetes recrea el tercero.

Para escalar automáticamente según la carga, Kubernetes ofrece el **Horizontal Pod Autoscaler (HPA)**, que ajusta las réplicas dinámicamente en función de métricas como uso de CPU o memoria, sin intervención manual.

---

### 7. ¿Qué ventajas ofrece Kubernetes frente a Docker standalone?

| Aspecto | Docker standalone | Kubernetes |
|---|---|---|
| Alta disponibilidad | No — si el contenedor muere, muere | Sí — recrea pods automáticamente |
| Escalado | Manual, reinicio de contenedores | Horizontal con un comando o automático (HPA) |
| Balanceo de carga | Requiere configuración extra (nginx, traefik) | Integrado nativamente en los Services |
| Gestión de configuración | Variables en `docker-compose.yml` | ConfigMap y Secret nativos con control de acceso |
| Despliegues sin downtime | Complejo de implementar | Rolling updates integrados |
| Almacenamiento persistente | Volumes en docker-compose | PersistentVolumeClaim gestionado por el clúster |
| Observabilidad | Logs por contenedor | Eventos, describe, métricas centralizadas |

En entornos de producción, Kubernetes permite operar aplicaciones distribuidas con resiliencia, escalabilidad y facilidad de gestión que Docker standalone no puede ofrecer de forma nativa.

---

### 8. ¿Qué dificultades encontraron durante el despliegue?

La principal dificultad fue la configuración de imágenes locales en Minikube. Por defecto, Minikube usa su propio Docker daemon separado del sistema host. Al construir las imágenes con el Docker del host, Kubernetes no las encontraba y los pods fallaban con `ErrImageNeverPull`. La solución fue apuntar el cliente Docker al daemon de Minikube con `eval $(minikube docker-env)` antes de construir las imágenes.

Otra dificultad fue la configuración del `VITE_API_URL` en el frontend. Vite embebe las variables de entorno en tiempo de build, no en runtime. Esto requirió conocer de antemano la IP de Minikube (`minikube ip`) para colocarla en el ConfigMap antes de construir la imagen del frontend y aplicar los manifiestos.

Por último, el orden de despliegue resultó crítico: el backend fallaba al iniciar si PostgreSQL todavía no estaba listo para aceptar conexiones, lo que generó pods en estado `CrashLoopBackOff` durante las primeras pruebas.

---

### 9. ¿Tuvieron errores y cómo diagnosticaron los errores?

Sí. Los comandos principales que se utilizaron para diagnóstico fueron:

```bash
# Ver estado de pods y detectar errores como CrashLoopBackOff o ErrImageNeverPull
kubectl get pods -n devops-lab

# Ver eventos detallados del pod: muestra el mensaje de error exacto de Kubernetes
kubectl describe pod <nombre-pod> -n devops-lab

# Ver logs del contenedor para errores de la aplicación
kubectl logs <nombre-pod> -n devops-lab

# Ver logs en tiempo real durante el arranque
kubectl logs -f deployment/backend -n devops-lab
```

El flujo de diagnóstico fue: primero `get pods` para identificar el pod problemático y su estado, luego `describe pod` para ver los eventos de Kubernetes (image pull errors, probe failures, OOMKilled), y finalmente `logs` para ver errores propios de la aplicación (fallo de conexión a la base de datos, puertos mal configurados, etc.).

---

### 10. ¿Qué mejoras implementarían en producción?

1. **CI/CD pipeline:** automatizar el build de imágenes y el despliegue con GitHub Actions o GitLab CI, eliminando todos los pasos manuales y garantizando reproducibilidad.

2. **Registry de imágenes privado:** usar Docker Hub, Amazon ECR o un registry privado en lugar de imágenes locales (`imagePullPolicy: Never`), lo que permite desplegar en cualquier nodo del clúster.

3. **Secrets gestionados externamente:** reemplazar los Secrets de Kubernetes con base64 por soluciones como HashiCorp Vault o AWS Secrets Manager, que ofrecen cifrado real, auditoría y rotación automática de credenciales.

4. **Ingress Controller con TLS:** reemplazar los NodePort por un Ingress Controller (nginx o traefik) con dominio y certificado HTTPS, exponiendo la aplicación de forma segura y profesional.

5. **Horizontal Pod Autoscaler (HPA):** configurar escalado automático basado en métricas de CPU/memoria para que el sistema se adapte a la carga sin intervención manual.

6. **Health probes HTTP:** cambiar las probes TCP por endpoints HTTP reales (ej. `/api/health`) para una verificación más precisa del estado de la aplicación.

7. **Resource requests y limits:** definir límites de CPU y memoria en cada Deployment para evitar que un pod consuma todos los recursos del nodo y afecte a los demás servicios.

8. **Múltiples réplicas desde el inicio:** configurar al menos 2 réplicas del backend para garantizar disponibilidad durante actualizaciones con rolling updates sin downtime.

---

## 5. Evidencias

> Las capturas de pantalla y/o video de demostración se adjuntan por separado como parte de los entregables del proyecto.

Elementos a evidenciar:
- Pods en estado `Running` (`kubectl get pods -n devops-lab`)
- Servicios activos (`kubectl get services -n devops-lab`)
- Frontend accesible desde el browser (`http://<minikube-ip>:30517`)
- Backend respondiendo (`http://<minikube-ip>:30300/api/matches`)
- Escalado a 3 réplicas del backend
- Recreación automática de pod eliminado

---

## 6. Conclusiones

Este proyecto permitió experimentar en la práctica los conceptos fundamentales de Kubernetes. La diferencia más significativa respecto a Docker Compose fue la capacidad del clúster de mantener el estado deseado de forma autónoma: pods que se recrean solos, servicios que permanecen estables ante cambios en los pods, y escalado horizontal con un solo comando.

La curva de aprendizaje principal estuvo en entender la separación entre el entorno del host y el entorno de Minikube, y en comprender que Kubernetes no solo ejecuta contenedores, sino que los opera de forma continua garantizando disponibilidad y consistencia.
