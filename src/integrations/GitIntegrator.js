const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class GitIntegrator {
  constructor() {
    this.tempBaseDir = path.join(process.cwd(), 'temp_repos');
    if (!fs.existsSync(this.tempBaseDir)) {
      fs.mkdirSync(this.tempBaseDir);
    }
  }

  /**
   * Verifica si una ruta es un repositorio Git válido.
   */
  isGitRepo(repoPath) {
    return fs.existsSync(path.join(repoPath, '.git'));
  }

  async cloneRepository(repoUrl) {
    const repoId = uuidv4();
    const targetDir = path.join(this.tempBaseDir, repoId);
    console.log(`[GitIntegrator] Clonando ${repoUrl} en ${targetDir}`);
    try {
      execSync(`git clone --depth 1 ${repoUrl} "${targetDir}"`, { stdio: 'inherit' });
      return targetDir;
    } catch (error) {
      throw new Error(`Error al clonar: ${error.message}`);
    }
  }

  async prepareChanges(repoPath, branchName, message) {
    // Si no es un repo Git, no podemos hacer commits.
    if (!this.isGitRepo(repoPath)) {
      console.log(`[GitIntegrator] La ruta ${repoPath} no es un repositorio Git. Saltando pasos de Git.`);
      return false;
    }

    try {
      console.log(`[GitIntegrator] Preparando rama ${branchName} en ${repoPath}`);
      execSync(`git -C "${repoPath}" config user.name "MCP AI Agent"`, { stdio: 'ignore' });
      execSync(`git -C "${repoPath}" config user.email "mcp-agent@hypernovalabs.com"`, { stdio: 'ignore' });
      execSync(`git -C "${repoPath}" checkout -b ${branchName}`, { stdio: 'inherit' });
      execSync(`git -C "${repoPath}" add .`, { stdio: 'inherit' });
      execSync(`git -C "${repoPath}" commit -m "${message}"`, { stdio: 'inherit' });
      return true;
    } catch (error) {
      console.error('[GitIntegrator] Error al preparar cambios:', error.message);
      return false;
    }
  }

  async cleanUp(repoPath) {
    if (repoPath && repoPath.includes(this.tempBaseDir)) {
      fs.rmSync(repoPath, { recursive: true, force: true });
    }
  }
}

module.exports = GitIntegrator;
