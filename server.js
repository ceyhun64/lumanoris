const express = require('express');
const next = require('next');
const { createProxyMiddleware } = require('http-proxy-middleware');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PHP_TARGET = process.env.PHP_TARGET || 'http://localhost:8000';

app.prepare().then(() => {
  const server = express();

  // PHP’ye proxy: Admin panel
  server.use('/admin', createProxyMiddleware({
    target: PHP_TARGET + "/admin",
    changeOrigin: true
  }));

  server.use('/api', createProxyMiddleware({
    target: PHP_TARGET + "/api",
    changeOrigin: true
  }));

  server.use('/assets', createProxyMiddleware({
    target: PHP_TARGET + "/assets",
    changeOrigin: true
  }));

  // Next.js sayfaları ve asset’ler
  // Tüm yolları yakalamak için
    server.use((req, res) => {
  return handle(req, res);
});

  server.listen(3000, '127.0.0.1', (err) => {
    if (err) throw err;
    console.log('Ready on http://localhost:3000');
  });
});