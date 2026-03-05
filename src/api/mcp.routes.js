const express = require('express');
const router = express.Router();
const McpOrchestrator = require('../orchestrator/McpOrchestrator');

const orchestrator = new McpOrchestrator();

/**
 * POST /api/mcp/process
 * Recibe HU, DOM snapshots y datos del repositorio para procesar automatización.
 */
router.post('/process', async (req, res) => {
  try {
    const { userStory, domSnapshots, repositoryConfig, options } = req.body;
    
    if (!userStory) {
      return res.status(400).json({ error: 'User Story es obligatoria' });
    }

    const result = await orchestrator.processTask({
      userStory,
      domSnapshots,
      repositoryConfig,
      options
    });

    res.json(result);
  } catch (error) {
    console.error('Error in MCP process:', error);
    res.status(500).json({ 
      error: 'Error interno del MCP AI System',
      details: error.message 
    });
  }
});

module.exports = router;
