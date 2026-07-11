'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';

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
            style: { fontWeight: 'bold', fontSize: '1.1em', marginTop: '20px', color: '#E879F9' }
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
            style: { fontWeight: 'bold', fontSize: '1.1em', marginTop: '20px', color: '#E879F9' }
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
            style: { fontWeight: 'bold', fontSize: '1.1em', marginTop: '20px', color: '#E879F9' }
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
            style: { fontWeight: 'bold', fontSize: '1.1em', marginTop: '20px', color: '#E879F9' }
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
            style: { fontWeight: 'bold', fontSize: '1.1em', marginTop: '20px', color: '#E879F9' }
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
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="flex max-h-[80vh] max-w-[900px] flex-col overflow-hidden bg-luma-elevated border-transparent p-0">
                <DialogTitle className="shrink-0 px-6 pb-3 pt-6 text-[16px]">Kullanım Koşulları</DialogTitle>

                {/* API'den gelen HTML içeriği burada render ediliyor */}
                <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 [&_h1]:mb-2.5 [&_h1]:text-[1.4em] [&_h1]:font-bold [&_h1]:text-white [&_h2]:mt-5 [&_h2]:text-[1.1em] [&_h2]:font-bold [&_h2]:text-fuchsia-400 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-white [&_li]:mb-2 [&_li]:text-[0.95em] [&_p]:mb-2.5 [&_p]:text-[0.95em] [&_p]:leading-relaxed [&_p]:text-white/65 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-9 [&_ul]:text-white/65">
                    {isLoading ? (
                        <p className="text-sm text-white/50">Yükleniyor...</p>
                    ) : (
                        <div dangerouslySetInnerHTML={{ __html: info }} />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
