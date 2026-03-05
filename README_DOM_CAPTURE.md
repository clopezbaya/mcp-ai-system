# Manual de Captura y Limpieza de DOM 🧹

Para que el sistema sea preciso y eficiente, el MCP prefiere recibir el DOM "limpio" y desde archivos locales.

## Flujo de Trabajo Recomendado
1. **Capturar:** Obtén el HTML de la página.
2. **Guardar:** Guárdalo en la carpeta `DOMs/` de este proyecto con extensión `.html`.
3. **Enviar:** Pasa la ruta del archivo al MCP.

## Script de Captura (Consola del Navegador)
Copia y pega este snippet en la consola (F12) de tu navegador para limpiar y guardar el HTML:

```javascript
(function() {
  const clone = document.documentElement.cloneNode(true);
  const tagsToRemove = ['script', 'style', 'link', 'noscript', 'svg', 'iframe', 'meta', 'header', 'footer'];
  tagsToRemove.forEach(tag => clone.querySelectorAll(tag).forEach(el => el.remove()));
  
  const iterator = document.createNodeIterator(clone, NodeFilter.SHOW_COMMENT);
  let node;
  while (node = iterator.nextNode()) node.remove();

  // El sistema MCP ya limpia el HTML automáticamente, pero esto ahorra espacio al guardar.
  const html = clone.outerHTML;
  console.log("Copia este HTML y guárdalo como un archivo .html en la carpeta DOMs/");
  console.log(html);
})();
```

## Integración Automatizada (Playwright)
Si estás automatizando la captura, usa este helper para guardar el archivo:

```javascript
const fs = require('fs');

async function saveCleanDOM(page, fileName) {
  const html = await page.evaluate(() => {
    const clone = document.documentElement.cloneNode(true);
    const tagsToRemove = ['script', 'style', 'link', 'svg'];
    tagsToRemove.forEach(tag => clone.querySelectorAll(tag).forEach(el => el.remove()));
    return clone.outerHTML;
  });
  fs.writeFileSync(`./DOMs/${fileName}.html`, html);
}
```

## Ventajas de Usar Archivos Locals (.html)
- **JSON Limpio:** La petición a la API es pequeña y rápida.
- **Sin Errores de Escape:** No hay problemas con comillas o caracteres raros.
- **Historial:** Mantienes un registro de las vistas que procesaste.
