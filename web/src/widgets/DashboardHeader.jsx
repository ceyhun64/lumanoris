"use client";
import Image from 'next/image';
import { Search, Bell, ShoppingCart, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import NotificationPopup from '@/features/notifications/NotificationPopup';
import ProfilePopup from '@/features/user-profile/ProfilePopup';
import QuitModal from '@/features/auth/QuitModal';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/shared/ui/tooltip';
import { Button } from '@/shared/ui/button';

const ICON_BTN_FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-luma-base';

export default function Header({ userId }) {
    const router = useRouter();
    const [showProfile, setShowProfile] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [user, setUser] = useState({
        id: 0,
        username: "",
        fullname: "",
        followerCount: 0,
        chatbotCount: 0,
        purchasedCount: 0,
        sharedDialogueCount: 0,
    });

    const fetchCartCount = async () => {
        const targetId = userId || user.id;
        if (!targetId) return;
        try {
            const res = await fetch(`/api/marketplace/getcartcount.php?user_id=${targetId}`);
            const result = await res.json();
            if (result.success) setCartCount(result.count);
        } catch (err) {
            console.error("Sepet sayısı çekilemedi:", err);
        }
    };

    const [showNotification, setShowNotification] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [cartCount, setCartCount] = useState(0);
    const [quitOpen, setQuitOpen] = useState(false);

    useEffect(() => {
        async function fetchUser() {
            const res = await fetch(`/api/user/getuserheader.php?id=${userId}`);
            const result = await res.json();
            if (result.success) {
                setUser({
                    id: result.id,
                    username: result.username,
                    fullname: result.fullname,
                    followerCount: 0,
                    chatbotCount: result.chatbotCount,
                    purchasedCount: result.purchasedCount || 0,
                    sharedDialogueCount: result.sharedDialogueCount || 0,
                });
            }
        }
        if (userId) fetchUser();
    }, [userId]);

    useEffect(() => {
        if (!user.id) return;
        fetchCartCount();
        const handleCartUpdate = () => fetchCartCount();
        window.addEventListener('cartUpdated', handleCartUpdate);
        const interval = setInterval(fetchCartCount, 30000);
        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
            clearInterval(interval);
        };
    }, [user.id]);

    const handleLogout = () => setQuitOpen(true);

    const handleConfirmLogout = async () => {
        setQuitOpen(false);
        try {
            await fetch("/api/auth/logout.php", { method: "POST", credentials: "include" });
        } catch (err) {
            console.error("Logout error:", err);
        }
        location.href = "/login";
    };

    // DB, gerçek kaynak: localStorage sadece hızlı-önizleme önbelleği olarak kullanılır.
    useEffect(() => {
        if (!userId) return;
        async function fetchDbPhoto() {
            try {
                const res = await fetch(`/api/user/user_getphoto.php?id=${userId}`);
                const result = await res.json();
                const dbImage = result.success ? (result.avatar || null) : null;
                setProfileImage(dbImage);
                if (dbImage) localStorage.setItem('userProfileImage', dbImage);
                else localStorage.removeItem('userProfileImage');
            } catch (err) {
                console.error("Profil fotoğrafı alınamadı:", err);
            }
        }
        fetchDbPhoto();
    }, [userId]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const updateCartCount = () => {
            try {
                const cartString = localStorage.getItem('cart');
                const cart = cartString ? JSON.parse(cartString) : [];
                setCartCount(Array.isArray(cart) ? cart.length : 0);
            } catch { setCartCount(0); }
        };
        const updateProfileImage = () => {
            const savedImage = localStorage.getItem('userProfileImage');
            setProfileImage(savedImage);
        };
        updateCartCount();
        updateProfileImage();
        const handleStorage = (e) => {
            if (e.key === 'cart') updateCartCount();
            if (e.key === 'userProfileImage') updateProfileImage();
        };
        window.addEventListener('storage', handleStorage);
        const handleCartUpdated = () => updateCartCount();
        const handleProfileImageUpdated = () => updateProfileImage();
        window.addEventListener('cartUpdated', handleCartUpdated);
        window.addEventListener('profileImageUpdated', handleProfileImageUpdated);
        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('cartUpdated', handleCartUpdated);
            window.removeEventListener('profileImageUpdated', handleProfileImageUpdated);
        };
    }, []);

    const goToExplore = () => {
        router.push(`/dashboard/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    };

    const handleSearchKey = (e) => {
        if (e.key === 'Enter' && searchQuery.trim() !== '') goToExplore();
    };

    return (
        <>
            {showNotification && (
                <NotificationPopup onClose={() => setShowNotification(false)} userId={user.id} />
            )}

            <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-6 px-7 bg-gradient-to-b from-[rgba(11,11,30,0.82)] to-[#09090F] backdrop-blur-xl">
                {/* Search */}
                <div className="flex flex-1 items-center max-w-[560px]">
                    <div className="flex h-11 w-full items-center gap-2.5 rounded-full bg-white/[0.045] px-3.5 ring-1 ring-inset ring-white/[0.07] transition-all duration-150 focus-within:bg-gradient-to-r focus-within:from-fuchsia-500/[0.06] focus-within:to-violet-500/[0.04] focus-within:ring-fuchsia-400/40 focus-within:shadow-[0_0_0_3px_rgba(217,70,239,0.08)]">
                        <button
                            type="button"
                            onClick={goToExplore}
                            onTouchStart={goToExplore}
                            aria-label="Keşfet"
                            className={cn('flex shrink-0 items-center justify-center text-white/35 transition-colors duration-150 hover:text-white/70', ICON_BTN_FOCUS)}
                        >
                            <Search className="h-[15px] w-[15px]" strokeWidth={2} />
                        </button>
                        <input
                            type="text"
                            placeholder="Chatbot ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchKey}
                            className="min-w-0 flex-1 bg-transparent text-[13.5px] text-white/85 outline-none placeholder:text-white/30"
                        />
                    </div>
                </div>

                {/* Right toolbar */}
                <div className="flex items-center gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => setShowNotification(true)}
                                aria-label="Bildirimler"
                                className={cn('relative flex h-11 w-11 items-center justify-center rounded-lg text-white/45 transition-all duration-150 hover:bg-gradient-to-br hover:from-fuchsia-500/20 hover:to-violet-500/12 hover:text-fuchsia-200', ICON_BTN_FOCUS)}
                            >
                                <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>Bildirimler</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => router.push('/dashboard/checkout')}
                                aria-label="Sepetim"
                                className={cn('relative flex h-11 w-11 items-center justify-center rounded-lg text-white/45 transition-all duration-150 hover:bg-gradient-to-br hover:from-fuchsia-500/20 hover:to-violet-500/12 hover:text-fuchsia-200', ICON_BTN_FOCUS)}
                            >
                                <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={1.75} />
                                {cartCount > 0 && (
                                    <span className="absolute top-0.5 right-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-gradient-btn px-1 text-[10px] font-semibold leading-none tabular-nums text-white shadow-[0_1px_6px_rgba(192,38,211,0.5)]">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>Sepetim</TooltipContent>
                    </Tooltip>

                    {/* Profile / Login */}
                    {userId ? (
                        <div
                            className="relative ml-2"
                            onMouseEnter={() => setShowProfile(true)}
                            onMouseLeave={() => setShowProfile(false)}
                        >
                            <button
                                aria-label="Profil menüsü"
                                className={cn('flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-fuchsia-500/15 to-violet-500/10 text-white/60 ring-1 ring-white/[0.12] transition-all duration-150 hover:ring-fuchsia-400/45', ICON_BTN_FOCUS)}
                            >
                                {profileImage ? (
                                    <Image
                                        src={profileImage}
                                        alt=""
                                        width={44}
                                        height={44}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <User className="h-[19px] w-[19px]" strokeWidth={1.75} />
                                )}
                            </button>
                            {showProfile && (
                                <div className="absolute top-[54px] right-0 z-[100000]">
                                    <ProfilePopup user={user} onLogout={handleLogout} />
                                </div>
                            )}
                        </div>
                    ) : (
                        <Button
                            onClick={() => router.push('/login')}
                            className="ml-2 h-11 px-5 text-[13.5px]"
                        >
                            Giriş Yap
                        </Button>
                    )}
                </div>
            </header>

            <QuitModal
                isOpen={quitOpen}
                onClose={() => setQuitOpen(false)}
                onConfirm={handleConfirmLogout}
            />
        </>
    );
}
