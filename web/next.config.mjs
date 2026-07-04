/** @type {import('next').NextConfig} */
// NEXT_EXPORT=1 next build → paylaşımlı hosting için statik dosya üretir.
// nodemon server.js (dev) → NEXT_EXPORT tanımsız, custom server çalışır.
const isStaticExport = process.env.NEXT_EXPORT === '1';

const nextConfig = {
  ...(isStaticExport && { output: 'export' }),

  // Statik export'ta route uyumu için (custom server'da gereksiz ama zararsız)
  trailingSlash: true,

  // next/image optimizasyonunu kapatıyoruz (Node.js süreci yok)
  images: {
    unoptimized: true,
  },

  reactStrictMode: false,
};

export default nextConfig;
// /** @type {import('next').NextConfig} */
// const nextConfig = {};

// export default nextConfig;
