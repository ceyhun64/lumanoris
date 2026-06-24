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
  // http-proxy-middleware v4: app.use(path, ...) ile mount edersek Express
  // path'i request url'inden siler ve orijinal prefix kaybolur. v4'ün
  // önerdiği yöntem: middleware'i root'a mount edip pathFilter ile
  // eşleştirmek, böylece /admin, /api, /assets prefix'i korunarak PHP'ye
  // aynen iletilir.
  server.use(createProxyMiddleware({
    target: PHP_TARGET,
    changeOrigin: true,
    pathFilter: ['/admin', '/api', '/assets']
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