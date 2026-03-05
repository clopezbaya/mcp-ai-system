const LlmService = require('../integrations/LlmService');

class AutomationGenerator {
  constructor() {
    this.llmService = new LlmService();
  }

  /**
   * Genera código de automatización (Page Objects y Tests).
   * @param {Object} data - { userStory, uiMap, manualTests, repoMetadata, frameworkState }
   */
  async generate(data) {
    const { userStory, uiMap, manualTests, frameworkState } = data;
    console.log(`[AutomationGenerator] Iniciando generación de código para ${frameworkState.framework}`);

    // 1. Construir Prompt para generación de código
    const prompt = this._buildCodePrompt(userStory, uiMap, manualTests);

    // 2. Obtener código de la IA
    const responseText = await this.llmService.generateResponse(prompt, 'Eres un Senior Automation Engineer experto en Playwright y Clean Code.');

    let generatedCode = { pages: [], tests: [] };
    try {
      // Intentamos extraer el JSON de la respuesta
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Garantizar estructura mínima
        generatedCode.pages = parsed.pages || [];
        generatedCode.tests = parsed.tests || [];
      } else {
        throw new Error('No se encontró un JSON válido en la respuesta del LLM');
      }
    } catch (e) {
      console.error('[AutomationGenerator] Error al parsear código generado. Usando fallback.', e);
      generatedCode = this._getFallbackCode();
    }

    return generatedCode;
  }

  _buildCodePrompt(userStory, uiMap, manualTests) {
    return `
      Actúa como un experto en automatización con Playwright.
      Genera el código necesario para automatizar la siguiente Historia de Usuario:
      "${userStory.description}"

      CASOS DE PRUEBA A AUTOMATIZAR:
      ${JSON.stringify(manualTests, null, 2)}

      MAPA DE ELEMENTOS UI (DOM):
      ${JSON.stringify(uiMap, null, 2)}

      REQUISITOS:
      1. Usa el patrón Page Object Model (POM).
      2. Usa selectores robustos del mapa UI (prioriza data-testid).
      3. Genera métodos de acción claros (ej: login(user, pass)).
      4. El código debe ser moderno (async/await).

      RESPONDE ÚNICAMENTE CON UN JSON ESTRUCTURADO ASÍ:
      {
        "pages": [
          { "name": "LoginPage.js", "content": "..." }
        ],
        "tests": [
          { "name": "login.spec.js", "content": "..." }
        ]
      }
    `;
  }

  _getFallbackCode() {
    return {
      pages: [
        { 
          name: 'BasePage.js', 
          content: '/* Error en generación. Revisar configuración de LLM. */' 
        }
      ],
      tests: [
        { 
          name: 'error.spec.js', 
          content: 'test("Error", async () => { console.log("No se pudo generar el test"); });' 
        }
      ]
    };
  }
}

module.exports = AutomationGenerator;
