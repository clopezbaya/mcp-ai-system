const fs = require('fs');
const path = require('path');
const RepoAnalyzer = require('../agents/RepoAnalyzer');
const DomAnalyzer = require('../agents/DomAnalyzer');
const TestCaseGenerator = require('../agents/TestCaseGenerator');
const AutomationGenerator = require('../agents/AutomationGenerator');
const FrameworkManager = require('../agents/FrameworkManager');

class McpOrchestrator {
  constructor() {
    this.repoAnalyzer = new RepoAnalyzer();
    this.domAnalyzer = new DomAnalyzer();
    this.testCaseGenerator = new TestCaseGenerator();
    this.automationGenerator = new AutomationGenerator();
    this.frameworkManager = new FrameworkManager();
  }

  /**
   * Procesa una tarea completa de automatización.
   */
  async processTask(payload) {
    let { userStory, domSnapshots, repositoryConfig, options } = payload;
    const executionId = Date.now().toString();

    // 1. NORMALIZACIÓN DE USER STORY (Soporte para archivos .txt)
    if (typeof userStory === 'string' && userStory.endsWith('.txt')) {
      try {
        const huPath = path.isAbsolute(userStory) ? userStory : path.join(process.cwd(), userStory);
        console.log(`[Orchestrator] Leyendo Historia de Usuario desde archivo: ${huPath}`);
        if (fs.existsSync(huPath)) {
          const content = fs.readFileSync(huPath, 'utf8');
          userStory = { description: content }; // Lo enviamos como descripción para que el agente lo procese
        }
      } catch (err) {
        console.error('[Orchestrator] Error al leer archivo de HU:', err.message);
      }
    }

    console.log(`[Orchestrator] Iniciando tarea ${executionId} para la HU`);

    // 2. Analizar Repositorio (si aplica)
    let repoMetadata = null;
    if (repositoryConfig && (repositoryConfig.url || repositoryConfig.localPath)) {
      repoMetadata = await this.repoAnalyzer.analyze(repositoryConfig);
    }

    // 3. Analizar Vistas (DOM)
    const uiMap = await this.domAnalyzer.analyzeViews(domSnapshots, userStory);

    // 4. Generar Casos de Prueba Manuales (Gemini procesará el texto mixto)
    const format = options?.format || 'markdown';
    const manualTests = await this.testCaseGenerator.generate(userStory, uiMap, format);

    // GUARDAR CASOS MANUALES FÍSICAMENTE
    const manualTestsDir = path.join(process.cwd(), 'manual-test-cases');
    const extension = format === 'csv' ? 'csv' : (format === 'markdown' ? 'md' : 'json');
    const manualTestsFileName = `TC-HU-${executionId}.${extension}`;
    const manualTestsFilePath = path.join(manualTestsDir, manualTestsFileName);
    
    fs.writeFileSync(manualTestsFilePath, typeof manualTests === 'string' ? manualTests : JSON.stringify(manualTests, null, 2), 'utf8');
    console.log(`[Orchestrator] Casos de prueba manuales guardados en: ${manualTestsFileName}`);

    // 5. Decidir: Crear o Extender Framework
    const frameworkState = await this.frameworkManager.manage(repoMetadata, options?.platform || 'web');

    // 6. Generar Automatización
    const automationCode = await this.automationGenerator.generate({
      userStory,
      uiMap,
      manualTests,
      repoMetadata,
      frameworkState
    });

    // 7. Aplicar Cambios y Preparar Git
    let gitResult = { branch: null, committed: false };
    let filesCreated = [];

    if (repoMetadata && repoMetadata.repoPath) {
      const { repoPath } = repoMetadata;
      
      // Escribir archivos físicamente y obtener lista de archivos creados
      filesCreated = await this.frameworkManager.applyChanges(repoPath, frameworkState, automationCode);
      
      const branchName = `automation/HU-${executionId}`;
      const commitMessage = `feat(qa): automation for user story ${executionId}`;
      const committed = await this.repoAnalyzer.git.prepareChanges(repoPath, branchName, commitMessage);
      gitResult = { branch: branchName, committed };
    }
    
    // RESPUESTA SIMPLIFICADA (Limpia y profesional)
    return {
      executionId,
      status: 'COMPLETED',
      summary: {
        manualTestsCount: Array.isArray(manualTests) ? manualTests.length : 'Generated',
        automationFilesCreated: filesCreated.length,
        outputDirectory: repoMetadata?.repoPath || 'N/A'
      },
      filesCreated,
      git: gitResult,
      message: "Proceso finalizado exitosamente. Los archivos han sido inyectados en la ruta especificada."
    };
  }
}

module.exports = McpOrchestrator;
