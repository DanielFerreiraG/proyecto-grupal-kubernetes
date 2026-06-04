# Monitoreo con Prometheus y Grafana

## Arquitectura

```
Docker Compose
├── node-exporter   → métricas del host (CPU, memoria, disco)
├── cAdvisor        → métricas de los contenedores (equivalente a pods)
├── backend         → expone /api/actuator/prometheus (métricas de la app)
├── Prometheus      → recolecta todo lo anterior cada 15 s
└── Grafana         → dashboards sobre los datos de Prometheus
```

## Qué se modificó en el proyecto

- `backend/pom.xml` — se agregaron `spring-boot-starter-actuator` y `micrometer-registry-prometheus`
- `backend/src/main/resources/application.properties` — se habilitó el endpoint `/api/actuator/prometheus`
- `monitoring/prometheus.yml` — configuración de scraping
- `docker-compose.yml` — se agregaron los servicios prometheus, grafana, cadvisor y node-exporter

---

## Levantar el stack

```bash
docker compose up -d
```

Servicios disponibles luego de levantar:

| Servicio       | URL                        |
|----------------|----------------------------|
| Grafana        | http://localhost:3001       |
| Prometheus     | http://localhost:9090       |
| cAdvisor       | http://localhost:8081       |
| node-exporter  | http://localhost:9100       |
| Backend metrics| http://localhost:3000/api/actuator/prometheus |

---

## Verificar que Prometheus recibe métricas

1. Abrir http://localhost:9090/targets
2. Deben aparecer los 4 jobs en estado **UP**:
   - `prometheus`
   - `cadvisor`
   - `node-exporter`
   - `pizza-corrida-api`

Si alguno aparece DOWN, revisar que el contenedor correspondiente esté corriendo:
```bash
docker compose ps
```

---

## Configurar Grafana

### 1. Ingresar a Grafana

- URL: http://localhost:3001
- Usuario: `admin`
- Contraseña: `admin`
- Al primer login pedirá cambiar la contraseña (se puede saltar).

### 2. Agregar Prometheus como Data Source

1. Menú izquierdo → **Connections** → **Data sources** → **Add data source**
2. Seleccionar **Prometheus**
3. En **Prometheus server URL** escribir: `http://prometheus:9090`
4. Hacer clic en **Save & test** — debe aparecer el mensaje verde *"Successfully queried the Prometheus API"*

---

## Importar dashboards listos

### Dashboard de contenedores (cAdvisor) — ID 14282

Muestra: CPU por contenedor, memoria por contenedor, estado de los contenedores.

1. Menú izquierdo → **Dashboards** → **New** → **Import**
2. En el campo **Import via grafana.com** escribir: `14282`
3. Hacer clic en **Load**
4. En **Prometheus** seleccionar el data source que creaste
5. Hacer clic en **Import**

### Dashboard de host (node-exporter) — ID 1860

Muestra: CPU del servidor, memoria RAM, uso de disco, red.

1. Menú izquierdo → **Dashboards** → **New** → **Import**
2. Escribir: `1860`
3. Hacer clic en **Load**
4. Seleccionar el data source Prometheus
5. Hacer clic en **Import**

---

## Dashboard personalizado de la aplicación

Para mostrar métricas propias del backend Spring Boot:

1. Menú izquierdo → **Dashboards** → **New** → **New Dashboard**
2. Hacer clic en **Add visualization**
3. Seleccionar el data source Prometheus
4. En el campo de query escribir cada métrica:

### Queries útiles para la defensa

**Solicitudes HTTP por segundo:**
```
rate(http_server_requests_seconds_count{job="pizza-corrida-api"}[1m])
```

**Tiempo de respuesta promedio (ms):**
```
rate(http_server_requests_seconds_sum{job="pizza-corrida-api"}[1m])
/ rate(http_server_requests_seconds_count{job="pizza-corrida-api"}[1m]) * 1000
```

**Memoria usada por la JVM:**
```
jvm_memory_used_bytes{job="pizza-corrida-api"}
```

**Threads activos:**
```
jvm_threads_live_threads{job="pizza-corrida-api"}
```

**CPU de todos los contenedores:**
```
rate(container_cpu_usage_seconds_total{name=~"pizza_corrida.*"}[1m]) * 100
```

**Memoria de todos los contenedores:**
```
container_memory_usage_bytes{name=~"pizza_corrida.*"}
```

---

## Qué mostrar durante la defensa

| Requisito                  | Dónde mostrarlo                              |
|----------------------------|----------------------------------------------|
| Métricas de pods/contenedores | Dashboard cAdvisor (ID 14282)             |
| CPU y memoria              | Dashboard node-exporter (ID 1860) + cAdvisor |
| Estado de pods/contenedores| http://localhost:9090/targets o cAdvisor     |
| Monitoreo de la aplicación | Dashboard personalizado con queries del backend |

---

## Solución de problemas

**El job `pizza-corrida-api` aparece DOWN en Prometheus:**
- Verificar que el backend está corriendo: `docker compose ps`
- Verificar que el endpoint responde: `curl http://localhost:3000/api/actuator/prometheus`
- Si el backend fue buildeado antes de agregar las dependencias, hay que reconstruir la imagen: `docker compose build backend`

**Grafana no conecta con Prometheus:**
- Asegurarse de usar `http://prometheus:9090` (nombre del servicio Docker), no `localhost`.
