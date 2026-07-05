import { useState, useEffect } from 'react'
import btnbell from "@/images/btn-bell.svg";
import btnbellclosed from "@/images/bell-closed.png";

import ShareModal from '@/features/sharing/ShareModal';
import ReportModal from '@/features/moderation/ReportModal';
import AddToListModal from '@/features/lists/AddToListModal';
import BlockModal from '@/features/moderation/BlockModal';
import CommentModal from '@/features/comments/CommentModal';
import BuyModal from '@/features/purchasing/BuyModal';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/shared/ui/dropdown-menu';
import { Bell, BellOff, ThumbsUp, ThumbsDown, Share2, MessageCircle, ListPlus, MoreHorizontal, ShoppingCart, EyeOff, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfileCard({bot, comments}) {
    const [isFollowing, setIsFollowing] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true); // opsiyonel, isterseniz mantık da ekleyebiliriz
    const [shareOpen, setShareOpen] = useState(false);
    const [blockOpen, setBlockOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [commentOpen, setCommentOpen] = useState(false);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(bot.likes || 0);
    const [disliked, setDisliked] = useState(false);
    const [dislikeCount, setDislikeCount] = useState(bot.dislikes || 0); // varsayılan değer
    const router = useRouter();
    const [cartAdded, setCartAdded] = useState(false);
    const [isInCart, setIsInCart] = useState(false);
    const [userId, setUserId] = useState(null);
    const [userLists, setUserLists] = useState([]);
    const [commentCount, setCommentCount] = useState(comments.length);
    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
    const [cartDurationWeeks, setCartDurationWeeks] = useState(null);
    const [profile, setProfile] = useState({
        id: null,
        title: "",
        author: "",
        seller: "",
        description: "",
        image: "",
        price: 0,
        priceType: "TL",
        duration: "1",
        follows: 0,
        commentCount: 0,
    });
    const formatImage = (img) => {
        if (!img) return "";
        return img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`;
    };
    useEffect(() => {
        if (bot) {
            //console.log(bot);
        setProfile({
            id: bot.id,
            title: bot.isim,
            author: bot.author_username, // Şimdilik ID
            seller: bot.owner_username,
            description: bot.aciklama,
            image: formatImage(bot.profil_fotografi),
            price: 0,
            priceType: "TL",
            duration: "1",
            follows: bot.follows,
            commentCount: comments.count || 0,
        });
        }
    }, [bot, comments]);

    // Not: Chatbot profili girişsiz de görüntülenebilir (sadece içerik
    // gösterimi); beğeni/yorum/takip/satın alma gibi aksiyonlar kendi
    // handler'larında userId kontrolü yapıp gerekirse /login'e yönlendirir.
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
                        }
                    } catch (err) {
                        console.error("Session check error:", err);
                    }
                }
                checkSession();
            }, [router]);

    useEffect(() => {
        const fetchCartStatus = async (uid) => {
            try {
                const response = await fetch(`/api/marketplace/getcart.php?user_id=${uid}`);
                const data = await response.json();

                if (Array.isArray(data)) {
                    const existing = data.find(item => Number(item.chatbot_id) === Number(profile.id));
                    if (existing) {
                        setIsInCart(true);
                        setCartDurationWeeks(existing.order_weeks ? parseInt(existing.order_weeks, 10) : 4);
                    }
                }
            } catch (error) {
                console.error("Sepet durumu alınamadı:", error);
            }
        };

        if (userId && profile.id) {
            fetchCartStatus(userId);
        }
    }, [userId, profile.id]);

    useEffect(() => {
        const fetchUserLists = async (uid) => {
            try {
                const response = await fetch(`/api/social/getuserlists.php?id=${uid}`);
                const data = await response.json();

                if (Array.isArray(data?.lists)) {
                    // Sadece id ve userId'yi al, gerisini siktir et
                    const minimalLists = data.lists.map(list => ({
                        id: list.id,
                        userId: uid,
                        name: list.name
                    }));

                    setUserLists(minimalLists); // userLists state'ine sadece bu ikiliyi atar
                }
            } catch (error) {
                console.error("Hata:", error);
            }
        };

        if (userId) {
            fetchUserLists(userId);
        }
    }, [userId]);

    useEffect(() => {
        const checkUserLike = async () => {
            try {
                const res = await fetch(`/api/social/diduserlike.php?chatbot_id=${bot.id}`);

                const resultText = await res.text();
                //console.log(resultText);
                const result = JSON.parse(resultText);

                if (result.success) {
                setLiked(result.didLike); // backend'den gelen boolean
                }
            } catch (err) {
                console.error("diduserlike API error:", err);
            }
        };

        const checkUserDisLike = async () => {
            try {
                const res = await fetch(`/api/social/diduserdislike.php?chatbot_id=${bot.id}`);

                const resultText = await res.text();
                //console.log(resultText);
                const result = JSON.parse(resultText);

                if (result.success) {
                setDisliked(result.didDisLike); // backend'den gelen boolean
                }
            } catch (err) {
                console.error("diduserdislike API error:", err);
            }
        };

        const checkUserFollow = async () => {
            try {
            const res = await fetch(`/api/social/diduserfollow.php?chatbot_id=${bot.id}`);

            const result = await res.json();
            //console.log("Follow API result:", result);

            if (result.success) {
                setIsFollowing(result.didFollow); // backend'den gelen boolean
            }
            } catch (err) {
            console.error("diduserfollow API error:", err);
            }
        };

        checkUserLike();
        checkUserDisLike();
        checkUserFollow();
    }, [profile.id, userId]);

    const handleAddToCart = async (e) => {
    e?.stopPropagation && e.stopPropagation();

    if (!userId || !profile.id) {
        router.push('/login');
        return;
    }

    const payload = {
        user_id: userId,
        chatbot_id: profile.id,
        order_weeks: 1
    };

    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));

    try {
        const response = await fetch('/api/marketplace/addtocart.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            setCartAdded(true);
            setIsInCart(true);
            window.dispatchEvent(new Event('cartUpdated'));
            // 2 saniye sonra "Sepete eklendi" bildirimini kapatır
            setTimeout(() => {
                setCartAdded(false);
            }, 2000);
        } else {
            alert(result.message || "Sepete eklenirken bir hata oluştu.");
        }
    } catch (error) {
        console.error("Sepet hatası:", error);
        alert("Sunucuyla bağlantı kurulamadı.");
    }
};

    useEffect(() => {
        if (typeof window !== "undefined") {
            const cartString = localStorage.getItem('cart');
            if (cartString) {
                try {
                    const cart = JSON.parse(cartString);
                    const found = cart.some(item => item.id === `${profile.id}-${profile.title}-${profile.author}`);
                    setIsInCart(found);
                } catch (e) {
                    setIsInCart(false);
                }
            }
        }
    }, [profile?.id, profile?.title, profile?.author, cartAdded]);

    // Satın al fonksiyonu
    const handleBuy = (e) => {
        e?.stopPropagation && e.stopPropagation();
        if (!userId) {
             router.push('/login');
             return;
        }
        setIsBuyModalOpen(true); // Modalı aç
    };

    const handleNotInterested = async () => {
        if (!userId) { router.push('/login'); return; }

        // 1. Kullanıcıdan onay al
        const isConfirmed = typeof window !== 'undefined' ? window.confirm("Bu kategoriyle ilgilenmediğinizi bildirmek istediğinize emin misiniz? Bu kategorideki içerikleri artık daha az göreceksiniz.") : false;

        if (!isConfirmed) return; // İptal ederse durdur

        // 2. Gönderilecek veriyi hazırla
        // bot.kategori_id veya o an hangi kategorideyse onun ID'sini alıyoruz
        const payload = {
            user_id: userId,
            category_id: bot?.kategori_id || selectedCategory?.id
        };

        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));

        try {
            const response = await fetch('/api/social/adduninterest.php', {
                method: 'POST',
                body: formData
            });

            const resultText = await response.text();
            //console.log(resultText);
            const result = JSON.parse(resultText);
            //const result = await response.json();

            if (result.success) {
                alert("Geri bildiriminiz alındı, teşekkür ederiz.");
                // 3. Başarılıysa Dashboard'a yönlendir
                router.push("/dashboard");
            } else {
                alert("Bir hata oluştu: " + result.message);
            }
        } catch (error) {
            console.error("Hata:", error);
            alert("Sunucuyla bağlantı kurulamadı.");
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/20 bg-white/[0.04] p-3">
            {/* Üst Bilgi */}
            <div className="flex w-full flex-col items-center justify-between gap-8 md:flex-row">
                <div className="flex w-full flex-col items-center gap-8 md:w-auto md:flex-row md:items-start">
                    <div className="mx-auto h-[120px] w-[120px] shrink-0 overflow-hidden rounded-[6px] md:mx-0">
                        {profile.image && <img src={profile.image} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className='flex flex-col items-start gap-3'>
                        <h2 className="font-display text-2xl font-semibold text-white">{profile.title}</h2>
                        <p className="text-sm font-medium text-white">{profile.follows} takipçi</p>
                        <p className="text-sm font-medium text-white/55">{profile.seller}</p>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-3">
                    <button
                        className={cn(
                            "flex h-12 min-w-[220px] items-center justify-center rounded-lg border-[3px] border-transparent px-4 font-display text-xs font-bold text-white transition-all duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            isFollowing
                                ? "bg-origin-border [background-clip:padding-box,border-box] [background-image:linear-gradient(#18171F,#18171F),linear-gradient(150deg,#993D76,#c05396)] scale-[1.03]"
                                : "bg-origin-border [background-clip:padding-box,border-box] [background-image:linear-gradient(#18171F,#18171F),linear-gradient(150deg,rgba(10,65,132,0.66),rgba(84,16,58,0.66))] hover:border-[#993D76]",
                        )}
                        onClick={async () => {
                            if (!userId) { router.push('/login'); return; }
                            try {
                            const res = await fetch("/api/social/followchatbot.php", {
                                method: "POST",
                                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                                body: new URLSearchParams({
                                data: JSON.stringify({
                                    user_id: userId,
                                    chatbot_id: profile.id,
                                }),
                                }),
                            });

                            const result = await res.json();

                            if (result.success) {
                                if (result.action === "follow") {
                                setIsFollowing(true);
                                // takipçi sayısını artır
                                setProfile((prev) => ({
                                    ...prev,
                                    follows: prev.follows + 1,
                                }));
                                } else if (result.action === "unfollowed") {
                                setIsFollowing(false);
                                // takipçi sayısını azalt
                                setProfile((prev) => ({
                                    ...prev,
                                    follows: prev.follows - 1,
                                }));
                                }
                            }
                            } catch (err) {
                            console.error("Follow API error:", err);
                            }
                        }}
                        >
                        {isFollowing ? "Takipten Çık" : "Takip Et"}
                    </button>

                    {/* Bildirim Butonu ve Menü */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="flex items-center justify-center rounded-lg p-3 text-white/70 transition-transform duration-200 hover:scale-110 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label="Bildirim ayarları"
                            >
                                {notificationsEnabled ? <Bell className="h-6 w-6" /> : <BellOff className="h-6 w-6" />}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setNotificationsEnabled(true)}>
                                <Bell className="text-pink-400" />
                                Tümünü Aç
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setNotificationsEnabled(false)}>
                                <BellOff className="text-white" />
                                Tümünü Kapat
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Orta Butonlar */}
            <div className="flex w-full flex-wrap items-center justify-start gap-3">
                <div className="flex items-center gap-3 rounded-2xl border border-white/25 bg-white/[0.04] px-3 py-3 font-display text-xs font-semibold capitalize text-white transition-all duration-200 hover:scale-[1.03] hover:bg-[#2a2a2a] hover:shadow-[0_4px_10px_rgba(255,255,255,0.05)]">
                    <button className={cn("flex items-center gap-1.5 border-r border-white pr-6", liked && "text-indigo-400")}
                        onClick={async () => {
                        if (!userId) { router.push('/login'); return; }
                        try {
                        const res = await fetch("/api/social/likechatbot.php", {
                            method: "POST",
                            headers: { "Content-Type": "application/x-www-form-urlencoded" },
                            body: new URLSearchParams({
                            data: JSON.stringify({
                                user_id: userId,
                                chatbot_id: profile.id,
                            }),
                            }),
                        });
                        const result = await res.json();

                        if (result.success) {
                            if (result.action === "liked") {
                            setLiked(true);
                            setLikeCount((prev) => prev + 1);
                            if (disliked) {
                                setDisliked(false);
                                setDislikeCount((prev) => prev - 1);
                            }
                            } else if (result.action === "unliked") {
                            setLiked(false);
                            setLikeCount((prev) => prev - 1);
                            }
                        }
                        } catch (err) {
                        console.error("Like API error:", err);
                        }
                    }}
                    >
                        <ThumbsUp className="h-[18px] w-[18px]" />
                        {likeCount}
                    </button>
                    <button className={cn("flex items-center gap-1.5", disliked && "text-rose-400")}
                        onClick={async () => {
                        if (!userId) { router.push('/login'); return; }
                        try {
                        const res = await fetch("/api/social/dislikechatbot.php", {
                            method: "POST",
                            headers: { "Content-Type": "application/x-www-form-urlencoded" },
                            body: new URLSearchParams({
                            data: JSON.stringify({
                                user_id: userId,
                                chatbot_id: profile.id,
                            }),
                            }),
                        });
                        const result = await res.json();

                        if (result.success) {
                            if (result.action === "disliked") {
                            setDisliked(true);
                            setDislikeCount((prev) => prev + 1);
                            if (liked) {
                                setLiked(false);
                                setLikeCount((prev) => prev - 1);
                            }
                            } else if (result.action === "undisliked") {
                            setDisliked(false);
                            setDislikeCount((prev) => prev - 1);
                            }
                        }
                        } catch (err) {
                        console.error("Dislike API error:", err);
                        }
                    }}
                    >
                        <ThumbsDown className="h-[18px] w-[18px]" />
                        {dislikeCount}
                    </button>
                </div>
                <button
                    className='flex items-center gap-3 rounded-2xl border border-white/25 bg-white/[0.04] px-3 py-3 font-display text-xs font-semibold capitalize text-white transition-all duration-200 hover:scale-[1.03] hover:bg-[#2a2a2a] hover:shadow-[0_4px_10px_rgba(255,255,255,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    onClick={() => setShareOpen(true)}
                >
                    <Share2 className="h-[18px] w-[18px]" />
                    Paylaş
                </button>
                <button
                    onClick={() => setCommentOpen(true)}
                    className='flex items-center gap-3 rounded-2xl border border-white/25 bg-white/[0.04] px-3 py-3 font-display text-xs font-semibold capitalize text-white transition-all duration-200 hover:scale-[1.03] hover:bg-[#2a2a2a] hover:shadow-[0_4px_10px_rgba(255,255,255,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                >
                    <MessageCircle className="h-[18px] w-[18px]" />
                    {commentCount} Yorum
                </button>
                <button
                    className='flex items-center gap-3 rounded-2xl border border-white/25 bg-white/[0.04] px-3 py-3 font-display text-xs font-semibold capitalize text-white transition-all duration-200 hover:scale-[1.03] hover:bg-[#2a2a2a] hover:shadow-[0_4px_10px_rgba(255,255,255,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    onClick={() => setModalVisible(true)}
                >
                    <ListPlus className="h-[18px] w-[18px]" />
                    Listeye Ekle
                </button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-3 rounded-2xl border border-white/25 bg-white/[0.04] px-3 py-3 font-display text-xs font-semibold capitalize text-white transition-all duration-200 hover:scale-[1.03] hover:bg-[#2a2a2a] hover:shadow-[0_4px_10px_rgba(255,255,255,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <MoreHorizontal className="h-[18px] w-[18px]" />
                            Diğer
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleNotInterested}>
                            <EyeOff className="text-pink-400" />
                            İlgilenmiyorum
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setReportOpen(true)}>
                            <Flag className="text-fuchsia-400" />
                            Bildir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <button
                    className={cn(
                        "relative z-0 flex h-[47px] min-h-[47px] w-[47px] min-w-[47px] items-center justify-center rounded-full bg-[linear-gradient(329deg,#3730A3_-2.05%,rgba(6,182,212,0)_178.12%)] text-white shadow-[inset_0_0_0_1.5px_rgba(99,102,241,0.31)] transition-all duration-300 hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isInCart && "pointer-events-none opacity-70",
                    )}
                    onClick={handleAddToCart}
                    aria-label="Sepete ekle"
                >
                    <ShoppingCart className="h-5 w-5" />
                </button>
                <button
                    className="relative z-0 flex h-[47px] min-w-[130px] items-center justify-center rounded-[33px] bg-[linear-gradient(329deg,#3730A3_-2.05%,rgba(6,182,212,0)_178.12%)] px-7 font-display text-[15px] font-medium text-white shadow-[inset_0_0_0_1.5px_rgba(99,102,241,0.31)] transition-all duration-300 hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={handleBuy}
                >
                    Satın Al - ₺{bot.ucret_haftalik}
                </button>

            </div>


            {/* Açıklama */}
            <p className="w-full text-left text-sm leading-relaxed text-white/80">
                {profile.description}
            </p>

            <CommentModal
                isOpen={commentOpen}
                onClose={() => setCommentOpen(false)}
                comments={comments}
                onSend={async (commentText) => {
                    if (!userId) { router.push('/login'); return; }
                    const payload = {
                    user_id: userId,      // giriş yapan kullanıcı id'si
                    chatbot_id: profile.id,   // yorum yapılan chatbot id'si
                    comment: commentText
                    };

                    try {
                    const formData = new FormData();
                    formData.append("data", JSON.stringify(payload));

                    const res = await fetch("/api/social/addcomment.php", {
                        method: "POST",
                        body: formData
                    });
                    const resultText = await res.text();
                    //console.log(resultText);
                    const result = JSON.parse(resultText);
                    if (result.success) {
                        //console.log("Yeni yorum eklendi:", result);
                        // yorum listesini güncelle
                        setCommentCount(prev => prev + 1);
                    } else {
                        alert(result.message);
                    }
                    } catch (err) {
                    alert("Yorum eklenemedi: " + err.message);
                    }
                }}
                />

            <BuyModal
                isOpen={isBuyModalOpen}
                onClose={() => setIsBuyModalOpen(false)}
                botData={bot} // Bot verisi modalda fiyat hesaplama için kullanılıyor
                userId={userId}
                initialDurationWeeks={cartDurationWeeks}
            />

            <BlockModal isOpen={blockOpen} onClose={() => setBlockOpen(false)} />
            <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} />
            <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} />
            <AddToListModal userId={userId} botId={profile.id}
                isOpen={modalVisible}
                onClose={() => setModalVisible(false)}
                lists={userLists}
            />
            {cartAdded && (
                <div className="fixed bottom-6 right-6 bg-indigo-400 text-white px-3 py-1.5 rounded-lg text-[13px] font-medium animate-[fadeInOut_2s_ease_forwards] pointer-events-none z-[999999]">
                    Sepete eklendi!
                </div>
            )}
        </div>
    )
}
