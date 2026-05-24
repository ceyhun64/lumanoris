/** @type {import('next').NextConfig} */
const nextConfig = {
  // Statik export için gerekli
  output: 'export',

  // Paylaşımlı hostingte route uyumu için
  trailingSlash: true,

  // next/image optimizasyonunu kapatıyoruz (Node.js süreci yok)
  images: {
    unoptimized: true,
  },

  reactStrictMode: false,
  // Eğer siteyi domainin alt dizinine kuracaksan (ör. example.com/site)
  // basePath ve assetPrefix eklemen gerekir:
  // basePath: '/lumanoris',
  // assetPrefix: '/lumanoris/',
};

export default nextConfig;
// /** @type {import('next').NextConfig} */
// const nextConfig = {};

// export default nextConfig;
