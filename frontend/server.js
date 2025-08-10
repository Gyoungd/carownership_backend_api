const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// 정적 파일 서빙 (dist 또는 현재 디렉토리)
app.use(express.static(path.join(__dirname)));

// API 요청을 백엔드로 프록시
app.use(
  '/api',
  createProxyMiddleware({
    target: process.env.BACKEND_URL || 'http://localhost:8000', // Railway 백엔드 서비스 URL
    changeOrigin: true,
  })
);

// SPA 라우팅 처리
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Frontend server running on port ${PORT}`);
});
