const { chromium } = require('playwright');

class LiveScanner {
  /**
   * Escanea una URL en vivo, opcionalmente realiza login y captura el DOM.
   */
  async scan(config) {
    const { url, credentials, platform } = config;
    
    if (platform !== 'web') {
      console.log('[LiveScanner] Plataforma no soportada para escaneo en vivo. Se requiere captura manual.');
      return null;
    }

    console.log(`[LiveScanner] Iniciando escaneo en vivo de: ${url}`);
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle' });

      // Lógica de Auto-Login (si se proporcionan credenciales)
      if (credentials && credentials.username && credentials.password) {
        console.log('[LiveScanner] Intentando inicio de sesión automático...');
        
        // Intentar detectar campos comunes de login si no se pasan selectores
        const userSelector = 'input[type="text"], input[name*="user"], input[id*="user"], #username';
        const passSelector = 'input[type="password"], #password';
        const submitSelector = 'button[type="submit"], button:has-text("Log"), button:has-text("Entrar")';

        try {
          await page.waitForSelector(userSelector, { timeout: 5000 });
          await page.fill(userSelector, credentials.username);
          await page.fill(passSelector, credentials.password);
          await page.click(submitSelector);
          await page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
          console.log('[LiveScanner] Login completado o navegación detectada.');
        } catch (err) {
          console.warn('[LiveScanner] No se pudo completar el login automático, capturando pantalla actual.');
        }
      }

      // Capturar el DOM limpio directamente desde el navegador
      const cleanDom = await page.evaluate(() => {
        const clone = document.documentElement.cloneNode(true);
        const tagsToRemove = ['script', 'style', 'link', 'svg', 'iframe'];
        tagsToRemove.forEach(tag => clone.querySelectorAll(tag).forEach(el => el.remove()));
        return clone.outerHTML;
      });

      await browser.close();
      
      return [{
        name: 'live_scanned_view',
        html: cleanDom
      }];
    } catch (error) {
      console.error('[LiveScanner] Error durante el escaneo:', error.message);
      await browser.close();
      throw error;
    }
  }
}

module.exports = LiveScanner;
