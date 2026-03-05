const fs = require('fs');
const path = require('path');
const RepoAnalyzer = require('../agents/RepoAnalyzer');
const DomAnalyzer = require('../agents/DomAnalyzer');
const TestCaseGenerator = require('../agents/TestCaseGenerator');
const AutomationGenerator = require('../agents/AutomationGenerator');
const FrameworkManager = require('../agents/FrameworkManager');
const LiveScanner = require('../agents/LiveScanner');

class McpOrchestrator {
  constructor() {
    this.repoAnalyzer = new RepoAnalyzer();
    this.domAnalyzer = new DomAnalyzer();
    this.testCaseGenerator = new TestCaseGenerator();
    this.automationGenerator = new AutomationGenerator();
    this.frameworkManager = new FrameworkManager();
    this.liveScanner = new LiveScanner();
  }

  /**
   * Procesa una tarea completa de automatización.
   */
  async processTask(payload) {
    let { userStory, domSnapshots, repositoryConfig, options } = payload;
    const executionId = Date.now().toString();
    const platform = options?.platform || 'web';

    // 1. NORMALIZACIÓN DE USER STORY
    if (typeof userStory === 'string' && userStory.endsWith('.txt')) {
      try {
        const huPath = path.isAbsolute(userStory) ? userStory : path.join(process.cwd(), userStory);
        if (fs.existsSync(huPath)) {
          userStory = { description: fs.readFileSync(huPath, 'utf8') };
        }
      } catch (err) {
        console.error('[Orchestrator] Error al leer archivo de HU:', err.message);
      }
    }

    console.log(`[Orchestrator] Iniciando tarea ${executionId} (${platform})`);

    // 2. ESCANEO EN VIVO (Si aplica y no hay snapshots manuales)
    if (platform === 'web' && (!domSnapshots || domSnapshots.length === 0) && options?.url) {
      console.log(`[Orchestrator] Iniciando modo Live Scan para: ${options.url}`);
      try {
        domSnapshots = await this.liveScanner.scan({
          url: options.url,
          credentials: options.credentials,
          platform
        });
      } catch (err) {
        console.error('[Orchestrator] Falló el escaneo en vivo, procediendo sin snapshots.');
      }
    }

    // 3. Analizar Repositorio
    let repoMetadata = null;
    if (repositoryConfig && (repositoryConfig.url || repositoryConfig.localPath)) {
      repoMetadata = await this.repoAnalyzer.analyze(repositoryConfig);
    }

    // 4. Analizar Vistas (DOM)
    const uiMap = await this.domAnalyzer.analyzeViews(domSnapshots, userStory);

    // 5. Generar Casos de Prueba Manuales
    const format = options?.format || 'markdown';
    const manualTests = await this.testCaseGenerator.generate(userStory, uiMap, format);

    // GUARDAR CASOS MANUALES
    const manualTestsDir = path.join(process.cwd(), 'manual-test-cases');
    const extension = format === 'csv' ? 'csv' : (format === 'markdown' ? 'md' : 'json');
    const manualTestsFileName = `TC-HU-${executionId}.${extension}`;
    fs.writeFileSync(path.join(manualTestsDir, manualTestsFileName), 
      typeof manualTests === 'string' ? manualTests : JSON.stringify(manualTests, null, 2), 'utf8');

    // 6. Decidir Framework
    const frameworkState = await this.frameworkManager.manage(repoMetadata, platform);

    // 7. Generar Automatización
    const automationCode = await this.automationGenerator.generate({
      userStory,
      uiMap,
      manualTests,
      repoMetadata,
      frameworkState
    });

    // 8. Aplicar Cambios
    let gitResult = { branch: null, committed: false };
    let filesCreated = [];

    if (repoMetadata && repoMetadata.repoPath) {
      filesCreated = await this.frameworkManager.applyChanges(repoMetadata.repoPath, frameworkState, automationCode);
      const branchName = `automation/HU-${executionId}`;
      const committed = await this.repoAnalyzer.git.prepareChanges(repoMetadata.repoPath, branchName, `feat(qa): auto-gen for HU ${executionId}`);
      gitResult = { branch: branchName, committed };
    }
    
    return {
      executionId,
      status: 'COMPLETED',
      summary: {
        platform,
        scanMode: (domSnapshots && domSnapshots.length > 0 && domSnapshots[0].name === 'live_scanned_view') ? 'LIVE' : 'MANUAL',
        automationFilesCreated: filesCreated.length,
        outputDirectory: repoMetadata?.repoPath || 'N/A'
      },
      filesCreated,
      manualTestFile: manualTestsFileName,
      git: gitResult
    };
  }
}

module.exports = McpOrchestrator;
