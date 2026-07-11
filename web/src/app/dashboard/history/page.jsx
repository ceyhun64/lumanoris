"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EmptyCart from "@/features/history/EmptyHistory";
import DeleteConfirmModal from "@/shared/ui/DeleteConfirmModal";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/shared/ui/dropdown-menu";
import { MoreVertical, Trash2, Pencil, Search, MessageSquare } from "lucide-react";

export default function History() {
    const router = useRouter();
    const [editingId, setEditingId] = useState(null);
    const [historyItems, setHistoryItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [userId, setUserId] = useState();

    function formatDateToTurkish(dateString) {
        const months = [
            "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
            "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
        ];

        // Eğer dateString null, undefined, boş string veya "0" ise bugünü kullan
        let date;
        if (!dateString || dateString === "0") {
            date = new Date();
        } else {
            date = new Date(dateString);
        }

        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();

        return `${day} ${month} ${year}`;
    }

    async function checkSession() {
        try {
          const res = await fetch("/api/auth/sessioncheck.php", {
            credentials: "include", // cookie'yi gönder
          });
          const resultText = await res.text();
          const result = JSON.parse(resultText);

          if (result.authenticated) {
            setUserId(result.user_id);
          } else {
            // router.push("/login"); // Giriş kontrolü geçici olarak devre dışı - proje sonunda düzeltilecek
          }
        } catch (err) {
          console.error("Session check error:", err);
          // router.push("/login"); // Giriş kontrolü geçici olarak devre dışı - proje sonunda düzeltilecek
        }
    }

    const handleUpdateTitle = async (id, newTitle) => {
        // 1. Önce arayüzü (state) hızlıca güncelle (Kullanıcı beklemesin)
        setHistoryItems(prev =>
            prev.map(i => i.id === id ? { ...i, conversation_name: newTitle } : i)
        );
        setEditingId(null);

        // 2. Veritabanına isteği gönder
        try {
            const formData = new FormData();
            // PHP kodun json_decode($_POST['data']) beklediği için bu formatta gönderiyoruz
            formData.append('data', JSON.stringify({
                id: id,
                conversation_name: newTitle
            }));

            const res = await fetch("/api/chat/updateconversation.php", {
                method: "POST",
                body: formData, // FormData otomatik olarak Content-Type: multipart/form-data ayarlar
            });

            const result = await res.json();

            if (!result.success) {
                console.error("Güncelleme başarısız:", result.message);
                // Hata durumunda belki sayfayı yenileyebilir veya eski halini geri yükleyebilirsin
            }
        } catch (err) {
            console.error("API Hatası:", err);
        }
    };

    useEffect(() => {
        checkSession();
    },[]);

    useEffect(() => {
        if(!userId) return;
        fetch(`/api/chat/gethistory.php?user_id=${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP hatası! Durum: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            setHistoryItems(data.results);
        })
        .catch(error => {
            console.error("Veri çekilirken bir sorun oluştu:", error);
        });
    },[userId]);

    const handleDelete = async () => {
        // Silinecek ID yoksa işlemi durdur
        if (!deleteTargetId) return;

        try {
            // PHP tarafı $_POST['id'] beklediği için FormData oluşturuyoruz
            const formData = new FormData();
            formData.append('id', deleteTargetId);

            const res = await fetch("/api/chat/deleteconversation.php", {
                method: "POST",
                body: formData,
            });

            const result = await res.json();

            if (result.success) {
                // Veritabanında silindiği onaylanınca arayüzden de kaldırıyoruz
                setHistoryItems(prev => prev.filter(item => item.id !== deleteTargetId));
            } else {
                // API hata döndürürse kullanıcıya bilgi verebilirsin
                alert("Hata: " + result.message);
            }
        } catch (err) {
            console.error("Silme işlemi sırasında hata oluştu:", err);
            alert("İşlem gerçekleştirilemedi. Lütfen tekrar deneyin.");
        } finally {
            // Her durumda modalı ve menüyü kapat
            setDeleteTargetId(null);
            setActiveMenuId(null);
        }
    };

    const handleChatClick = (item) => {
        // Chat mesajlarını localStorage'a kaydet
        localStorage.setItem('chatHistory', JSON.stringify(item.messages));
        localStorage.setItem('chatTitle', item.title);
        localStorage.setItem('chatId', item.chatId);

        // Chat sayfasına yönlendir
        router.push(`/dashboard/chat/?botId=${item.chatbot_id}&convId=${item.id}`);
    };

    const filteredItems = historyItems.filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (item.conversation_name || '').toLowerCase().includes(q) ||
            (item.latest_message || '').toLowerCase().includes(q) ||
            (item.latest_sent_time || '').toLowerCase().includes(q)
        );
    });

    return (
        <div className="flex h-full w-full flex-col px-4 py-6 text-white md:px-16">
            <div className="mb-10 flex flex-col items-start">
                <h2 className="bg-gradient-to-br from-fuchsia-400 to-violet-400 bg-clip-text font-display text-2xl font-semibold text-transparent md:text-4xl">
                    Geçmişim
                </h2>
                {filteredItems.length > 0 && (
                    <div className="mt-6 flex w-full items-center rounded-xl bg-luma-input transition-shadow duration-300 hover:shadow-[0_0_0_2px_rgba(217,70,239,0.3)]">
                        <input
                            type="text"
                            placeholder="Geçmiş sohbetlerde ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') setSearchQuery('');
                            }}
                            className="flex-1 bg-transparent px-5 py-6 font-display text-[15px] text-white placeholder:text-white/45 focus:outline-none"
                        />
                        <button
                            aria-label="Ara"
                            onClick={(e) => e.preventDefault()}
                            className="flex items-center justify-center px-5 py-1 text-fuchsia-400 transition-transform duration-200 hover:scale-110"
                        >
                            <Search className="h-5 w-5" />
                        </button>
                    </div>
                )}
            </div>

            {filteredItems.length == 0 && <EmptyCart />}
            {filteredItems.length > 0 && (
                <div className="flex w-full flex-col items-start gap-6">
                    {filteredItems.map((item) => (
                        <div
                            key={item.id}
                            onClick={(e) => {
                                if (editingId === item.id) return;
                                handleChatClick(item);
                            }}
                            className="flex w-full cursor-pointer items-start gap-4 rounded-lg border border-transparent bg-luma-elevated p-2 transition-all duration-300 hover:border-fuchsia-400/15 hover:bg-[#22212c] max-md:flex-col"
                        >
                            <div className="z-[2] shrink-0 overflow-hidden">
                                <Image src={item.profil_fotografi} width={90} height={90} alt="AI Icon" className="h-[90px] w-[90px] rounded-xl object-cover" />
                            </div>
                            <div className="flex w-full flex-1 flex-col items-start">
                                <div className="mb-3 flex w-full flex-wrap items-center justify-between gap-3 rounded-xl bg-white/[0.04] p-3">
                                    {editingId === item.id ? (
                                        <input
                                            type="text"
                                            defaultValue={item.conversation_name}
                                            onClick={(e) => e.stopPropagation()}
                                            onBlur={(e) => handleUpdateTitle(item.id, e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleUpdateTitle(item.id, e.target.value);
                                                }
                                                if (e.key === "Escape") {
                                                    setEditingId(null);
                                                }
                                            }}
                                            autoFocus
                                            className="w-full border-b border-transparent bg-transparent font-display text-base font-semibold text-white outline-none"
                                        />
                                    ) : (
                                        <h4 className="font-display text-base font-semibold capitalize text-white">{item.conversation_name}</h4>
                                    )}
                                    <p className="font-display text-base font-semibold capitalize text-white">{formatDateToTurkish(item.latest_sent_time)}</p>
                                </div>
                                <span className="flex w-full items-center gap-2">
                                    <MessageSquare className="h-5 w-5 shrink-0 text-white/70" />
                                    <span className="text-xs text-white">
                                        {item.latest_message && item.latest_message.length > 100 ? item.latest_message.substring(0, 100) + "..." : item.latest_message}
                                    </span>
                                </span>
                            </div>
                            <div onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu open={activeMenuId === item.id} onOpenChange={(open) => setActiveMenuId(open ? item.id : null)}>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            className="flex items-center justify-center rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            aria-label="Sohbet seçenekleri"
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setDeleteTargetId(item.id)}>
                                            <Trash2 className="text-rose-400" />
                                            Sil
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => { setEditingId(item.id); setActiveMenuId(null); }}>
                                            <Pencil className="text-fuchsia-400" />
                                            Başlığı Düzenle
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <DeleteConfirmModal
                isOpen={!!deleteTargetId}
                onClose={() => setDeleteTargetId(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
}
