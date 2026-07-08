"use client";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import avatarBot from "@/images/avatar-bot.jpg";
import botImage from "@/images/bot-image.png";
import DeleteConfirmModal from "@/shared/ui/DeleteConfirmModal";
import BotCard from "@/entities/chatbot/ui/BotCard";
import { Checkbox } from "@/shared/ui/checkbox";
import { Trash2, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const DURATIONS = [
    { id: 1, label: 'Bir Haftalık' },
    { id: 2, label: 'İki Haftalık' },
    { id: 3, label: 'Üç Haftalık' },
    { id: 4, label: 'Bir Aylık' },
];

export default function CartFull({ userId, cartItems, onRemove, onConfirm }) {
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Her öğe için seçilen süreyi (1, 2, 3, veya 4 hafta) tutacak state
    const [itemDurations, setItemDurations] = useState({});

    const [selectedItems, setSelectedItems] = useState(
        cartItems.map((item) => item.id)
    );
    const [suggestedBots, setSuggestedBots] = useState([]);


    const fetchSuggestedBots = useCallback(async () => {
        if (!userId) return;
        try {
            const response = await fetch(`/api/chatbot/get_suggested.php?user_id=${userId}`);
            const data = await response.json();

            // API'den gelen veriyi SuggestedCard'ın beklediği formata dönüştürelim
            const formattedBots = data.map(bot => ({
                id: bot.id,
                title: bot.isim,
                author: bot.owner_name || "Bilinmiyor",
                dialogues: bot.toplam_chats || 0,
                time: "Yeni", // Veya ucret_haftalik üzerinden bir veri
                avatar: bot.profil_fotografi || avatarBot,
                image: bot.kapak_fotografi || botImage,
                badge: { type: "produced", label: "Önerilen" }
            }));

            setSuggestedBots(formattedBots);
        } catch (error) {
            console.error("Önerilen botlar yüklenirken hata:", error);
        }
    }, [userId]);

    useEffect(() => {
        fetchSuggestedBots();
    }, [fetchSuggestedBots]);

    // Başlangıçta tüm öğeleri aylık (4 hafta) olarak ayarla
    useEffect(() => {
        const initialDurations = {};
        cartItems.forEach(item => {
            initialDurations[item.id] = item.order_weeks ? parseInt(item.order_weeks) : 4; // Varsayılan: Aylık (4 hafta)
        });
        setItemDurations(initialDurations);
    }, [cartItems]);


    // Toplamları hesaplayan ana fonksiyon (Döngüde kullanılacağı için useCallback)
    const calculateTotals = useCallback(() => {
        let newSubtotal = 0;
        const selectedProducts = cartItems.filter((item) => selectedItems.includes(item.id));

        selectedProducts.forEach(item => {
            const durationWeeks = itemDurations[item.id] || 4;
            let price = 0;

            // Varsayım: item.price haftalık, item.monthlyPrice aylık ücreti tutuyor
            const weeklyPrice = parseFloat(item.price) || 0;
            // Aylık fiyatı yoksa, haftalık fiyatın 4 katının %95'i olarak hesaplıyoruz (Görüntüdeki mantığı taklit)
            const monthlyPrice = parseFloat(item.monthlyPrice) || (weeklyPrice * 4);

            if (durationWeeks >= 1 && durationWeeks <= 3) {
                // 1, 2, veya 3 haftalık: Haftalık fiyat * hafta sayısı
                price = weeklyPrice * durationWeeks;
            } else if (durationWeeks === 4) {
                // Aylık (4 hafta): %5 indirimli aylık fiyat (Görüntüdeki kural)
                price = monthlyPrice * 0.95;
            }

            newSubtotal += price;
        });

        const finalTotal = newSubtotal;

        return {
            subtotal: newSubtotal,
            total: finalTotal
        };
    }, [cartItems, selectedItems, itemDurations]);

    const { subtotal, total } = calculateTotals();


    const handleCheckboxChange = (id) => {
        setSelectedItems((prev) =>
            prev.includes(id)
                ? prev.filter((itemId) => itemId !== id)
                : [...prev, id]
        );
    };

    // YENİ: Süre seçimi için
    const handleDurationChange = async (itemId, duration) => {
        // 1. Arayüzü anında güncelle (Kullanıcı gecikme hissetmesin)
        setItemDurations(prev => ({ ...prev, [itemId]: duration }));

        // 2. Veritabanını güncelle
        try {
            const formData = new FormData();

            // PHP'nin beklediği "data" formatında JSON objesi oluşturuyoruz
            const updatePayload = {
                id: itemId,
                order_weeks: duration
            };

            formData.append('data', JSON.stringify(updatePayload));

            const response = await fetch('/api/marketplace/updatecart.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!result.success) {
                console.error("DB Güncelleme hatası:", result.message);
                // Opsiyonel: Hata olursa kullanıcıya bildir veya state'i geri al
            }
        } catch (error) {
            console.error("İstek hatası:", error);
        }
    };

    const handleRemoveSuggestedBot = (index) => {
        setSuggestedBots(prev => prev.filter((_, i) => i !== index));
    };

    const handleFinalConfirm = () => {
        const dataToConfirm = cartItems
            .filter(item => selectedItems.includes(item.id))
            .map(item => ({
                ...item,
                duration_weeks: itemDurations[item.id] || 4
            }));

        if (dataToConfirm.length === 0) {
            alert("Lütfen en az bir ürün seçin.");
            return;
        }

        onConfirm(dataToConfirm); // Veriyi Checkout.jsx'e gönderir
    };

    return (
    <div>
        <div className="flex flex-col items-start gap-8 md:flex-row">
            <div className="w-full flex-[2]">
                <div className="rounded-xl border border-white/10 bg-luma-elevated p-3">
                    <label className="flex cursor-pointer items-center gap-3 p-2">
                        <Checkbox
                            checked={selectedItems.length === cartItems.length && cartItems.length > 0}
                            onCheckedChange={(checked) => {
                                setSelectedItems(checked ? cartItems.map((item) => item.id) : []);
                            }}
                        />
                        <span className="text-sm text-white/70">Tümünü seç</span>
                    </label>

                    <div className="my-3 h-0.5 w-full bg-gradient-to-r from-[#1B1A22] to-[#6366F1]" />

                    {cartItems.map((item) => {
        const isSelected = selectedItems.includes(item.id);
        const currentDuration = itemDurations[item.id] || 4;

        // Fiyat hesaplama mantığı (aynı kalıyor)
        const weeklyPrice = parseFloat(item.price) || 0;
        const monthlyPrice = parseFloat(item.monthlyPrice) || (weeklyPrice * 4);
        let currentPrice = (currentDuration === 4) ? (monthlyPrice * 0.95) : (weeklyPrice * currentDuration);

        return (
            <div className="mb-5 flex items-start gap-3 border-b border-white/5 py-5 last:border-b-0" key={item.id}>
                <label className="mt-8 flex cursor-pointer items-center">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleCheckboxChange(item.id)}
                    />
                </label>

                <div className="mt-2.5 shrink-0 overflow-hidden rounded-lg border border-white/10">
                    <Image src={item.image} width={100} height={100} alt={item.title} className="h-[100px] w-[100px] object-cover" />
                </div>

                <div className="ml-1 flex-1">
                    <h3 className="mb-2.5 text-left font-display text-lg font-normal text-white">{item.title}</h3>
                    <p className="mb-3.5 text-left text-sm text-white/70">
                        Kategori: <span className="text-indigo-400">{item.category || 'Genel'}</span>
                    </p>

                    <div className="mt-3.5 grid max-w-[320px] grid-cols-2 gap-2.5">
                        {DURATIONS.map((d) => {
                            const isActive = currentDuration === d.id;
                            return (
                                <button
                                    key={d.id}
                                    onClick={() => handleDurationChange(item.id, d.id)}
                                    className={cn(
                                        "rounded-xl py-3 text-[13px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                        isActive
                                            ? "bg-gradient-btn font-semibold text-white shadow-glow"
                                            : "bg-luma-input font-normal text-white hover:bg-white/10",
                                    )}
                                >
                                    {d.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="min-w-[100px] text-right">
                    <div className="text-lg font-bold text-indigo-400">
                        {currentPrice.toFixed(2)}₺
                    </div>
                    <button
                        className="mt-10 flex items-center justify-center text-white/50 transition-colors hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                        onClick={() => setDeleteTarget(item.id)}
                        aria-label="Sepetten kaldır"
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                </div>
            </div>
        );
    })}

                    {suggestedBots.length > 0 && (
                        <div className="mt-10">
                            <h5 className="mb-3 font-display text-[15px] font-semibold text-white">
                                Önerilen Chatbotlar
                            </h5>

                            <div className="mb-4 h-px w-full bg-white/10" />

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {suggestedBots.map((bot, i) => (
                                    <BotCard key={i} bot={bot} onRemove={() => handleRemoveSuggestedBot(i)} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sağ Alan - Özet */}
            <div className="w-full flex-1 rounded-xl border border-white/10 bg-luma-elevated p-3 md:sticky md:top-6">
                <h4 className="mb-6 font-display text-xl font-medium text-white">Sipariş Özeti</h4>
                <div className="my-2 flex justify-between font-display text-base font-medium text-white">
                    <span>Ürün Tutarı</span>
                    <span className="text-white/50">{subtotal.toFixed(2)}₺</span>
                </div>
                <div className="my-2 flex justify-between border-y border-white/10 py-3 font-display text-base font-medium text-white">
                    <strong>Toplam</strong>
                    <strong className="text-white/50">{total.toFixed(2)}₺</strong>
                </div>
                <div className="mt-4 flex items-stretch rounded-xl border border-indigo-400 bg-white/10">
                    <div className="flex items-center p-3.5 text-indigo-400">
                        <Tag className="h-5 w-5" />
                    </div>
                    <input
                        placeholder="İndirim kodu gir"
                        className="flex-1 bg-transparent py-3.5 pr-3.5 font-display text-base font-medium text-white placeholder:text-white/40 focus:outline-none"
                    />
                </div>
                <button
                    onClick={handleFinalConfirm}
                    className="mt-4 w-full rounded-xl border border-white/10 bg-gradient-btn py-3.5 font-display text-sm font-bold uppercase text-white shadow-glow transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    Sepeti Onayla
                </button>
            </div>
        </div>
        <DeleteConfirmModal
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={() => {
                onRemove(deleteTarget);
                setSelectedItems(prev => prev.filter(id => id !== deleteTarget));
                setDeleteTarget(null);
            }}
        />
    </div>
    );
}
