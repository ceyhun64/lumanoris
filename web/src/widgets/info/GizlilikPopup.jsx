'use client';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';

export default function PrivacyPopup({ onClose }) {
    // Gizlilik Politikası İçeriği (Yapısal olarak düzenlendi)
    const privacyContent = [
        { type: 'title', text: 'Gizlilik Politikası' },
        { type: 'subtitle', text: 'Son Güncelleme: 24 Temmuz 2025' },
        // Bölüm 1
        { type: 'header', text: '1. Giriş' },
        {
            type: 'paragraph',
            text: 'Bu Gizlilik Politikası, LUMANORIS (“biz”, “platform”, “şirket”) tarafından sunulan hizmetleri kullandığınızda kişisel verilerinizin nasıl toplandığını, işlendiğini ve korunduğunu açıklar.'
        },
        {
            type: 'paragraph',
            text: 'LUMANORIS, bireylerin ve kurumların kendi yapay zeka sohbet modellerini geliştirebildiği, paylaşabildiği ve gelir elde edebildiği merkeziyetsiz bir platformdur.'
        },
        // Bölüm 2
        { type: 'header', text: '2. Toplanan Bilgiler' },
        // 2.a
        { type: 'subHeader', text: 'a. Hesap Bilgileri' },
        {
            type: 'list',
            items: ['Ad, soyad', 'E-posta adresi', 'Kullanıcı adı', 'Şifre (şifrelenmiş olarak)', 'Doğum tarihi (yaş doğrulaması için)']
        },
        // 2.b
        { type: 'subHeader', text: 'b. Cihaz ve Bağlantı Bilgileri' },
        {
            type: 'list',
            items: ['Tarayıcı türü ve sürümü', 'İşletim sistemi', 'Cihaz türü', 'IP adresi ve yaklaşık konum', 'Oturum bilgileri ve işlem geçmişi']
        },
        // 2.c
        { type: 'subHeader', text: 'c. Etkileşim Verileri' },
        {
            type: 'list',
            items: ['Sohbet geçmişiniz', 'Platform içi arama ve gezinme davranışları', 'Bot kullanım istatistikleri', 'Kullanıcı destek talepleri ve geri bildirimler']
        },
        // 2.d
        { type: 'subHeader', text: 'd. Ödeme Bilgileri (içerik üreticiler ve abone kullanıcılar için)' },
        {
            type: 'list',
            items: ['Fatura bilgileri', 'Kredi kartı veya ödeme aracı bilgileri (güvenli ödeme sağlayıcılar üzerinden)', 'Vergi kimlik numarası ve adres (içerik üreticiler için)']
        },
        // Bölüm 3
        { type: 'header', text: '3. Bilgilerin Kullanım Amaçları' },
        {
            type: 'list',
            items: [
                'Hesap oluşturmak ve kimlik doğrulamak',
                'Hizmet sunmak ve kişiselleştirmek',
                'Teknik sorunları tespit etmek ve çözmek',
                'Kullanıcı destek hizmetleri sunmak',
                'Geliştirme ve analiz yapmak',
                'Abonelik işlemlerini yürütmek',
                'Gelir dağıtımı ve vergi yükümlülüklerini yerine getirmek',
                'Yasal yükümlülüklere uymak',
                'Pazarlama ve reklam faaliyetlerini optimize etmek (onayınız dâhilinde)'
            ]
        },
        // Bölüm 4
        { type: 'header', text: '4. Çerezler ve Benzeri Teknolojiler' },
        {
            type: 'paragraph',
            text: 'LUMANORIS, kullanıcı deneyimini geliştirmek ve analiz yapmak için çerezler (cookies) kullanır.'
        },
        {
            type: 'paragraph',
            text: 'Tarayıcınızdan çerezleri devre dışı bırakabilirsiniz, ancak bu bazı özelliklerin çalışmasını etkileyebilir.'
        },
        {
            type: 'list',
            items: ['Oturum çerezleri', 'Analitik çerezler', 'Pazarlama çerezleri (izninizle)']
        },
        {
            type: 'paragraph',
            text: 'Not: Sitemiz henüz çerez kullanmamaktadır ancak ilerleyen süreçte kullanıcı deneyimini iyileştirmek adına çerezler devreye alınabilir.'
        },
        // Bölüm 5
        { type: 'header', text: '5. Üçüncü Taraflarla Paylaşım' },
        {
            type: 'list',
            items: [
                'Hizmet sağlayıcılarla',
                'Yasal yükümlülüklerin yerine getirilmesi gerektiğinde',
                'İçerik üreticilerine gelir ödemeleri için',
                'AI model sağlayıcılarıyla, yalnızca sohbet etkileşimleri bağlamında (kullanıcı adı veya e-posta paylaşılmaz)'
            ]
        },
        // Bölüm 6
        { type: 'header', text: '6. Yapay Zekâ ile Etkileşim' },
        {
            type: 'paragraph',
            text: 'Platform üzerindeki sohbetleriniz, üçüncü taraf yapay zekâ model sağlayıcılarıyla paylaşılabilir.'
        },
        {
            type: 'list',
            items: [
                'Model çıktılarının iyileştirilmesi',
                'Kişiselleştirme önerilerinin sunulması',
                'Çok kullanıcıya açık sohbetlerde, kullanıcı adı/id bilgisiyle birlikte işlenebilir'
            ]
        },
        {
            type: 'note',
            text: 'Önemli: Özel, hassas veya kişisel bilgilerinizi sohbet botlarıyla paylaşmanız gerekmez. (Örn: kredi kartı numarası, kimlik bilgisi vs.)'
        },
        // Bölüm 7
        { type: 'header', text: '7. Güvenlik' },
        {
            type: 'list',
            items: [
                'Veri şifreleme',
                'Erişim kontrolleri',
                'Güvenlik duvarları ve izleme sistemleri',
                'Düzenli güvenlik denetimleri'
            ]
        },
        // Bölüm 8
        { type: 'header', text: '8. Uluslararası Veri Aktarımı' },
        {
            type: 'paragraph',
            text: 'Platformun altyapısı uluslararası sağlayıcılar üzerinden çalışabilir. Avrupa Ekonomik Alanı (EEA) dışına aktarılan veriler, uygun koruma önlemleriyle aktarılır.'
        },
        // Bölüm 9
        { type: 'header', text: '9. Veri Saklama Süresi' },
        {
            type: 'paragraph',
            text: 'Kullanıcı verileri, hizmet ilişkisinin sona ermesinden sonra ilgili yasal zorunluluklar ve meşru çıkar süreleri boyunca saklanır ve ardından silinir veya anonimleştirilir.'
        },
        // Bölüm 10
        { type: 'header', text: '10. Haklarınız' },
        {
            type: 'list',
            items: [
                'Verilerinize erişme',
                'Düzeltme veya silme talep etme',
                'İşlemeye itiraz etme',
                'Taşınabilirlik talep etme',
                'Onayınızı geri çekme (onaya dayalı işlemler için)'
            ]
        },
        {
            type: 'paragraph',
            text: 'Bu hakları kullanmak için bizimle iletişime geçebilirsiniz.'
        },
        // Bölüm 11
        { type: 'header', text: '11. İletişim' },
        {
            type: 'paragraph',
            text: 'Veri koruma ve gizlilikle ilgili her türlü soru için bizimle iletişime geçebilirsiniz:'
        },
        {
            type: 'list',
            items: [
                'E-posta: lumanoris.ai@gmail.com',
                'İletişim Formu: www.lumanoris.com/iletisim'
            ]
        },
    ];

    // Render Fonksiyonu: Yapısal veriye göre, tipe bağlı Tailwind sınıflarıyla render eder
    const renderContent = () => {
        return privacyContent.map((item, index) => {
            switch (item.type) {
                case 'title':
                    return (
                        <h2 key={index} className="mb-1 text-[1.4em] font-bold text-white">
                            {item.text}
                        </h2>
                    );
                case 'subtitle':
                    return (
                        <p key={index} className="mb-5 text-[0.9em] text-white/60">
                            {item.text}
                        </p>
                    );
                case 'header': // Ana Başlıklar (1., 2., 3. vs.)
                    return (
                        <h3 key={index} className="mt-5 text-[1.1em] font-bold text-fuchsia-400">
                            {item.text}
                        </h3>
                    );
                case 'subHeader': // Alt Başlıklar (a., b., c. vs.)
                    return (
                        <h4 key={index} className="ml-4 mt-2.5 text-base font-bold text-white">
                            {item.text}
                        </h4>
                    );
                case 'paragraph':
                    return (
                        <p key={index} className="mb-2.5 text-[0.95em] leading-relaxed text-white/65">
                            {item.text}
                        </p>
                    );
                case 'note': // Özel notlar (Örn: Önemli uyarı)
                    return (
                        <p key={index} className="mt-2.5 border-l-[3px] border-fuchsia-400 pl-4 font-bold text-fuchsia-400">
                            {item.text}
                        </p>
                    );
                case 'list': // Madde işaretli listeler
                    return (
                        <ul key={index} className="mb-2.5 list-disc pl-10">
                            {item.items.map((liText, liIndex) => (
                                <li key={liIndex} className="mb-1.5 text-[0.95em] text-white/65">
                                    {liText}
                                </li>
                            ))}
                        </ul>
                    );
                default:
                    return null;
            }
        });
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="flex max-h-[80vh] max-w-[900px] flex-col overflow-hidden bg-luma-elevated border-transparent p-0">
                <DialogTitle className="shrink-0 px-6 pb-3 pt-6 text-[16px]">{privacyContent[0].text}</DialogTitle>

                {/* İçerik alanı: Liste yapısından çıkarılıp, render fonksiyonu kullanıldı */}
                <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
                    {renderContent()}
                </div>
            </DialogContent>
        </Dialog>
    );
}
