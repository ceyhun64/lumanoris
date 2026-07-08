'use client';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';

export default function AboutPopup({ onClose }) {
    // Hakkımızda içeriği
    const aboutContent = {
        title: 'Hakkımızda',
        paragraphs: [
            "İçinde bulunduğumuz çağın bir bilgi ve veri çağı olduğunun bilinciyle hareket ediyoruz. Yapay zekânın, bilgiyi erişilebilir ve üretilebilir kılan temel bir güç olduğuna inanıyor; insanların yalnızca tüketen değil, üreten tarafta yer almasını önemsiyoruz. Özellikle Türkiye’nin bu alanda gelişmesine katkı sunmak vizyonumuzun merkezinde yer alıyor.",
            "Bu vizyonla Lumanoris, kullanıcıların kişiselleştirilebilir sohbet modelleri ürettiği ve bu modelleri platform içindeki açık pazar alanında paylaşarak gelir elde edebildiği yenilikçi bir ekosistem sunar. Beğeni, yorum ve takip gibi etkileşimlerle beslenen yapı, bilginin paylaşıldıkça geliştiği canlı bir topluluk oluşturur ve teknolojiyi ortak bir üretim alanına dönüştürür.",
            "Lumanoris, iki Türk gencinin; insanlık için fayda üretmek, bilginin paylaşımını güçlendirmek ve ülkemizin yapay zeka ekosistemine katkı sağlamak amacıyla hayata geçirdiği bir platformdur. Amacımız, herkesin bilgisini değere dönüştürebildiği sürdürülebilir bir gelecek inşa etmektir."
        ]
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[560px] bg-luma-card border-white/10 p-6">
                <DialogTitle className="mb-4 text-[16px]">{aboutContent.title}</DialogTitle>

                <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
                    {aboutContent.paragraphs.map((text, index) => (
                        <p key={index} className="text-sm leading-relaxed text-white/70">
                            {text}
                        </p>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
