/**
 * Admin panelinden yönetilen sözleşme/kurumsal metinlerin tek kaydı.
 *
 * Zincir: /admin/<sayfa> → global_vars → /api/content/<uç>.php → burası.
 *
 * Bu dosyada bilerek `"use client"` YOK: aynı tanımları hem istemci tarafındaki
 * modal (useLegalDocument/LegalBody) hem de sunucuda render edilen public
 * sayfalar (app/<slug>/page.jsx, app/sitemap.js) okuyor. Bir client modülünden
 * import edilseydi sunucu tarafında düz değer olarak okunamazdı.
 */

export const LEGAL_DOCS = {
  privacy: {
    title: 'Gizlilik Politikası',
    endpoint: '/api/content/getprivacy.php',
    contentKey: 'gizlilik_politikasi',
    path: '/gizlilik-politikasi',
    description:
      'Lumanoris kişisel verilerinizi nasıl topluyor, işliyor ve koruyor? ' +
      'Gizlilik politikamızın güncel metni.',
  },
  terms: {
    title: 'Kullanım Koşulları',
    endpoint: '/api/content/getusage.php',
    contentKey: 'kullanim_kosullari',
    path: '/kullanim-kosullari',
    description:
      'Lumanoris platformunu kullanırken geçerli olan kurallar, hak ve ' +
      'yükümlülükler.',
  },
  sale: {
    title: 'Mesafeli Satış Sözleşmesi',
    endpoint: '/api/content/gettermsofsale.php',
    contentKey: 'satis_kosullari',
    path: '/mesafeli-satis-sozlesmesi',
    description:
      'Lumanoris üzerinden yapılan dijital ürün satışlarına ilişkin mesafeli ' +
      'satış sözleşmesi.',
  },
  delivery: {
    title: 'Teslimat ve İade Şartları',
    endpoint: '/api/content/getdelivery.php',
    contentKey: 'teslimat_iade_sartlari',
    path: '/teslimat-ve-iade',
    description:
      'Lumanoris dijital ürünlerinde teslimat süreci, cayma hakkı ve iade ' +
      'koşulları.',
  },
  about: {
    title: 'Hakkımızda',
    endpoint: '/api/content/getabout.php',
    contentKey: 'hakkinda',
    path: '/hakkimizda',
    description:
      'Lumanoris kimdir, neden kuruldu ve yapay zekâ ekosistemine dair ' +
      'vizyonu nedir?',
  },
};

/** Public sayfası açılmış dokümanlar — sitemap ve alt bilgi bağlantıları buradan. */
export const PUBLIC_LEGAL_DOCS = ['about', 'terms', 'privacy', 'delivery', 'sale'];

/** Admin HTML'i için ortak tipografi — her çağrı yerinde tekrarlanmasın. */
export const LEGAL_PROSE =
  "[&_h1]:mb-3 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-white " +
  "[&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-fuchsia-400 " +
  "[&_h3]:mb-1.5 [&_h3]:mt-4 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-white " +
  "[&_p]:mb-3 [&_p]:leading-relaxed " +
  "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 " +
  "[&_em]:text-white/45";
