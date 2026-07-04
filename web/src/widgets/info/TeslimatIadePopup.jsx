'use client';
import { useState, useEffect } from 'react';

export default function DeliveryAndReturnPopup({ onClose }) {
    const [info, setInfo] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchInfo() {
            try {
                const res = await fetch("/api/content/getdelivery.php");
                const resultText = await res.text();
                const result = JSON.parse(resultText);
                setInfo(result.teslimat_iade_sartlari);
            } catch (err) {
                console.error("Error:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchInfo();
    }, []);

    // Kapatma SVG ikonu (Aynı kalabilir)
    const closeSvg = (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.0008 13.4008L7.10078 18.3008C6.91745 18.4841 6.68411 18.5758 6.40078 18.5758C6.11745 18.5758 5.88411 18.4841 5.70078 18.3008C5.51745 18.1174 5.42578 17.8841 5.42578 17.6008C5.42578 17.3174 5.51745 17.0841 5.70078 16.9008L10.6008 12.0008L5.70078 7.10078C5.51745 6.91745 5.42578 6.68411 5.42578 6.40078C5.42578 6.11745 5.51745 5.88411 5.70078 5.70078C5.88411 5.51745 6.11745 5.42578 6.40078 5.42578C6.68411 5.42578 6.91745 5.51745 7.10078 5.70078L12.0008 10.6008L16.9008 5.70078C17.0841 5.51745 17.3174 5.42578 17.6008 5.42578C17.8841 5.42578 18.1174 5.51745 18.3008 5.70078C18.4841 5.88411 18.5758 6.11745 18.5758 6.40078C18.5758 6.68411 18.4841 6.91745 18.3008 7.10078L13.4008 12.0008L18.3008 16.9008C18.4841 17.0841 18.5758 17.3174 18.5758 17.6008C18.5758 17.8841 18.4841 18.1174 18.3008 18.3008C18.1174 18.4841 17.8841 18.5758 17.6008 18.5758C17.3174 18.5758 17.0841 18.4841 16.9008 18.3008L12.0008 13.4008Z" fill="#FF99D6" />
        </svg>
    );

    const termsOfSaleContent = [
        // (Yukarıda tanımlanan tüm yapısal veri buraya gelecek)
        { 
            type: 'title', 
            text: 'Teslimat ve İade Şartları', 
            style: { fontSize: '1.4em', fontWeight: 'bold', marginBottom: '5px' } 
        },
        { 
            type: 'subtitle', 
            text: 'Dijital Ürün Teslimat ve İade Politikası', 
            style: { fontSize: '0.9em', color: '#ccc', marginBottom: '20px' } 
        },
        // Bölüm 1
        { 
            type: 'header', 
            text: '1. Teslimat Koşulları', 
            style: { fontWeight: 'bold', fontSize: '1.1em', marginTop: '20px', color: '#FF66C4' } 
        },
        { 
            type: 'paragraph', 
            text: 'LUMANORIS üzerinden satın alınan tüm ürünler dijital ürün niteliğindedir. Fiziksel gönderim yapılmamaktadır.' 
        },
        { 
            type: 'paragraph', 
            text: 'Satın alma işlemi başarıyla tamamlandıktan sonra:' 
        },
        { 
            type: 'list', 
            items: [
                'Ürün, kullanıcı hesabına otomatik olarak tanımlanır',
                've/veya Satın alma sırasında belirtilen e-posta adresine dijital erişim bilgileri gönderilir.'
            ] 
        },
        { 
            type: 'paragraph', 
            text: 'Teslimat, ödeme onayının ardından anında veya sistemsel yoğunluğa bağlı olarak en geç 24 saat içerisinde gerçekleştirilir.' 
        },
        { 
            type: 'paragraph', 
            text: 'Kullanıcının hatalı e-posta adresi bildirmesi veya teknik sorunlar nedeniyle teslimatın gerçekleşmemesi durumunda, kullanıcı LUMANORIS ile iletişime geçmelidir.' 
        },
        { 
            type: 'subHeader', 
            text: 'İletişim adresleri:', 
            style: { fontWeight: 'bold', fontSize: '1em', marginTop: '10px' } 
        },
        { 
            type: 'list', 
            items: ['lumanoris.ai@gmail.com', 'lumanoris.help@gmail.com'] 
        },
        // Bölüm 2
        { 
            type: 'header', 
            text: '2. İade ve Cayma Hakkı', 
            style: { fontWeight: 'bold', fontSize: '1.1em', marginTop: '20px', color: '#FF66C4' } 
        },
        { 
            type: 'paragraph', 
            text: 'Satışı yapılan ürünler dijital içerik, yazılım, yapay zeka modeli, abonelik ve benzeri anında teslim edilen dijital hizmetler kapsamındadır.' 
        },
        { 
            type: 'paragraph', 
            text: '6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca:' 
        },
        { 
            type: 'list', 
            items: [
                'Anında ifa edilen dijital içeriklerde,',
                'Kullanıcı onayı ile erişim sağlanan ürünlerde,',
                'İndirilebilir veya kopyalanabilir dijital ürünlerde cayma hakkı kullanılamamaktadır.'
            ] 
        },
        { 
            type: 'paragraph', 
            text: 'Satın alma işlemini tamamlayan kullanıcı, dijital içeriğin anında teslim edileceğini ve bu kapsamda cayma hakkından feragat ettiğini kabul etmiş sayılır.' 
        },
        // Bölüm 3
        { 
            type: 'header', 
            text: '3. İstisnai Durumlar', 
            style: { fontWeight: 'bold', fontSize: '1.1em', marginTop: '20px', color: '#FF66C4' } 
        },
        { 
            type: 'paragraph', 
            text: 'Aşağıdaki durumlarda iade değerlendirmesi yapılabilir:' 
        },
        { 
            type: 'list', 
            items: [
                'Ürünün kullanıcı hesabına hiç tanımlanmamış olması',
                'Teknik bir hata nedeniyle hizmete erişim sağlanamaması',
                'Aynı ürün için mükerrer ödeme yapılması'
            ] 
        },
        { 
            type: 'paragraph', 
            text: 'Bu gibi durumlarda kullanıcı, ödeme tarihinden itibaren 7 gün içerisinde LUMANORIS ile iletişime geçmelidir.' 
        },
        // Bölüm 4
        { 
            type: 'header', 
            text: '4. Sorumluluk', 
            style: { fontWeight: 'bold', fontSize: '1.1em', marginTop: '20px', color: '#FF66C4' } 
        },
        { 
            type: 'list', 
            items: [
                'LUMANORIS, kullanıcı kaynaklı hatalardan (yanlış e-posta, yanlış paket seçimi, sistem gereksinimlerini karşılama vb.) sorumlu değildir.',
                'Kullanıcı, satın almadan önce ürün açıklamalarını dikkatle incelemekle yükümlüdür.'
            ] 
        },
        // Bölüm 5
        { 
            type: 'header', 
            text: '5. Şirket Bilgileri', 
            style: { fontWeight: 'bold', fontSize: '1.1em', marginTop: '20px', color: '#FF66C4' } 
        },
        { 
            type: 'list', 
            items: [
                'Şirket Adı: LUMANORIS',
                'Adres: Beşikkaya Mah. 2021 Sok. 2026 Cad. No:2/A Altındağ/Ankara',
                'E-posta: lumanoris.ai@gmail.com',
                'E-posta: lumanoris.help@gmail.com'
            ] 
        },
    ];

    return (
        <div className="notification-overlay">
            <div className="notification-popup" style={{ maxWidth: '900px' }}> 
                <div className="notification-header">
                    <h2>Kullanım Koşulları</h2>
                    <button onClick={onClose} className="close-btn">
                        {closeSvg}
                    </button>
                </div>

                {/* API'den gelen HTML içeriği burada render ediliyor */}
                <div className="notification-list" style={{ padding: '20px 30px', overflowY: 'auto', maxHeight: 'calc(80vh - 120px)' }}>
                    {isLoading ? (
                        <p style={{ color: '#aaa' }}>Yükleniyor...</p>
                    ) : (
                        <div 
                            className="prose-container" // CSS tarafında stil vermek istersen diye
                            dangerouslySetInnerHTML={{ __html: info }} 
                        />
                    )}
                </div>
            </div>

            {/* İçerideki HTML etiketlerine stil vermek için minik bir CSS (İsteğe bağlı) */}
            <style jsx>{`
                .prose-container :global(h1) { color: #ffffff; font-size: 1.4em; margin-bottom: 10px; font-weight: bold; }
                .prose-container :global(h2) { color: #FF66C4; font-size: 1.1em; margin-top: 20px; font-weight: bold; }
                .prose-container :global(h3) { color: #ffffff; font-size: 1em; margin-top: 15px; font-weight: bold; }
                .prose-container :global(p) { color: #aaa; font-size: 0.95em; line-height: 1.6; margin-bottom: 10px; }
                .prose-container :global(ul) { list-style-type: disc; padding-left: 35px; margin-bottom: 15px; color: #aaa; }
                .prose-container :global(li) { font-size: 0.95em; margin-bottom: 8px; }
            `}</style>
        </div>
    );
}