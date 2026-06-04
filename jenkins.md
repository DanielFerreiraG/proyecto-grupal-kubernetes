# Jenkins — Guía de configuración y uso

## Requisitos previos

- Docker Desktop instalado y corriendo
- Puerto `8080` libre en el host (Jenkins UI)
- Puerto `50000` libre en el host (agentes Jenkins)

---

## 1. Levantar el entorno completo

Desde la raíz del proyecto, ejecutar:

```bash
docker compose up --build -d
```

El flag `--build` reconstruye la imagen de Jenkins si el `Dockerfile` cambió. En el primer arranque, la descarga e instalación de dependencias puede tardar varios minutos.

Para ver los logs en tiempo real:

```bash
docker compose logs -f jenkins
```

Para verificar que todos los contenedores están corriendo:

```bash
docker compose ps
```

La salida debe mostrar los cuatro servicios con estado `Up` o `healthy`:

| Nombre                    | Puerto(s)        |
|---------------------------|------------------|
| `pizza_corrida_postgres`  | 5432             |
| `pizza_corrida_api`       | 3000             |
| `pizza_corrida_frontend`  | 5173             |
| `pizza_corrida_jenkins`   | 8080, 50000      |

---

## 2. Acceder a Jenkins por primera vez

### 2.1 Obtener la contraseña inicial

Jenkins genera una contraseña de administrador en el primer arranque. Para obtenerla:

```bash
docker exec pizza_corrida_jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

O alternativamente desde los logs del contenedor:

```bash
docker compose logs jenkins | grep -A 3 "initialAdminPassword"
```

### 2.2 Abrir la interfaz web

Ingresar a [http://localhost:8080](http://localhost:8080) en el navegador y pegar la contraseña del paso anterior.

---

## 3. Configuración inicial de Jenkins

### 3.1 Instalar plugins

Cuando Jenkins pregunte qué plugins instalar, seleccionar **"Install suggested plugins"**. Esto instala automáticamente Pipeline, Git, Credentials y otros plugins esenciales.

La instalación puede tardar unos minutos dependiendo de la conexión.

### 3.2 Crear el usuario administrador

Completar el formulario con nombre de usuario, contraseña, nombre completo y email. Hacer click en **"Save and Continue"**.

### 3.3 Confirmar la URL de Jenkins

Dejar la URL por defecto (`http://localhost:8080/`) y hacer click en **"Save and Finish"** → **"Start using Jenkins"**.

---

## 4. Instalar plugins adicionales (opcional pero recomendado)

Ir a **Manage Jenkins → Plugins → Available plugins** y buscar/instalar:

| Plugin | Para qué sirve |
|--------|----------------|
| **Docker Pipeline** | Usar la API de Docker directamente en pipelines (`docker.build()`, `docker.image()`) |
| **Pipeline: Stage View** | Visualización de stages por ejecución (suele venir con los sugeridos) |

Marcar los plugins deseados y hacer click en **"Install"**. Reiniciar Jenkins si lo solicita.

---

## 5. Verificar acceso a Docker desde Jenkins

Antes de crear el job, confirmar que el contenedor de Jenkins puede comunicarse con el socket de Docker:

```bash
# Verificar versión de Docker CLI disponible dentro del contenedor
docker exec pizza_corrida_jenkins docker version

# Verificar que docker compose está disponible
docker exec pizza_corrida_jenkins docker compose version

# Verificar que el usuario jenkins tiene permisos sobre el socket
docker exec pizza_corrida_jenkins docker ps
```

Si el último comando devuelve la lista de contenedores (sin error de permisos), todo está correctamente configurado.

### Solución si aparece "permission denied"

En hosts Linux, el GID del grupo docker puede ser diferente a `999`. Verificar el GID real y reconstruir:

```bash
# Obtener el GID del socket en el host
stat -c '%g' /var/run/docker.sock

# Reconstruir pasando el GID correcto (reemplazar 998 con el valor obtenido)
DOCKER_GID=998 docker compose up --build -d
```

En Windows con Docker Desktop este problema generalmente no ocurre.

---

## 6. Pipelines CI/CD separados

El proyecto utiliza dos pipelines independientes:

| Pipeline | Archivo | Responsabilidad |
|----------|---------|-----------------|
| **CI** | `Jenkinsfile.ci` | Checkout → Build → Push a Docker Hub |
| **CD** | `Jenkinsfile.cd` | Pull desde Docker Hub → Deploy |

El flujo completo es:

```
GitHub ──► [CI] Build & Push ──► Docker Hub ──► [CD] Pull & Deploy ──► Contenedores
```

---

### 6.1 Configurar credenciales

#### Credenciales de GitHub

1. Ir a **Manage Jenkins → Credentials → System → Global credentials → Add Credentials**.
2. Completar:
   - *Kind:* `Username with password`
   - *Username:* usuario de GitHub
   - *Password:* Personal Access Token de GitHub
   - *ID:* `github-credentials`

#### Credenciales de Docker Hub

1. En la misma sección, agregar otra credencial:
   - *Kind:* `Username with password`
   - *Username:* usuario de Docker Hub
   - *Password:* contraseña o Access Token de Docker Hub
   - *ID:* `dockerhub-credentials`

---

### 6.2 Ajustar los placeholders

Antes de crear los jobs, reemplazar en `Jenkinsfile.ci`, `Jenkinsfile.cd` y `docker-compose.prod.yml`:

| Placeholder | Reemplazar con |
|---|---|
| `TU_USUARIO_DOCKERHUB` | Nombre de usuario en Docker Hub |
| `TU_ORG/proyecto-grupal-kubernetes.git` | URL real del repositorio en GitHub |

---

### 6.3 Crear el job CI (Build & Push)

1. En el panel principal, hacer click en **"New Item"**.
2. Nombre: `pizza-corrida-ci`.
3. Seleccionar **"Pipeline"** y hacer click en **"OK"**.
4. En la sección **Pipeline**, configurar:
   - *Definition:* `Pipeline script from SCM`
   - *SCM:* `Git`
   - *Repository URL:* URL del repositorio
   - *Credentials:* `github-credentials`
   - *Branch:* `*/main`
   - *Script Path:* `Jenkinsfile.ci`
5. Hacer click en **"Save"**.

**Stages del pipeline CI:**

```
Checkout  →  Build Backend  →  Build Frontend  →  Push to Docker Hub
```

Las imágenes se publican con dos tags: `latest` y el número de build (`BUILD_NUMBER`).

---

### 6.4 Crear el job CD (Pull & Deploy)

1. En el panel principal, hacer click en **"New Item"**.
2. Nombre: `pizza-corrida-cd`.
3. Seleccionar **"Pipeline"** y hacer click en **"OK"**.
4. En la sección **Pipeline**, configurar:
   - *Definition:* `Pipeline script from SCM`
   - *SCM:* `Git`
   - *Repository URL:* URL del repositorio
   - *Credentials:* `github-credentials`
   - *Branch:* `*/main`
   - *Script Path:* `Jenkinsfile.cd`
5. Hacer click en **"Save"**.

**Stages del pipeline CD:**

```
Pull Backend Image  →  Pull Frontend Image  →  Deploy
```

El deploy usa `docker-compose.prod.yml`, que referencia las imágenes del registry en lugar de construirlas localmente.

---

### 6.5 Encadenar CI → CD automáticamente (opcional)

Para que el pipeline CD se dispare automáticamente al finalizar el CI, agregar al final del `Jenkinsfile.ci`:

```groovy
post {
    success {
        build job: 'pizza-corrida-cd', wait: false
    }
}
```

---

## 7. Ejecutar los pipelines

1. Ejecutar primero **`pizza-corrida-ci`** haciendo click en **"Build Now"**.
2. Una vez que el CI termine en verde, ejecutar **`pizza-corrida-cd`**.
3. El progreso de cada build aparece en **"Build History"** → **"Console Output"**.

Si todos los stages completan en verde, las imágenes fueron publicadas en Docker Hub y los contenedores actualizados correctamente.

---

## 8. Apagar el entorno

```bash
# Detener todos los contenedores (preserva volúmenes y datos)
docker compose down

# Detener y eliminar volúmenes (borra datos de Jenkins y PostgreSQL)
docker compose down -v
```
