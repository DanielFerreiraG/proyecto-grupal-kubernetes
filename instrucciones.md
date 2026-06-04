# Instrucciones: Crear el pipeline de deploy en Jenkins

## Requisitos previos en el servidor

Antes de crear el pipeline, asegurate de que el servidor donde corre Jenkins cumpla lo siguiente:

**1. Docker y Docker Compose instalados**
```bash
docker --version
docker compose version
```

**2. El usuario `jenkins` en el grupo `docker`**
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

**3. Archivos `.env` presentes**

El `docker-compose.prod.yml` necesita estos dos archivos en el workspace del job:
- `backend/.env`
- `frontend/.env`

Si no están en el repo, créalos manualmente en el servidor o agregarlos al repo.

---

## Pasos en la interfaz gráfica de Jenkins

### Paso 1 — Crear un nuevo job

1. En el panel principal de Jenkins, hacer clic en **"Nueva tarea"** (o *New Item*).
2. En el campo **nombre** escribir: `pizza-corrida-deploy` (o el nombre que prefieras).
3. Seleccionar **"Pipeline"**.
4. Hacer clic en **OK**.

---

### Paso 2 — Configurar el pipeline

En la página de configuración del job:

#### Sección "General"
- (Opcional) Agregar una descripción: *"Descarga las últimas imágenes de Docker Hub y levanta los contenedores."*

#### Sección "Pipeline"

1. En el campo **Definition** seleccionar: `Pipeline script from SCM`
2. En **SCM** seleccionar: `Git`
3. En **Repository URL** escribir: `https://github.com/DanielFerreiraG/proyecto-grupal-kubernetes.git`
4. En **Credentials** dejar en `- none -` (el repo es público, no necesita credenciales)
5. En **Branches to build → Branch Specifier** escribir: `*/main`
6. En **Script Path** escribir: `Jenkinsfile.deploy`

> Jenkins lee el `Jenkinsfile.deploy` del repo y lo ejecuta. No necesitás configurar ninguna credencial de Git ni de Docker Hub porque las imágenes son públicas.

---

### Paso 3 — Guardar

Hacer clic en **Guardar** al final de la página.

---

### Paso 4 — Ejecutar el pipeline por primera vez

1. En la página del job, hacer clic en **"Construir ahora"** (*Build Now*).
2. Hacer clic en el número de la build que aparece en "Historial de construcciones" (ej: `#1`).
3. Hacer clic en **"Console Output"** para ver los logs en tiempo real.

Si todo está bien, al final debe verse:
```
Deploy completado: contenedores corriendo con la ultima imagen de Docker Hub.
```

Y el stage *Verificar* mostrará algo como:
```
NAME                    STATUS    PORTS
pizza_corrida_postgres  Up        5432/tcp
pizza_corrida_api       Up        0.0.0.0:3000->3000/tcp
pizza_corrida_frontend  Up        0.0.0.0:5173->5173/tcp
```

---

### Paso 5 — (Opcional) Disparar el deploy automáticamente después del CI

Para que este pipeline corra solo cada vez que el pipeline de build/push termine exitosamente:

1. Ir a la configuración del job `pizza-corrida-deploy`.
2. En la sección **"Disparadores de ejecuciones"** (*Build Triggers*), activar:
   **"Construir después de que se construyan otros proyectos"** (*Build after other projects are built*).
3. Escribir el nombre exacto del pipeline de CI (el que sube las imágenes a Docker Hub).
4. Seleccionar **"Trigger only if build is stable"**.
5. Guardar.

---

## Resumen de puertos

| Servicio   | Puerto |
|------------|--------|
| PostgreSQL | 5432   |
| Backend    | 3000   |
| Frontend   | 5173   |

Asegurate de que esos puertos estén abiertos en el firewall del servidor.
