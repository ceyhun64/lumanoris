import { useState, useEffect } from 'react'
import ShareModal from '@/features/sharing/ShareModal';
import ReportModal from '@/features/moderation/ReportModal';
import AddToListModal from '@/features/lists/AddToListModal';
import BlockModal from '@/features/moderation/BlockModal';
import CommentModal from '@/features/comments/CommentModal';
import BuyModal from '@/features/purchasing/BuyModal';
import DeleteConfirmModal from '@/shared/ui/DeleteConfirmModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { useRouter } from 'next/navigation';
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuLabel,
} from '@/shared/ui/dropdown-menu';
import {
    Bell, BellOff, ThumbsUp, ThumbsDown, Share2, MessageCircle, ListPlus,
    MoreHorizontal, ShoppingCart, EyeOff, Flag, ArrowRight, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/shared/hooks/use-toast';
import { requireLogin } from '@/shared/lib/auth-guard';
import { resolveAvatarSrc } from '@/shared/lib/image';

function formatCompact(n) {
    const num = Number(n) || 0;
    if (num >= 1000) return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1).replace('.', ',') + ' B';
    return String(num);
}

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
    const [pastConversations, setPastConversations] = useState([]);
    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
    const [notInterestedConfirmOpen, setNotInterestedConfirmOpen] = useState(false);
    const [cartDurationWeeks, setCartDurationWeeks] = useState(null);
    const [infoOpen, setInfoOpen] = useState(false);
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

                if (data?.success && Array.isArray(data.cart)) {
                    const existing = data.cart.find(item => Number(item.chatbot_id) === Number(profile.id));
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

    // "Örnek Geçmiş" — this bot's own past conversations with the current
    // user, so they can jump straight back into one instead of starting over.
    useEffect(() => {
        const fetchPastConversations = async (uid) => {
            try {
                const res = await fetch(`/api/chat/gethistory.php?user_id=${uid}`);
                const data = await res.json();
                const items = Array.isArray(data?.results)
                    ? data.results.filter(item => Number(item.chatbot_id) === Number(profile.id))
                    : [];
                setPastConversations(items.slice(0, 3));
            } catch (err) {
                console.error("Geçmiş sohbetler alınamadı:", err);
            }
        };

        if (userId && profile.id) {
            fetchPastConversations(userId);
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
        // Deps used to be [profile.id, userId] — neither is actually read
        // inside this fetch (it uses bot.id directly, and the backend reads
        // identity from the session cookie via optionalAuth(), not a request
        // param), but both values change asynchronously right after mount
        // (profile.id: null -> bot.id once the [bot,comments] effect above
        // runs; userId: undefined -> real id once the session check
        // resolves) — each transition re-ran this effect, firing the same
        // request 3 times. bot.id is already stable by the time this
        // component mounts (the parent only renders it once bot exists).
        if (!bot.id) return;

        const checkUserBotStatus = async () => {
            try {
                const res = await fetch(`/api/social/getuserbotstatus.php?chatbot_id=${bot.id}`);
                const result = await res.json();

                if (result.success) {
                    setLiked(result.didLike);
                    setDisliked(result.didDisLike);
                    setIsFollowing(result.didFollow);
                }
            } catch (err) {
                console.error("getuserbotstatus API error:", err);
            }
        };

        checkUserBotStatus();
    }, [bot.id]);

    const handleAddToCart = async (e) => {
    e?.stopPropagation && e.stopPropagation();

    if (!requireLogin(userId, router)) return;
    if (!profile.id) {
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
            toast({ variant: "destructive", title: "Sepete eklenemedi", description: result.message || "Bilinmeyen bir hata oluştu." });
        }
    } catch (error) {
        console.error("Sepet hatası:", error);
        toast({ variant: "destructive", title: "Bağlantı hatası", description: "Sunucuyla bağlantı kurulamadı." });
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
        if (!requireLogin(userId, router)) return;
        setIsBuyModalOpen(true); // Modalı aç
    };

    const handleNotInterested = () => {
        if (!requireLogin(userId, router)) return;
        setNotInterestedConfirmOpen(true);
    };

    const confirmNotInterested = async () => {
        setNotInterestedConfirmOpen(false);

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
            const result = JSON.parse(resultText);
            //const result = await response.json();

            if (result.success) {
                toast({ variant: "success", title: "Teşekkürler", description: "Geri bildiriminiz alındı." });
                // 3. Başarılıysa Dashboard'a yönlendir
                router.push("/dashboard");
            } else {
                toast({ variant: "destructive", title: "Bir hata oluştu", description: result.message });
            }
        } catch (error) {
            console.error("Hata:", error);
            toast({ variant: "destructive", title: "Bağlantı hatası", description: "Sunucuyla bağlantı kurulamadı." });
        }
    };

    const avatarSrc = profile.image || resolveAvatarSrc(null).src;
    const isPaidAndUnowned = Number(bot.ucret_haftalik) > 0 && !isInCart;

    const followToggle = async () => {
        if (!requireLogin(userId, router)) return;
        try {
            const res = await fetch("/api/social/followchatbot.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    data: JSON.stringify({ user_id: userId, chatbot_id: profile.id }),
                }),
            });
            const result = await res.json();
            if (result.success) {
                if (result.action === "follow") {
                    setIsFollowing(true);
                    setProfile((prev) => ({ ...prev, follows: prev.follows + 1 }));
                } else if (result.action === "unfollowed") {
                    setIsFollowing(false);
                    setProfile((prev) => ({ ...prev, follows: prev.follows - 1 }));
                }
            }
        } catch (err) {
            console.error("Follow API error:", err);
        }
    };

    const toggleLike = async () => {
        if (!requireLogin(userId, router)) return;
        try {
            const res = await fetch("/api/social/likechatbot.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    data: JSON.stringify({ user_id: userId, chatbot_id: profile.id }),
                }),
            });
            const result = await res.json();
            if (result.success) {
                if (result.action === "liked") {
                    setLiked(true);
                    setLikeCount((prev) => prev + 1);
                    if (disliked) { setDisliked(false); setDislikeCount((prev) => prev - 1); }
                } else if (result.action === "unliked") {
                    setLiked(false);
                    setLikeCount((prev) => prev - 1);
                }
            }
        } catch (err) {
            console.error("Like API error:", err);
        }
    };

    const toggleDislike = async () => {
        if (!requireLogin(userId, router)) return;
        try {
            const res = await fetch("/api/social/dislikechatbot.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    data: JSON.stringify({ user_id: userId, chatbot_id: profile.id }),
                }),
            });
            const result = await res.json();
            if (result.success) {
                if (result.action === "disliked") {
                    setDisliked(true);
                    setDislikeCount((prev) => prev + 1);
                    if (liked) { setLiked(false); setLikeCount((prev) => prev - 1); }
                } else if (result.action === "undisliked") {
                    setDisliked(false);
                    setDislikeCount((prev) => prev - 1);
                }
            }
        } catch (err) {
            console.error("Dislike API error:", err);
        }
    };

    return (
        <>
            {/* Sohbetin üstünde kalıcı olarak duran ince bir başlık — botun
                tüm pazaryeri paneli (açıklama, yorumlar, beğeni, paylaş vb.)
                artık burada değil; kullanıcının dikkati sohbette kalsın diye
                isme tıklanınca açılan bir diyaloğa taşındı. */}
            <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 border-b border-white/[0.06] bg-luma-base/85 px-4 py-3 backdrop-blur-md md:-mx-16 md:px-16">
                <button
                    onClick={() => setInfoOpen(true)}
                    className="group -m-1.5 flex min-w-0 items-center gap-3 rounded-lg p-1.5 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-fuchsia-400/25">
                        <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                        <p className="flex items-center gap-1 truncate font-display text-[14.5px] font-bold text-white">
                            {profile.title}
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/30 transition-transform group-hover:translate-x-0.5" />
                        </p>
                        <p className="truncate text-[12px] text-white/45">
                            {formatCompact(profile.follows)} takipçi · {formatCompact(bot.toplam_chats)} diyalog
                        </p>
                    </div>
                </button>

                <div className="flex shrink-0 items-center gap-2">
                    {isPaidAndUnowned && (
                        <button
                            className="hidden h-9 shrink-0 items-center justify-center rounded-full bg-gradient-btn px-4 font-display text-[12.5px] font-semibold text-white shadow-glow transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex"
                            onClick={handleBuy}
                        >
                            Satın Al · {bot.ucret_haftalik}₺
                        </button>
                    )}

                    <button
                        onClick={followToggle}
                        className={cn(
                            "flex h-9 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-transparent px-3.5 font-display text-[12px] font-bold text-white transition-all duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            isFollowing
                                ? "bg-origin-border [background-clip:padding-box,border-box] [background-image:linear-gradient(#18171F,#18171F),linear-gradient(150deg,#D946EF,#E879F9)]"
                                : "bg-white/[0.04] hover:bg-white/[0.08]",
                        )}
                    >
                        {isFollowing ? "Takipte" : "Takip Et"}
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label="Daha fazla seçenek"
                            >
                                <MoreHorizontal className="h-[18px] w-[18px]" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[200px]">
                            <DropdownMenuItem onClick={toggleLike} className={cn(liked && "text-fuchsia-300")}>
                                <ThumbsUp className="h-4 w-4" /> Beğen · {formatCompact(likeCount)}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={toggleDislike} className={cn(disliked && "text-rose-300")}>
                                <ThumbsDown className="h-4 w-4" /> Beğenme · {formatCompact(dislikeCount)}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setCommentOpen(true)}>
                                <MessageCircle className="h-4 w-4" /> Yorumlar · {commentCount}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShareOpen(true)}>
                                <Share2 className="h-4 w-4" /> Paylaş
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setModalVisible(true)}>
                                <ListPlus className="h-4 w-4" /> Listeye Ekle
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={handleAddToCart}
                                className={cn(isInCart && "pointer-events-none opacity-50")}
                            >
                                <ShoppingCart className="h-4 w-4" /> {isInCart ? "Sepette" : "Sepete Ekle"}
                            </DropdownMenuItem>
                            {isPaidAndUnowned && (
                                <DropdownMenuItem onClick={handleBuy} className="sm:hidden">
                                    <ShoppingCart className="h-4 w-4" /> Satın Al · {bot.ucret_haftalik}₺
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Bildirimler</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setNotificationsEnabled(!notificationsEnabled)}>
                                {notificationsEnabled
                                    ? <><BellOff className="h-4 w-4" /> Bildirimleri Kapat</>
                                    : <><Bell className="h-4 w-4" /> Bildirimleri Aç</>}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleNotInterested}>
                                <EyeOff className="h-4 w-4 text-fuchsia-400" /> İlgilenmiyorum
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setReportOpen(true)}>
                                <Flag className="h-4 w-4 text-fuchsia-400" /> Bildir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* "Bot Hakkında" — pazaryeri profilinin tam hâli artık burada,
                istek üzerine açılıyor; sohbet ekranına kalıcı yük bindirmiyor. */}
            <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3.5">
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl ring-2 ring-fuchsia-400/20">
                                <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0">
                                <DialogTitle className="truncate">{profile.title}</DialogTitle>
                                <p className="text-[13px] text-white/55">
                                    {formatCompact(profile.follows)} takipçi · {formatCompact(bot.toplam_chats)} diyalog
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    <p className="text-left text-sm leading-relaxed text-white/80">
                        {profile.description}
                    </p>

                    {pastConversations.length > 0 && (
                        <div className="flex w-full flex-col gap-2">
                            <p className="text-[11px] font-display font-semibold uppercase tracking-[0.1em] text-white/40">Geçmiş Sohbetler</p>
                            {pastConversations.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setInfoOpen(false);
                                        router.push(`/dashboard/chat/?botId=${profile.id}&convId=${item.id}`);
                                    }}
                                    className="flex w-full items-center justify-between rounded-lg bg-white/[0.04] px-4 py-2.5 text-left transition-colors duration-200 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <span className="truncate text-[13px] text-white/70">{item.conversation_name}</span>
                                    <ArrowRight className="h-4 w-4 shrink-0 text-white/40" />
                                </button>
                            ))}
                        </div>
                    )}

                    {isPaidAndUnowned && (
                        <button
                            className="flex h-11 w-full items-center justify-center rounded-xl bg-gradient-btn font-display text-[13px] font-semibold text-white shadow-glow transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() => { setInfoOpen(false); handleBuy(); }}
                        >
                            Satın Al · {bot.ucret_haftalik}₺
                        </button>
                    )}
                </DialogContent>
            </Dialog>

            <CommentModal
                isOpen={commentOpen}
                onClose={() => setCommentOpen(false)}
                comments={comments}
                onSend={async (commentText) => {
                    if (!requireLogin(userId, router)) return;
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
                    const result = JSON.parse(resultText);
                    if (result.success) {
                        // yorum listesini güncelle
                        setCommentCount(prev => prev + 1);
                    } else {
                        toast({ variant: "destructive", title: "Yorum eklenemedi", description: result.message });
                    }
                    } catch (err) {
                    toast({ variant: "destructive", title: "Yorum eklenemedi", description: err.message });
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
            <DeleteConfirmModal
                isOpen={notInterestedConfirmOpen}
                onClose={() => setNotInterestedConfirmOpen(false)}
                onConfirm={confirmNotInterested}
                title="İlgilenmiyor musunuz?"
                description="Bu kategoriyle ilgilenmediğinizi bildirmek istediğinize emin misiniz? Bu kategorideki içerikleri artık daha az göreceksiniz."
                confirmLabel="Onayla"
            />
            {cartAdded && (
                <div className="fixed bottom-6 right-6 bg-fuchsia-400 text-white px-3 py-1.5 rounded-lg text-[13px] font-medium animate-[fadeInOut_2s_ease_forwards] pointer-events-none z-[999999]">
                    Sepete eklendi!
                </div>
            )}
        </>
    )
}
