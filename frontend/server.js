const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Serve static files from current directory
app.use(express.static(__dirname));

// Route handlers for specific HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/services.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'services.html'));
});

app.get('/population.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'population.html'));
});

// Catch all route - serve index.html for SPA behavior
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Frontend server running on port ${PORT}`);
  console.log(`📁 Serving files from: ${__dirname}`);
});
