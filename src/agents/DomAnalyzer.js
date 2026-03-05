const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

class DomAnalyzer {
  /**
   * Procesa múltiples snapshots de DOM y extrae un mapa de elementos interactivos.
   * @param {Array} snapshots - Lista de objetos { name: string, html: string }
   * @param {Object} userStory - Contexto de la Historia de Usuario (opcional)
   */
  async analyzeViews(snapshots, userStory) {
    if (!snapshots || !Array.isArray(snapshots)) {
      console.log('[DomAnalyzer] No se proporcionaron snapshots de DOM.');
      return [];
    }

    console.log(`[DomAnalyzer] Iniciando análisis de ${snapshots.length} vistas.`);
    const uiMap = [];

    for (const snapshot of snapshots) {
      const { name } = snapshot;
      let { html } = snapshot;

      // 1. DETECTAR SI ES UNA RUTA DE ARCHIVO O HTML PURO
      if (typeof html === 'string' && (html.endsWith('.html') || html.endsWith('.htm'))) {
        try {
          const filePath = path.isAbsolute(html) ? html : path.join(process.cwd(), html);
          console.log(`[DomAnalyzer] Leyendo DOM desde archivo: ${filePath}`);
          if (fs.existsSync(filePath)) {
            html = fs.readFileSync(filePath, 'utf8');
          } else {
            console.error(`[DomAnalyzer] El archivo no existe: ${filePath}`);
            continue; // Saltar esta vista si el archivo no existe
          }
        } catch (err) {
          console.error(`[DomAnalyzer] Error al leer el archivo ${html}:`, err.message);
          continue;
        }
      }

      // 2. LIMPIEZA AUTOMÁTICA (Tolerancia a fallos)
      console.log(`[DomAnalyzer] Limpiando HTML de la vista: ${name}`);
      html = this._cleanHtml(html);

      const $ = cheerio.load(html);
      const elements = [];

      // Buscar inputs, botones, selects y links que parecen botones
      $('input, button, select, textarea, a.btn, a.button, [role="button"]').each((i, el) => {
        const $el = $(el);
        const type = this._getElementType($el);
        const selector = this._getBestSelector($el, $);
        const businessName = this._inferBusinessName($el, $);

        if (selector) {
          elements.push({
            businessName,
            type,
            selector,
            tagName: el.name,
            attributes: el.attribs
          });
        }
      });

      uiMap.push({
        view: name || 'unnamed_view',
        elements: this._deduplicateElements(elements)
      });
    }

    return uiMap;
  }

  /**
   * Determina el tipo de elemento para propósitos de automatización.
   */
  _getElementType($el) {
    const tagName = $el.prop('tagName').toLowerCase();
    if (tagName === 'input') {
      return $el.attr('type') || 'text';
    }
    return tagName;
  }

  /**
   * Genera el selector más robusto disponible para el elemento.
   */
  _getBestSelector($el, $) {
    // 1. data-testid o similares (Prioridad Máxima)
    const testId = $el.attr('data-testid') || $el.attr('data-cy') || $el.attr('data-test');
    if (testId) return `[data-testid="${testId}"]`;

    // 2. ID (Muy robusto si no es dinámico)
    const id = $el.attr('id');
    if (id && !this._isDynamicId(id)) return `#${id}`;

    // 3. Name (Común en formularios)
    const name = $el.attr('name');
    if (name) return `[name="${name}"]`;

    // 4. Aria Label
    const ariaLabel = $el.attr('aria-label');
    if (ariaLabel) return `[aria-label="${ariaLabel}"]`;

    // 5. Placeholder
    const placeholder = $el.attr('placeholder');
    if (placeholder) return `[placeholder="${placeholder}"]`;

    // 6. Texto para botones o links
    const text = $el.text().trim();
    if (($el.prop('tagName').toLowerCase() === 'button' || $el.attr('role') === 'button') && text && text.length < 30) {
      return `text="${text}"`; // Sintaxis compatible con Playwright
    }

    // 7. Selector CSS básico como último recurso
    return null;
  }

  /**
   * Intenta darle un nombre de negocio al elemento basado en etiquetas o atributos.
   */
  _inferBusinessName($el, $) {
    // Si tiene un data-testid, lo usamos como base
    const testId = $el.attr('data-testid') || $el.attr('data-cy');
    if (testId) return this._toCamelCase(testId);

    // Buscar label asociado por ID
    const id = $el.attr('id');
    if (id) {
      const labelText = $(`label[for="${id}"]`).text().trim();
      if (labelText) return this._toCamelCase(labelText);
    }

    // Buscar texto dentro del botón
    const text = $el.text().trim();
    if (text && text.length < 20) return this._toCamelCase(text);

    // Placeholder o Name
    const hint = $el.attr('placeholder') || $el.attr('name') || 'element';
    return this._toCamelCase(hint);
  }

  _isDynamicId(id) {
    // Detectar IDs que parecen autogenerados (ej: ember123, _ngcontent-...)
    return /([0-9]{4,})|ember|ng-|guid/.test(id);
  }

  _toCamelCase(str) {
    return str
      .replace(/[^a-zA-Z0-9 ]/g, ' ')
      .split(' ')
      .map((word, index) => {
        if (index === 0) return word.toLowerCase();
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('')
      .substring(0, 30);
  }

  /**
   * Limpia el HTML de etiquetas y atributos ruidosos para optimizar el análisis y el uso de tokens.
   */
  _cleanHtml(html) {
    if (!html) return '';
    const $ = cheerio.load(html);

    // 1. Eliminar etiquetas que no aportan valor a la identificación de elementos de negocio
    $('script, style, link, noscript, svg, iframe, meta, header, footer, path, symbol').remove();

    // 2. Eliminar comentarios HTML
    $.root().find('*').contents().each((i, el) => {
      if (el.type === 'comment') {
        $(el).remove();
      }
    });

    // 3. Eliminar atributos pesados y ruidosos (estilos inline, clases de diseño masivas)
    $('*').each((i, el) => {
      const $el = $(el);
      $el.removeAttr('style');
      $el.removeAttr('onclick'); // Por seguridad y limpieza
      
      // Si la clase es demasiado larga (común en Tailwind), la truncamos o limpiamos para ahorrar espacio
      const className = $el.attr('class');
      if (className && className.length > 100) {
        $el.attr('class', className.substring(0, 50) + '...[truncated]');
      }
    });

    return $.html();
  }

  _deduplicateElements(elements) {
    const seen = new Set();
    return elements.filter(el => {
      const key = `${el.type}:${el.selector}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

module.exports = DomAnalyzer;
