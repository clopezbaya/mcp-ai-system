Resumen del Sistema:

1. Arquitectura de Agentes: Sistema modular orquestado por un núcleo central (McpOrchestrator) que coordina 5 agentes especializados.
2. Inteligencia Artificial: Integración real con Google Gemini (1.5 Flash/Pro) mediante @google/generative-ai para análisis de requerimientos y generación de código.
3. Procesamiento de DOM: Analizador con Limpiador Automático que elimina ruido técnico y extrae selectores robustos (POM).
4. Flexibilidad de Datos: Estructura centralizada en carpeta DATA/ con soporte para archivos .txt (HU) y .html (DOM), permitiendo peticiones JSON ultra-ligeras.
5. Integración Git y Framework: Capacidad de clonar repositorios, crear ramas automáticas e inyectar código de Playwright físicamente en el disco.
6. Documentación: Manuales completos de Pruebas (README_TESTING.md) y Captura (README_DOM_CAPTURE.md) con ejemplos y comandos cURL.

# Manual de Pruebas: MCP AI System 🚀

Este documento detalla los pasos para validar el funcionamiento del sistema MCP utilizando la nueva estructura centralizada de datos.

## 1. Estructura de Datos (Carpeta DATA) 📁

Para una mejor organización, coloca tus archivos en la carpeta `DATA/` del proyecto:

- `DATA/HU/`: Archivos `.txt` con la descripción de las Historias de Usuario.
- `DATA/DOMS/`: Archivos `.html` con las capturas de pantalla (DOM).

## 2. Configuración del Entorno

Asegúrate de tener configurado tu archivo `.env`:

- `LLM_API_KEY`: Tu clave de Google AI Studio (Gemini).
- `LLM_MODEL`: `gemini-1.5-flash` o `gemini-1.5-pro`.

## 3. Iniciar el Servidor

```powershell
npm start
```

## 4. Ejemplo Maestro de Petición (Simplificado) 📝

Copia este JSON en Postman (`POST http://localhost:3000/api/mcp/process`). Nota que ahora solo pasamos las rutas de los archivos:

```json
{
    "userStory": "DATA/HU/HU-123.txt",
    "domSnapshots": [
        {
            "name": "login_screen",
            "html": "DATA/DOMS/login.html"
        }
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

### Importar en Postman (cURL) 📥

Copia este comando y pégalo en el botón **Import -> Raw text** de Postman para cargar la prueba automáticamente:

```bash
curl --location 'http://localhost:3000/api/mcp/process' \
--header 'Content-Type: application/json' \
--data '{
  "userStory": "DATA/HU/HU-123.txt",
  "domSnapshots": [
    {
      "name": "login_screen",
      "html": "DATA/DOMS/login.html"
    }
  ],
  "repositoryConfig": {
    "localPath": "D:/Christian Lopez Baya/Pruebas_MCP_Output"
  },
  "options": {
    "format": "markdown",
    "platform": "web"
  }
}'
```

> **Nota Importante:** Antes de enviar, asegúrate de que la carpeta `D:/Christian Lopez Baya/Pruebas_MCP_Output` exista en tu PC o cámbiala por una ruta válida donde quieras ver el código generado.

### ¿Qué hace la IA con este JSON?

1. **Lee el archivo `.txt`:** Extrae automáticamente el título y los criterios de aceptación del bloque de texto, sin importar el formato.
2. **Lee el archivo `.html`:** Limpia el código ruidoso y extrae los selectores reales.
3. **Genera:** Crea los casos de prueba manuales y el código de Playwright (POM) en la carpeta indicada en `localPath`.

## 5. Configuración del Destino (repositoryConfig)

- **`localPath`**: Crea los archivos físicos en una carpeta de tu PC.
- **`url`**: Clona un repositorio de Git, crea una rama e inyecta el código.
- **`{}`**: Devuelve el código solo en la respuesta JSON (sin crear archivos).

## 6. Resultados y Verificación

- **Respuesta API:** Verás el resumen de la ejecución y los tests generados.
- **Ficheros:** Ve a la carpeta de salida (o `temp_repos/`) para ver tus archivos `.spec.js` y `PageObjects.js`.
