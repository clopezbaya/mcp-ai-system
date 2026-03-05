# Manual de Pruebas: MCP AI System 🚀

Este documento detalla los pasos para validar el funcionamiento del sistema MCP (Model Context Protocol).

## 1. Configuración del Entorno
Asegúrate de tener configurado tu archivo `.env`:
- `LLM_API_KEY`: Tu clave de Google AI Studio (Gemini).
- `LLM_MODEL`: `gemini-1.5-flash` o `gemini-1.5-pro`.

## 2. Iniciar el Servidor
```powershell
npm start
```

## 3. Ejemplo 1: Trabajo en Carpeta Local (Snapshot Manual) 💻
Este script lee un archivo HTML local y genera el código en una carpeta de tu PC.

### JSON de la Petición:
```json
{
  "userStory": "DATA/HU/HU-123.txt",
  "domSnapshots": [
    { "name": "login_view", "html": "DATA/DOMS/login.html" }
  ],
  "repositoryConfig": {
    "localPath": "D:/Christian Lopez Baya/Pruebas_MCP_Output"
  },
  "options": {
    "format": "markdown",
    "platform": "web"
  }
}
```

### Comando cURL:
```bash
curl --location 'http://localhost:3000/api/mcp/process' \
--header 'Content-Type: application/json' \
--data '{
  "userStory": "DATA/HU/HU-123.txt",
  "domSnapshots": [{ "name": "login_view", "html": "DATA/DOMS/login.html" }],
  "repositoryConfig": { "localPath": "D:/Christian Lopez Baya/Pruebas_MCP_Output" },
  "options": { "format": "markdown", "platform": "web" }
}'
```

---

## 4. Ejemplo 2: Trabajo en GitHub (Live Scan Automático) 🌐
Este script clona un repositorio remoto, escanea una web en vivo y crea una rama con los cambios.

### JSON de la Petición:
```json
{
  "userStory": "DATA/HU/HU-123.txt",
  "repositoryConfig": {
    "url": "https://github.com/tu-usuario/tu-repo-qa.git"
  },
  "options": {
    "platform": "web",
    "url": "https://the-internet.herokuapp.com/login",
    "credentials": {
      "username": "tomsmith",
      "password": "SuperSecretPassword!"
    },
    "format": "markdown"
  }
}
```

### Comando cURL:
```bash
curl --location 'http://localhost:3000/api/mcp/process' \
--header 'Content-Type: application/json' \
--data '{
  "userStory": "DATA/HU/HU-123.txt",
  "repositoryConfig": { "url": "https://github.com/tu-usuario/tu-repo-qa.git" },
  "options": {
    "platform": "web",
    "url": "https://the-internet.herokuapp.com/login",
    "credentials": { "username": "tomsmith", "password": "SuperSecretPassword!" },
    "format": "markdown"
  }
}'
```

---

## 5. Resumen de Opciones Técnicas ⚙️

| Campo | Opción | Descripción |
| :--- | :--- | :--- |
| `userStory` | `Ruta .txt` | Lee la historia de usuario desde la carpeta `DATA/HU/`. |
| `domSnapshots` | `Ruta .html` | (Opcional) Usa capturas manuales de la carpeta `DATA/DOMS/`. |
| `repositoryConfig.localPath` | `Ruta Disco` | Genera los archivos directamente en esa carpeta de tu PC. |
| `repositoryConfig.url` | `URL Git` | Clona el repo en `temp_repos/`, crea rama y commit automático. |
| `options.url` | `URL Web` | Activa el **Live Scanner** (si no envías snapshots manuales). |
| `options.credentials` | `User/Pass` | Permite al Live Scanner loguearse antes de capturar el DOM. |

## 6. Resultados y Verificación
- **summary.scanMode:** Indica si se usó `LIVE` o `MANUAL`.
- **manual-test-cases/:** Revisa esta carpeta para ver tus Casos de Prueba en Markdown/CSV.
- **Archivos Generados:** Revisa la ruta de `localPath` o la carpeta temporal del repo para ver las `Pages` y `Specs`.
