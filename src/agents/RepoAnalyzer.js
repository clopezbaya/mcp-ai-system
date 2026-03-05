const fs = require('fs');
const path = require('path');
const GitIntegrator = require('../integrations/GitIntegrator');

class RepoAnalyzer {
  constructor() {
    this.git = new GitIntegrator();
  }

  /**
   * Analiza un repositorio para extraer metadatos técnicos.
   */
  async analyze(config) {
    let repoPath = null;
    try {
      // 1. Clonar (si es una URL remota) o usar ruta local
      repoPath = config.url ? await this.git.cloneRepository(config.url) : config.localPath;

      if (!repoPath) {
        throw new Error('No se proporcionó una ruta o URL de repositorio');
      }

      // Si es una ruta local y no existe, la creamos
      if (!config.url && !fs.existsSync(repoPath)) {
        console.log(`[RepoAnalyzer] Creando carpeta local inexistente: ${repoPath}`);
        fs.mkdirSync(repoPath, { recursive: true });
      }

      if (!fs.existsSync(repoPath)) {
        throw new Error(`La ruta ${repoPath} no pudo ser creada o no es válida`);
      }

      console.log(`[RepoAnalyzer] Analizando contenido en ${repoPath}`);

      // 2. Detectar Ecosistema
      const ecosystem = this._detectEcosystem(repoPath);

      // 3. Detectar Framework de Testing
      const framework = this._detectTestingFramework(repoPath, ecosystem);

      // 4. Analizar Estructura (POM, Carpetas)
      const structure = this._analyzeStructure(repoPath);

      const metadata = {
        repoPath,
        ecosystem,
        framework,
        structure,
        hasExistingTests: structure.testFiles.length > 0,
        pomDetected: structure.hasPagesFolder
      };

      console.log(`[RepoAnalyzer] Análisis completado: ${framework} detectado.`);
      
      // Si fue un clon temporal, podríamos querer mantenerlo para la generación 
      // o limpiarlo si solo fue para análisis. Por ahora lo mantenemos.
      return metadata;
    } catch (error) {
      console.error('[RepoAnalyzer] Error durante el análisis:', error);
      return { error: error.message, framework: 'none' };
    }
  }

  _detectEcosystem(repoPath) {
    if (fs.existsSync(path.join(repoPath, 'package.json'))) return 'nodejs';
    if (fs.existsSync(path.join(repoPath, 'pom.xml'))) return 'java-maven';
    if (fs.existsSync(path.join(repoPath, 'build.gradle'))) return 'java-gradle';
    if (fs.existsSync(path.join(repoPath, 'requirements.txt'))) return 'python';
    return 'unknown';
  }

  _detectTestingFramework(repoPath, ecosystem) {
    if (ecosystem === 'nodejs') {
      const pkg = JSON.parse(fs.readFileSync(path.join(repoPath, 'package.json'), 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      if (deps['@playwright/test']) return 'playwright';
      if (deps['cypress']) return 'cypress';
      if (deps['webdriverio']) return 'webdriverio';
      if (deps['selenium-webdriver']) return 'selenium';
    }
    return 'unknown';
  }

  _analyzeStructure(repoPath) {
    const structure = {
      hasPagesFolder: false,
      hasTestsFolder: false,
      pagesPath: '',
      testsPath: '',
      testFiles: []
    };

    // Búsqueda común de carpetas
    const commonFolders = ['pages', 'page-objects', 'screens', 'src/pages'];
    for (const folder of commonFolders) {
      if (fs.existsSync(path.join(repoPath, folder))) {
        structure.hasPagesFolder = true;
        structure.pagesPath = folder;
        break;
      }
    }

    const testFolders = ['tests', 'e2e', 'cypress/e2e', 'specs'];
    for (const folder of testFolders) {
      if (fs.existsSync(path.join(repoPath, folder))) {
        structure.hasTestsFolder = true;
        structure.testsPath = folder;
        // Escanear archivos de prueba (máximo 5)
        const files = fs.readdirSync(path.join(repoPath, folder));
        structure.testFiles = files.filter(f => f.endsWith('.js') || f.endsWith('.ts')).slice(0, 5);
        break;
      }
    }

    return structure;
  }
}

module.exports = RepoAnalyzer;
