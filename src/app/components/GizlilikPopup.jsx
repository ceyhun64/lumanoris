'use client';
import { useState } from 'react';

export default function PrivacyPopup({ onClose }) {
    // Kapatma SVG ikonu
    const closeSvg = (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.0008 13.4008L7.10078 18.3008C6.91745 18.4841 6.68411 18.5758 6.40078 18.5758C6.11745 18.5758 5.88411 18.4841 5.70078 18.3008C5.51745 18.1174 5.42578 17.8841 5.42578 17.6008C5.42578 17.3174 5.51745 17.0841 5.70078 16.9008L10.6008 12.0008L5.70078 7.10078C5.51745 6.91745 5.42578 6.68411 5.42578 6.40078C5.42578 6.11745 5.51745 5.88411 5.70078 5.70078C5.88411 5.51745 6.11745 5.42578 6.40078 5.42578C6.68411 5.42578 6.91745 5.51745 7.10078 5.70078L12.0008 10.6008L16.9008 5.70078C17.0841 5.51745 17.3174 5.42578 17.6008 5.42578C17.8841 5.42578 18.1174 5.51745 18.3008 5.70078C18.4841 5.88411 18.5758 6.11745 18.5758 6.40078C18.5758 6.68411 18.4841 6.91745 18.3008 7.10078L13.4008 12.0008L18.3008 16.9008C18.4841 17.0841 18.5758 17.3174 18.5758 17.6008C18.5758 17.8841 18.4841 18.1174 18.3008 18.3008C18.1174 18.4841 17.8841 18.5758 17.6008 18.5758C17.3174 18.5758 17.0841 18.4841 16.9008 18.3008L12.0008 13.4008Z" fill="#FF99D6" />
        </svg>
    );

    // Gizlilik Politikası İçeriği (Yapısal olarak düzenlendi)
    const privacyContent = [
        { 
            type: 'title', 
            text: 'Gizlilik Politikası', 
            style: { fontSize: '1.4em', fontWeight: 'bold', marginBottom: '5px' } 
        },
        { 
            type: 'subtitle', 
            text: 'Son Güncelleme: 24 Temmuz 2025', 
            style: { fontSize: '0.9em', color: '#ccc', marginBottom: '20px' } 
        },
        // Bölüm 1
        { 
            type: 'header', 
            text: '1. Giriş', 
            style: { fontWeight: 'bold', fontSize: '1.1em', marginTop: '20px', color: '#FF66C4' } 
        },
        { 
            type: 'paragraph', 
            text: 'Bu Gizlilik Politikası, LUMANORIS (“biz”, “platform”, “şirket”) tarafından sunulan hizmetleri kullandığınızda kişisel verilerinizin nasıl toplandığını, işlendiğini ve korunduğunu açıklar.' 
        },
        { 
            type: 'paragraph', 
            text: 'LUMANORIS, bireylerin ve kurumların kendi yapay zeka sohbet modellerini geliştirebildiği, paylaşabildiği ve gelir elde edebildiği merkeziyetsiz bir platformdur.' 
        },
        // Bölüm 2
        { 
            type: 'header', 
            text: '2. Toplanan Bilgiler', 
            style: { fontWeight: 'bold', fontSize: '1.1em', marginTop: '20px', color: '#FF66C4' } 
        },
        // 2.a
        { 
            type: 'subHeader', 
            text: 'a. Hesap Bilgileri', 
            style: { fontWeight: 'bold', fontSize: '1em', marginTop: '10px' } 
        },
        { 
            type: 'list', 
            items: ['Ad, soyad', 'E-posta adresi', 'Kullanıcı adı', 'Şifre (şifrelenmiş olarak)', 'Doğum tarihi (yaş doğrulaması için)'] 
        },
        // 2.b
        { 
            type: 'subHeader', 
            text: 'b. Cihaz ve Bağlantı Bilgileri', 
            style: { fontWeight: 'bold', fontSize: '1em', marginTop: '10px' } 
        },
        { 
            type: 'list', 
            items: ['Tarayıcı türü ve sürümü', 'İşletim sistemi', 'Cihaz türü', 'IP adresi ve yaklaşık konum', 'Oturum bilgileri ve işlem geçmişi'] 
        },
        // 2.c
        { 
            type: 'subHeader', 
            text: 'c. Etkileşim Verileri', 
            style: { fontWeight: 'bold', fontSize: '1em', marginTop: '10px' } 
        },
        { 
            type: 'list', 
            items: ['Sohbet geçmişiniz', 'Platform içi arama ve gezinme davranışları', 'Bot kullanım istatistikleri', 'Kullanıcı destek talepleri ve geri bildirimler'] 
        },
        // 2.d
        { 
            type: 'subHeader', 
            text: 'd. Ödeme Bilgileri (içerik üreticiler ve abone kullanıcılar için)', 
            style: { fontWeight: 'bold', fontSize: '1em', marginTop: '10px' } 
        },
        { 
            type: 'list', 
            items: ['Fatura bilgileri', 'Kredi kartı veya ödeme aracı bilgileri (güvenli ödeme sağlayıcılar üzerinden)', 'Vergi kimlik numarası ve adres (içerik üreticiler için)'] 
        },
        // Bölüm 3
        { 
            type: 'header', 
            text: '3. Bilgilerin Kullanım Amaçları', 
            style: { fontWeight: 'bold', fontSize: '1.1em', marginTop: '20px', color: '#FF66C4' } 
        },
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
        { 
            type: 'header', 
            text: '4. Çerezler ve Benzeri Teknolojiler', 
            style: { fontWeight: 'bold', fontSize: '1.1em', marginTop: '20px', color: '#FF66C4' } 
        },
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
        { 
            type: 'header', 
            text: '5. Üçüncü Taraflarla Paylaşım', 
            style: { fontWeight: 'bold', fontSize: '1.1em', marginTop: '20px', color: '#FF66C4' } 
        },
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
        { 
            type: 'header', 
            text: '6. Yapay Zekâ ile Etkileşim', 
            style: { fontWeight: 'bold', fontSize: '1.1em', marginTop: '20px', color: '#FF66C4' } 
        },
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
            text: 'Önemli: Özel, hassas veya kişisel bilgilerinizi sohbet botlarıyla paylaşmanız gerekmez. (Örn: kredi kartı numarası, kimlik bilgisi vs.)',
            style: { fontWeight: 'bold', color: '#FF66C4', marginTop: '10px' }
        },
        // Bölüm 7
        { 
            type: 'header', 
            text: '7. Güvenlik', 
            style: { fontWeight: 'bold', fontSize: '1.1em', marginTop: '20px', color: '#FF66C4' } 
        },
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
        { 
            type: 'header', 
            text: '8. Uluslararası Veri Aktarımı', 
            style: { fontWeight: 'bold', fontSize: '1.1em', marginTop: '20px', color: '#FF66C4' } 
        },
        { 
            type: 'paragraph', 
            text: 'Platformun altyapısı uluslararası sağlayıcılar üzerinden çalışabilir. Avrupa Ekonomik Alanı (EEA) dışına aktarılan veriler, uygun koruma önlemleriyle aktarılır.' 
        },
        // Bölüm 9
        { 
            type: 'header', 
            text: '9. Veri Saklama Süresi', 
            style: { fontWeight: 'bold', fontSize: '1.1em', marginTop: '20px', color: '#FF66C4' } 
        },
        { 
            type: 'paragraph', 
            text: 'Kullanıcı verileri, hizmet ilişkisinin sona ermesinden sonra ilgili yasal zorunluluklar ve meşru çıkar süreleri boyunca saklanır ve ardından silinir veya anonimleştirilir.' 
        },
        // Bölüm 10
        { 
            type: 'header', 
            text: '10. Haklarınız', 
            style: { fontWeight: 'bold', fontSize: '1.1em', marginTop: '20px', color: '#FF66C4' } 
        },
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
        { 
            type: 'header', 
            text: '11. İletişim', 
            style: { fontWeight: 'bold', fontSize: '1.1em', marginTop: '20px', color: '#FF66C4' } 
        },
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

    // Render Fonksiyonu: Yapısal veriye göre render eder
    const renderContent = () => {
        return privacyContent.map((item, index) => {
            switch (item.type) {
                case 'title':
                    return <h2 key={index} style={{ ...item.style, color: '#ffffff' }}>{item.text}</h2>;
                case 'subtitle':
                    return <p key={index} style={{ ...item.style }}>{item.text}</p>;
                case 'header': // Ana Başlıklar (1., 2., 3. vs.)
                    return <h3 key={index} style={{ ...item.style }}>{item.text}</h3>;
                case 'subHeader': // Alt Başlıklar (a., b., c. vs.)
                    return <h4 key={index} style={{ ...item.style, marginLeft: '15px' }}>{item.text}</h4>;
                case 'paragraph':
                    return <p key={index} style={{ fontSize: '0.95em', color: '#aaa', lineHeight: '1.5', marginBottom: '10px' }}>{item.text}</p>;
                case 'note': // Özel notlar (Örn: Önemli uyarı)
                    return <p key={index} style={{ ...item.style, paddingLeft: '15px', borderLeft: '3px solid #a058ff' }}>{item.text}</p>;
                case 'list': // Madde işaretli listeler
                    return (
                        <ul key={index} style={{ listStyleType: 'disc', paddingLeft: '40px', marginBottom: '10px' }}>
                            {item.items.map((liText, liIndex) => (
                                <li key={liIndex} style={{ fontSize: '0.95em', color: '#aaa', marginBottom: '5px' }}>
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
        <div className="notification-overlay">
            <div className="notification-popup" style={{ maxWidth: '900px' }}> {/* Popup genişliğini ayarla */}
                <div className="notification-header">
                    <h2>{privacyContent[0].text}</h2> {/* Başlık (Gizlilik Politikası) */}
                    <button onClick={onClose} className="close-btn">
                        {closeSvg}
                    </button>
                </div>

                {/* İçerik alanı: Liste yapısından çıkarılıp, render fonksiyonu kullanıldı */}
                <div className="notification-list" style={{ padding: '20px 30px', overflowY: 'auto', maxHeight: 'calc(80vh - 120px)' }}>
                    {renderContent()}
                </div>
                
                {/* NotificationEmpty kısmı bu popup için kullanılmıyor */}

            </div>
        </div>
    );
}