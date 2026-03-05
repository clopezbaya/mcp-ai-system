require('dotenv').config(); // Carga inmediata de variables de entorno
const express = require('express');
const mcpRoutes = require('./api/mcp.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// Rutas
app.use('/api/mcp', mcpRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'UP', message: 'MCP AI System is running' });
});

app.listen(PORT, () => {
  console.log(`MCP AI System Server running on port ${PORT}`);
});

module.exports = app;
