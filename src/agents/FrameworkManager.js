const fs = require('fs');
const path = require('path');

class FrameworkManager {
  /**
   * Gestiona la estructura del framework (Bootstrap o Extension).
   */
  async manage(repoMetadata, platform = 'web') {
    const isExtension = repoMetadata && repoMetadata.framework !== 'unknown';
    console.log(`[FrameworkManager] Modo: ${isExtension ? 'EXTENSION' : 'BOOTSTRAP'}`);

    return {
      action: isExtension ? 'EXTEND' : 'BOOTSTRAP',
      framework: isExtension ? repoMetadata.framework : 'playwright',
      config: isExtension ? repoMetadata.structure : this._getDefaultStructure(platform)
    };
  }

  /**
   * Escribe los archivos generados en el repositorio.
   */
  async applyChanges(repoPath, frameworkState, automationCode) {
    console.log(`[FrameworkManager] Aplicando cambios en ${repoPath}`);
    
    const { pages, tests } = automationCode;
    const structure = frameworkState.config;
    const createdFiles = [];

    // 1. Crear carpetas si no existen
    const pagesDir = path.join(repoPath, structure.pagesPath || 'pages');
    const testsDir = path.join(repoPath, structure.testsPath || 'tests');

    if (!fs.existsSync(pagesDir)) fs.mkdirSync(pagesDir, { recursive: true });
    if (!fs.existsSync(testsDir)) fs.mkdirSync(testsDir, { recursive: true });

    // 2. Escribir Page Objects
    pages.forEach(page => {
      const filePath = path.join(pagesDir, page.name);
      fs.writeFileSync(filePath, page.content, 'utf8');
      console.log(`[FrameworkManager] Page Object creado: ${page.name}`);
      createdFiles.push(`${structure.pagesPath}/${page.name}`);
    });

    // 3. Escribir Tests
    tests.forEach(test => {
      const filePath = path.join(testsDir, test.name);
      fs.writeFileSync(filePath, test.content, 'utf8');
      console.log(`[FrameworkManager] Test Spec creado: ${test.name}`);
      createdFiles.push(`${structure.testsPath}/${test.name}`);
    });

    return createdFiles;
  }

  _getDefaultStructure(platform) {
    return {
      pagesPath: platform === 'web' ? 'pages/web' : 'pages/mobile',
      testsPath: platform === 'web' ? 'tests/web' : 'tests/mobile',
      testFiles: []
    };
  }
}

module.exports = FrameworkManager;
