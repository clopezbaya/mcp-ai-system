const LlmService = require('../integrations/LlmService');

class TestCaseGenerator {
  constructor() {
    this.llmService = new LlmService();
  }

  /**
   * Genera casos de prueba manuales basados en la HU y el mapa de UI.
   * @param {Object} userStory - Objeto con titulo, descripcion y criterios de aceptacion.
   * @param {Array} uiMap - Mapa de elementos extraídos del DOM.
   * @param {String} format - 'markdown' | 'csv' | 'json'
   */
  async generate(userStory, uiMap, format = 'markdown') {
    console.log(`[TestCaseGenerator] Iniciando generación de casos para: ${userStory.title || 'HU'}`);

    // Construcción del Prompt para el LLM
    const prompt = this._buildPrompt(userStory, uiMap);
    
    // Obtener respuesta de la IA
    const responseText = await this.llmService.generateResponse(prompt, 'Eres un QA Lead experto en diseño de pruebas.');
    
    let testCases = [];
    try {
      testCases = JSON.parse(responseText);
    } catch (e) {
      console.error('[TestCaseGenerator] Error al parsear respuesta del LLM. Usando fallback.', e);
      testCases = this._getFallbackTestCases();
    }

    // Retornar en el formato solicitado
    return this._formatOutput(testCases, format);
  }

  _buildPrompt(userStory, uiMap) {
    const storyText = typeof userStory === 'string' ? userStory : 
                     (userStory.description || userStory.title || 'Historia de usuario mixta');
    
    return `
      Actúa como un QA Lead Senior. Genera casos de prueba manuales detallados basándote en la siguiente información de la Historia de Usuario:
      
      CONTENIDO DE LA HISTORIA:
      ${storyText}

      CONTEXTO ADICIONAL (Si existe):
      Título: ${userStory.title || 'N/A'}
      Criterios de Aceptación: ${userStory.acceptanceCriteria || 'Extraer del contenido de la historia'}

      Usa este Mapa de UI para guiarte en los pasos y selectores reales:
      ${JSON.stringify(uiMap, null, 2)}

      IMPORTANTE:
      1. Si la Historia de Usuario viene como un solo bloque de texto, identifica tú mismo los Criterios de Aceptación implícitos.
      2. Genera casos de prueba positivos, negativos y de validación.
      3. El JSON debe ser un array de objetos con esta estructura exacta:
         { "id": "TC-00X", "name": "...", "preconditions": "...", "steps": "...", "data": "...", "expected": "...", "priority": "..." }
      4. RESPONDE ÚNICAMENTE CON EL JSON.
    `;
  }

  _formatOutput(testCases, format) {
    if (format === 'csv') {
      const header = 'ID;Test Case;Preconditions;Steps;Data;Expected Result;Priority\n';
      const rows = testCases.map(tc => 
        `"${tc.id}";"${tc.name}";"${tc.preconditions}";"${tc.steps.replace(/\n/g, ' ')}";"${tc.data}";"${tc.expected}";"${tc.priority}"`
      ).join('\n');
      return header + rows;
    }

    if (format === 'markdown') {
      let md = '# Casos de Prueba Generados\n\n';
      testCases.forEach(tc => {
        md += `## ${tc.id}: ${tc.name}\n`;
        md += `**Prioridad:** ${tc.priority}\n\n`;
        md += `**Precondiciones:**\n${tc.preconditions}\n\n`;
        md += `**Pasos:**\n${tc.steps}\n\n`;
        md += `**Datos:** \`${tc.data}\`\n\n`;
        md += `**Resultado Esperado:**\n${tc.expected}\n\n`;
        md += '---\n\n';
      });
      return md;
    }

    return testCases; // Default JSON
  }

  _getFallbackTestCases() {
    return [{
      id: 'TC-ERR',
      name: 'Error en generación',
      preconditions: 'N/A',
      steps: 'Revisar logs del sistema',
      data: '{}',
      expected: 'N/A',
      priority: 'Low'
    }];
  }
}

module.exports = TestCaseGenerator;
