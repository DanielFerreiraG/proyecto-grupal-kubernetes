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

## 6. Crear el job de redeploy

### 6.1 Nuevo job

1. En el panel principal, hacer click en **"New Item"**.
2. Ingresar un nombre, por ejemplo: `redeploy-pizza-corrida`.
3. Seleccionar **"Pipeline"** y hacer click en **"OK"**.

### 6.2 Configurar el pipeline

En la pantalla de configuración del job, bajar hasta la sección **Pipeline** y configurar:

- **Definition:** `Pipeline script`
- **Script:** pegar el siguiente código, reemplazando la URL del repositorio:

```groovy
pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = 'pizza_corrida'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/TU_ORG/proyecto-grupal-kubernetes.git'
            }
        }

        stage('Build') {
            steps {
                sh 'docker compose build --no-cache'
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker compose up -d --remove-orphans'
            }
        }
    }

    post {
        failure {
            sh 'docker compose logs --tail=50'
        }
    }
}
```

> La variable `COMPOSE_PROJECT_NAME=pizza_corrida` asegura que los nombres de volúmenes y la red interna sean siempre los mismos, independientemente del directorio de workspace que Jenkins use internamente.

Hacer click en **"Save"**.

### 6.3 Configurar credenciales Git (solo si el repo es privado)

1. Ir a **Manage Jenkins → Credentials → System → Global credentials → Add Credentials**.
2. Completar:
   - *Kind:* `Username with password`
   - *Username:* usuario de GitHub
   - *Password:* Personal Access Token de GitHub
   - *ID:* `github-credentials`
3. En el script del pipeline, referenciar las credenciales:

```groovy
stage('Checkout') {
    steps {
        git branch: 'main',
            url: 'https://github.com/TU_ORG/proyecto-grupal-kubernetes.git',
            credentialsId: 'github-credentials'
    }
}
```

---

## 7. Ejecutar el job

1. En el panel del job, hacer click en **"Build Now"**.
2. El progreso aparece en el panel izquierdo bajo **"Build History"**.
3. Hacer click en el número de build y luego en **"Console Output"** para ver los logs en tiempo real.

Si todos los stages completan en verde, los contenedores fueron reconstruidos y redesplegados correctamente.

---

## 8. Apagar el entorno

```bash
# Detener todos los contenedores (preserva volúmenes y datos)
docker compose down

# Detener y eliminar volúmenes (borra datos de Jenkins y PostgreSQL)
docker compose down -v
```
