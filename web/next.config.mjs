/** @type {import('next').NextConfig} */
// NEXT_EXPORT=1 next build → paylaşımlı hosting için statik dosya üretir.
// nodemon server.js (dev) → NEXT_EXPORT tanımsız, custom server çalışır.
const isStaticExport = process.env.NEXT_EXPORT === '1';

const nextConfig = {
  ...(isStaticExport && { output: 'export' }),

  // Statik export'ta route uyumu için (custom server'da gereksiz ama zararsız)
  trailingSlash: true,

  // Statik export'ta Next'in image optimizasyon API route'u çalışmaz (Node.js
  // süreci yok), o yüzden orada unoptimized zorunlu. Custom server (server.js)
  // ile çalışırken optimizasyon süreci mevcut, kapatmaya gerek yok.
  images: {
    unoptimized: isStaticExport,
  },

  reactStrictMode: false,

  // server.js (Express) proxy'si sadece kendi çalıştırdığımız Node
  // sürecinde (local dev, klasik VPS) devrede — Vercel custom server
  // çalıştırmaz, server.js orada hiç yürütülmez. Vercel (ve `next start`
  // ile çalışan her ortam) için aynı /api, /admin, /assets yönlendirmesini
  // Next'in kendi rewrites() mekanizmasıyla tekrarlıyoruz, PHP_TARGET env
  // değişkeni gerçek backend URL'ini gösterecek şekilde ayarlanmalı.
  // Statik export'ta (output: 'export') rewrites desteklenmediği için o
  // modda atlanıyor.
  ...(!isStaticExport && {
    async rewrites() {
      const phpTarget = process.env.PHP_TARGET;
      if (!phpTarget) return [];
      return [
        { source: '/api/:path*', destination: `${phpTarget}/api/:path*` },
        { source: '/admin/:path*', destination: `${phpTarget}/admin/:path*` },
        { source: '/assets/:path*', destination: `${phpTarget}/assets/:path*` },
      ];
    },
  }),
};

export default nextConfig;
// /** @type {import('next').NextConfig} */
// const nextConfig = {};

// export default nextConfig;
