const express = require('express');
const next = require('next');
const { createProxyMiddleware } = require('http-proxy-middleware');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Pin the loopback family explicitly. On Windows "localhost" resolves to ::1
// first, so `php -S localhost:8000` bound IPv6-only while this server binds
// 127.0.0.1 — the two sat on different stacks, and setting
// PHP_TARGET=http://127.0.0.1:8000 made every proxied call fail with
// ECONNREFUSED. Both sides now agree on 127.0.0.1 (see autostart.bat and
// package.json's dev:all).
const PHP_TARGET = process.env.PHP_TARGET || 'http://127.0.0.1:8000';

// DEP-005 🟡 — port ve bind adresi kodda sabitti (3000 / 127.0.0.1). Bir PaaS
// ya da container ortamı portu PORT ile bildirir ve 127.0.0.1'e bağlanan bir
// süreç dışarıdan hiç erişilemez. İkisi de artık ortamdan geliyor;
// varsayılanlar yerel geliştirmeyle aynı.
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || (dev ? '127.0.0.1' : '0.0.0.0');

// Aynı bulgunun ikinci yarısı: NODE_ENV hiçbir yerde set edilmiyordu, yani
// `next build` çıktısı production'da bile dev modunda çalışabiliyordu.
// Sessizce doğru varsaymak yerine, ne modda çalıştığımızı açıkça yazıyoruz.
console.log(`[server] NODE_ENV=${process.env.NODE_ENV || '(tanımsız → development)'} PORT=${PORT} HOST=${HOST} PHP_TARGET=${PHP_TARGET}`);

app.prepare().then(() => {
  const server = express();

  // DEP-005: health check yoktu. Load balancer / container orchestrator /
  // uptime izleme, sürecin ayakta olup olmadığını başka türlü anlayamıyordu.
  // Next hazır olduktan SONRA mount ediliyor, yani 200 dönmesi gerçekten
  // "istek alabilirim" demek. Proxy'nin ÖNÜNDE duruyor ki PHP kapalıyken de
  // Node'un kendi durumu okunabilsin.
  server.get('/healthz', (req, res) => {
    res.status(200).json({
      status: 'ok',
      uptime_seconds: Math.round(process.uptime()),
      node_env: process.env.NODE_ENV || 'development',
    });
  });

  // PHP’ye proxy: Admin panel
  // http-proxy-middleware v4: app.use(path, ...) ile mount edersek Express
  // path'i request url'inden siler ve orijinal prefix kaybolur. v4'ün
  // önerdiği yöntem: middleware'i root'a mount edip pathFilter ile
  // eşleştirmek, böylece /admin, /api, /assets prefix'i korunarak PHP'ye
  // aynen iletilir.
  server.use(createProxyMiddleware({
    target: PHP_TARGET,
    changeOrigin: true,
    pathFilter: ['/admin', '/api', '/assets'],
    on: {
      // Default on error is a plain-text page ("Error occurred while trying
      // to proxy..."). Every /api/*.php consumer does JSON.parse(await
      // res.text()) with no res.ok check, so when the PHP server is down
      // that plain-text body throws a confusing "not valid JSON" syntax
      // error instead of a clean, catchable failure — return real JSON here.
      error: (err, req, res) => {
        console.error('PHP proxy error:', err.code || err.name || 'UNKNOWN', '-', err.message || '(no message)', '->', PHP_TARGET + (req.url || ''));
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
        }
        res.end(JSON.stringify({ success: false, message: 'Backend sunucusuna ulaşılamıyor.' }));
      },
    },
  }));

  // Next.js sayfaları ve asset’ler
  // Tüm yolları yakalamak için
  server.use((req, res) => {
    return handle(req, res);
  });

  const httpServer = server.listen(PORT, HOST, (err) => {
    if (err) throw err;
    console.log(`[server] Ready on http://${HOST}:${PORT}`);
  });

  // DEP-005: graceful shutdown yoktu. SIGTERM alan süreç anında ölüyordu,
  // yani devam eden her istek (SSE sohbet akışları dahil) yarıda kesiliyordu
  // ve her dağıtım kullanıcıya görünür bir hata üretiyordu.
  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[server] ${signal} alındı, yeni bağlantılar kapatılıyor…`);

    const forceExit = setTimeout(() => {
      console.error('[server] Zaman aşımı — süreç zorla kapatılıyor.');
      process.exit(1);
    }, 15000);
    forceExit.unref();

    httpServer.close((closeErr) => {
      clearTimeout(forceExit);
      if (closeErr) {
        console.error('[server] Kapatma hatası:', closeErr.message);
        process.exit(1);
      }
      console.log('[server] Tüm istekler tamamlandı, çıkılıyor.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
});
