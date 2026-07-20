"use client";
import React, { useState, useEffect } from "react";
import AddToListModal from "@/features/lists/AddToListModal";
import DeleteConfirmModal from "@/shared/ui/DeleteConfirmModal";
import { useRouter } from "next/navigation";
import AddToListModalEmpty from "@/features/lists/AddToListModalEmpty";
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import { Plus, ChevronLeft, ChevronRight, MessageSquare, Trash2, ListChecks } from "lucide-react";
import { toast } from "@/shared/hooks/use-toast";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { Card } from "@/shared/ui/card";
import { PageLayout, PageHeader } from "@/shared/ui/page-layout";

export default function List() {
    const [modalVisible, setModalVisible] = useState(false);
    const [modalVisible2, setModalVisible2] = useState(false);

    const [listData, setListData] = useState([]);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteTargetIndex, setDeleteTargetIndex] = useState(null);
    const [splideInstances, setSplideInstances] = useState({});
    const [userId, setUserId] = useState(null);
    const router = useRouter();

    const fetchUserLists = async (uid) => {
        try {
            const response = await fetch(`/api/social/getuserlists.php?id=${uid}`);
            const data = await response.json();

            if (data?.success && Array.isArray(data.lists)) {
            // Her liste için bot bilgilerini de çekiyoruz
            const formatted = await Promise.all(
                data.lists.map(async (list) => {
                try {
                    const botRes = await fetch(`/api/social/getbotsoflist.php?list_id=${list.id}`);
                    const botData = await botRes.json();

                    return {
                    id: list.id,
                    title: list.name,
                    username: "@kullanıcı",
                    summary: `${botData.count} Bot İçeriyor`,
                    dialog: `${botData.total_chats} Diyalog`,
                    bots: botData.bots, // profil fotoğrafları array
                    createdAt: new Date().toISOString(),
                    };
                } catch (err) {
                    console.error("Bot verisi alınamadı:", err);
                    return {
                    id: list.id,
                    title: list.name,
                    username: "@kullanıcı",
                    summary: "Bot bilgisi alınamadı",
                    dialog: "...",
                    bots: [],
                    createdAt: new Date().toISOString(),
                    };
                }
                })
            );

            setListData(formatted);
            }
        } catch (error) {
            console.error("Listeler yüklenirken hata oluştu:", error);
        }
    };

    useEffect(() => {
            async function checkSession() {
                try {
                    const res = await fetch("/api/auth/sessioncheck.php", {
                    credentials: "include", // cookie'yi gönder
                    });
                    const resultText = await res.text();
                    const result = JSON.parse(resultText);

                    if (result.authenticated) {
                    setUserId(result.user_id);
                    fetchUserLists(result.user_id);
                    } else {
                    // router.push("/login"); // Giriş kontrolü geçici olarak devre dışı - proje sonunda düzeltilecek
                    }
                } catch (err) {
                    console.error("Session check error:", err);
                    // router.push("/login"); // Giriş kontrolü geçici olarak devre dışı - proje sonunda düzeltilecek
                }
            }
            checkSession();
        }, [router]);

    const handleCreateList = async (name) => {

        // 1. PHP'ye gönderilecek veriyi hazırla
        const payload = {
            user_id: userId,
            name: name,
        };

        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));

        try {
            // 2. PHP AJAX modülüne isteği at (Dosya yolunu kendine göre güncelle)
            const response = await fetch('/api/social/adduserlist.php', {
                method: 'POST',
                body: formData
            });
            const resultText = await response.text();
            const result = JSON.parse(resultText);

            if (result.success) {
                const formattedList = {
                    id: result.listId,
                    title: name,
                    username: "@kullanıcı",
                    summary: "0 bot içeriyor",
                    dialog: `0 Bot`,
                    bots: [],
                    createdAt: new Date().toISOString()
                };

                // State'i güncelle
                setListData(prev => [...prev, formattedList]);

                // Modalları kapat
                setModalVisible(false);
                setModalVisible2(false);
            } else {
                toast({ variant: "destructive", title: "Veritabanı hatası", description: result.message });
            }

        } catch (error) {
            console.error("İstek gönderilirken hata oluştu:", error);
            toast({ variant: "destructive", title: "Bağlantı hatası", description: "Sunucuyla bağlantı kurulamadı." });
        }
    };

    const handleDelete = async (indexToRemove) => {
        // Silinecek listenin veritabanı ID'sini alıyoruz
        const listToDelete = listData[indexToRemove];

        if (!listToDelete || !listToDelete.id) {
            toast({ variant: "destructive", title: "Liste ID'si bulunamadı" });
            return;
        }

        const formData = new FormData();
        formData.append('id', listToDelete.id); // PHP'deki $_POST['id'] buraya gidiyor

        try {
            const response = await fetch('/api/social/deleteuserlist.php', {
                method: 'POST',
                body: formData
            });

            const resultText = await response.text();
            const result = JSON.parse(resultText);

            if (result.success) {
                // Veritabanından başarıyla silindiyse state'den de kaldır
                setListData(prev => prev.filter((_, index) => index !== indexToRemove));
            } else {
                toast({ variant: "destructive", title: "Silme hatası", description: result.message });
            }
        } catch (error) {
            console.error("Silme işlemi sırasında hata:", error);
            toast({ variant: "destructive", title: "Bağlantı hatası", description: "Sunucuyla iletişim kurulamadı." });
        }
    };

    const isEmpty = listData.length === 0;

    return (
        <PageLayout>
            <AddToListModal
                isOpen={modalVisible}
                header="Yeni Liste Oluştur"
                onClose={() => setModalVisible(false)}
                lists={[]}
                onCreateList={handleCreateList}
            />

            <AddToListModalEmpty
                isOpen={modalVisible2}
                onClose={() => setModalVisible2(false)}
                onCreate={handleCreateList}
            />

            <DeleteConfirmModal
                isOpen={deleteModalVisible}
                onClose={() => setDeleteModalVisible(false)}
                onConfirm={() => {
                    handleDelete(deleteTargetIndex);
                    setDeleteModalVisible(false);
                    setDeleteTargetIndex(null);
                }}
            />

            <PageHeader
                eyebrow="Koleksiyonlar"
                title="Liste"
                action={!isEmpty && (
                    <Button
                        onClick={() => setModalVisible2(true)}
                        className="h-auto gap-2 px-5 py-3 text-[13px] max-md:px-4"
                    >
                        <Plus className="h-4 w-4" /> Yeni liste oluştur
                    </Button>
                )}
            />

            {isEmpty && (
                <EmptyState
                    icon={ListChecks}
                    title="Henüz listeniz bulunmamaktadır"
                    actionLabel="İlk listenizi oluşturun"
                    onAction={() => setModalVisible2(true)}
                />
            )}

            <div className="flex w-full flex-col gap-3.5">
                {listData.map((item, index) => (
                    <Card key={index} className="relative flex w-full items-center gap-6 overflow-hidden p-3.5 max-md:flex-col max-md:items-start">
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push("/dashboard/chat/?botId=" + item.id);
                            }}
                            className="flex cursor-pointer items-center justify-center gap-1"
                        >
                            {item.bots && item.bots.length >= 5 ? (
                                <div className="relative flex w-[320px] items-center justify-center">
                                    <Splide
                                        options={{
                                            type: 'loop',
                                            perPage: 5,
                                            gap: '4px',
                                            arrows: false,
                                            pagination: false,
                                            autoplay: false,
                                            interval: 3000,
                                            pauseOnHover: true,
                                            resetProgress: false,
                                            height: '40px',
                                            width: '250px'
                                        }}
                                        aria-label="Bot avatars"
                                        onMounted={(splide) => {
                                            setSplideInstances(prev => ({
                                                ...prev,
                                                [`splide-${index}`]: splide
                                            }));
                                        }}
                                    >
                                        {item.bots.map((bot, botIndex) => (
                                            <SplideSlide key={botIndex}>
                                                <img src={bot.profil_fotografi} alt={`Bot ${botIndex + 1}`} className="h-11 w-11 rounded-full object-cover shadow-[0_4px_4px_5px_rgba(0,0,0,0.6)]" />
                                            </SplideSlide>
                                        ))}
                                    </Splide>

                                    <div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                splideInstances[`splide-${index}`]?.go('-1');
                                            }}
                                            className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            aria-label="Önceki"
                                        >
                                            <ChevronLeft className="h-5 w-5 text-fuchsia-400" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                splideInstances[`splide-${index}`]?.go('+1');
                                            }}
                                            className="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            aria-label="Sonraki"
                                        >
                                            <ChevronRight className="h-5 w-5 text-fuchsia-400" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                item.bots && item.bots.length > 0 && (
                                    item.bots.map((bot, botIndex) => (
                                        <img key={botIndex} src={bot.profil_fotografi} alt={`Bot ${botIndex + 1}`} className="h-11 w-11 rounded-full object-cover shadow-[0_4px_4px_5px_rgba(0,0,0,0.6)]" />
                                    ))
                                )
                            )}
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
                            <h4 className="w-full truncate font-display text-base font-semibold capitalize text-white">{item.title}</h4>
                            <p className="text-[10px] capitalize text-white/55">{item.username}</p>
                            <p className="font-display text-xs font-semibold capitalize text-white">{item.summary}</p>
                            <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4 text-white" />
                                <span className="font-display text-xs font-semibold capitalize text-white">{item.dialog}</span>
                            </div>
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTargetIndex(index);
                                setDeleteModalVisible(true);
                            }}
                            className="flex items-center justify-center text-white/50 transition-colors hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md max-md:absolute max-md:right-2 max-md:top-1/2 max-md:-translate-y-1/2"
                            aria-label="Listeyi sil"
                        >
                            <Trash2 className="h-6 w-6" />
                        </button>
                    </Card>
                ))}
            </div>
        </PageLayout>
    );
}
