"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EmptyCart from "@/features/history/EmptyHistory";
import DeleteConfirmModal from "@/shared/ui/DeleteConfirmModal";
import { resolveAvatarSrc } from "@/shared/lib/image";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/shared/ui/dropdown-menu";
import { MoreVertical, Trash2, Pencil, Search, MessageSquare } from "lucide-react";
import { toast } from "@/shared/hooks/use-toast";
import { Card } from "@/shared/ui/card";
import { PageLayout, PageHeader } from "@/shared/ui/page-layout";

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
                toast({ variant: "destructive", title: "Hata", description: result.message });
            }
        } catch (err) {
            console.error("Silme işlemi sırasında hata oluştu:", err);
            toast({ variant: "destructive", title: "İşlem gerçekleştirilemedi.", description: "Lütfen tekrar deneyin." });
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
        <PageLayout>
            <PageHeader eyebrow="Zaman Çizelgesi" title="Geçmişim">
                {filteredItems.length > 0 && (
                    <div className="mt-6 flex w-full items-center gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-5 py-1 ring-1 ring-inset ring-transparent transition-all duration-200 focus-within:border-fuchsia-400/30 focus-within:ring-fuchsia-400/20">
                        <Search className="h-4 w-4 shrink-0 text-fuchsia-300/70" />
                        <input
                            type="text"
                            placeholder="Geçmiş sohbetlerde ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') setSearchQuery('');
                            }}
                            className="flex-1 bg-transparent py-4 font-display text-[15px] text-white placeholder:text-white/40 focus:outline-none"
                        />
                    </div>
                )}
            </PageHeader>

            {filteredItems.length == 0 && <EmptyCart />}
            {filteredItems.length > 0 && (
                <div className="flex w-full flex-col items-start gap-6">
                    {filteredItems.map((item) => (
                        <Card
                            interactive
                            role="button"
                            tabIndex={0}
                            key={item.id}
                            onClick={(e) => {
                                if (editingId === item.id) return;
                                handleChatClick(item);
                            }}
                            onKeyDown={(e) => {
                                if ((e.key === 'Enter' || e.key === ' ') && editingId !== item.id) {
                                    e.preventDefault();
                                    handleChatClick(item);
                                }
                            }}
                            className="flex w-full items-start gap-4 p-3 max-md:flex-col"
                        >
                            <div className="z-[2] shrink-0 overflow-hidden rounded-xl ring-1 ring-fuchsia-400/15">
                                <Image src={resolveAvatarSrc(item.profil_fotografi)} width={90} height={90} alt="AI Icon" className="h-[90px] w-[90px] object-cover" />
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
                        </Card>
                    ))}
                </div>
            )}
            <DeleteConfirmModal
                isOpen={!!deleteTargetId}
                onClose={() => setDeleteTargetId(null)}
                onConfirm={handleDelete}
            />
        </PageLayout>
    );
}
