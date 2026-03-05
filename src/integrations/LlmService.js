const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Servicio para interactuar con Google Gemini.
 * Utiliza la librería oficial @google/generative-ai.
 */
class LlmService {
  constructor() {
    this.apiKey = process.env.LLM_API_KEY;
    this.modelName = process.env.LLM_MODEL || 'gemini-1.5-flash';
    this.model = null;
    
    this._initializeModel();
  }

  _initializeModel() {
    // Intentamos cargar la API Key directamente del entorno actual
    const currentKey = process.env.LLM_API_KEY;
    
    if (currentKey && currentKey !== 'tu_api_key_aqui') {
      try {
        this.genAI = new GoogleGenerativeAI(currentKey);
        this.model = this.genAI.getGenerativeModel({ model: this.modelName });
        console.log(`[LlmService] Inteligencia de Gemini (${this.modelName}) habilitada correctamente.`);
      } catch (err) {
        console.error('[LlmService] Error al inicializar el SDK de Google AI:', err.message);
      }
    } else {
      console.warn('[LlmService] No se detectó LLM_API_KEY en .env. El sistema funcionará en MODO SIMULACIÓN.');
    }
  }

  /**
   * Genera una respuesta utilizando Google Gemini.
   */
  async generateResponse(prompt, systemContext = '') {
    // Si el modelo no se inicializó al arranque, reintamos por si dotenv tardó
    if (!this.model) {
      this._initializeModel();
    }

    console.log(`[LlmService] Generando respuesta para: ${this.model ? 'Gemini AI' : 'Mock Simulator'}`);
    
    if (!this.model) {
      return this._mockResponse(prompt);
    }

    try {
      const fullPrompt = systemContext ? `${systemContext}\n\n${prompt}` : prompt;
      
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      let text = response.text();
      
      // Limpiar bloques de código Markdown que la IA suele añadir (```json ... ```)
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return text;
    } catch (error) {
      console.error('[LlmService] Error crítico en la llamada a Gemini:', error.message);
      return this._mockResponse(prompt);
    }
  }

  _mockResponse(prompt) {
    const p = prompt.toLowerCase();
    
    // Simulación para Casos de Prueba Manuales
    if (p.includes('casos de prueba') || p.includes('test cases')) {
      return JSON.stringify([
        {
          id: 'TC-001',
          name: 'Validación de API Key (Simulado)',
          preconditions: 'El usuario debe configurar LLM_API_KEY en el archivo .env',
          steps: '1. Abre .env\n2. Ingresa tu API Key de Google\n3. Reinicia con npm start',
          data: '{"key": "missing"}',
          expected: 'Que el servidor use inteligencia real en lugar de este mensaje.',
          priority: 'CRITICAL'
        }
      ]);
    }
    
    // Simulación para Código de Automatización
    return JSON.stringify({ 
      pages: [{ name: 'PlaceholderPage.js', content: '// Código simulado - Revisa tu API Key' }], 
      tests: [{ name: 'placeholder.spec.js', content: '// Código simulado' }] 
    });
  }
}

module.exports = LlmService;
