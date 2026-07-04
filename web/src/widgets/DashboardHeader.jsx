"use client";
import Image from 'next/image';
import searchIcon from '@/images/search-icon.svg';
import bellIcon from '@/images/bell-icon.svg';
import cartIcon from '@/images/cart-icon.svg';
import userIcon from '@/images/user-icon.svg';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import NotificationPopup from '@/features/notifications/NotificationPopup';
import ProfilePopup from '@/features/user-profile/ProfilePopup';
import QuitModal from '@/features/auth/QuitModal';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/shared/ui/tooltip';

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

            <header className="sticky top-0 z-[100] flex items-center justify-between px-6 py-3 bg-[rgba(9,9,15,0.80)] backdrop-blur-xl border-b border-indigo-400/8">
                {/* Search */}
                <div className="flex items-center gap-2 flex-1 max-w-[440px]">
                    <div className="flex items-center w-full rounded-[14px] bg-[rgba(15,15,34,0.90)] border border-indigo-400/12 overflow-hidden focus-within:border-indigo-500/45 focus-within:shadow-[0_0_0_2px_rgba(99,102,241,0.10)] transition-all duration-200">
                        <input
                            type="text"
                            placeholder="KEŞFET"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchKey}
                            className="flex-1 bg-transparent border-none outline-none px-4 py-2.5 text-[15px] text-white/80 placeholder:text-white/28 placeholder:font-display placeholder:tracking-[0.12em] placeholder:text-[13px]"
                        />
                        <button
                            onClick={goToExplore}
                            onTouchStart={goToExplore}
                            aria-label="Keşfet"
                            className={cn('flex items-center justify-center w-10 h-10 text-white/50 hover:text-indigo-400 transition-colors duration-150 rounded-lg', ICON_BTN_FOCUS)}
                        >
                            <Image src={searchIcon} alt="" width={18} height={18} />
                        </button>
                    </div>
                </div>

                {/* Right icons */}
                <div className="flex items-center gap-1.5">
                    {/* Bell */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => setShowNotification(true)}
                                aria-label="Bildirimler"
                                className={cn('relative flex items-center justify-center w-10 h-10 rounded-xl bg-[rgba(15,15,28,0.70)] border border-indigo-400/10 text-white/60 hover:bg-indigo-500/10 hover:text-indigo-300 hover:border-indigo-400/30 transition-all duration-150', ICON_BTN_FOCUS)}
                            >
                                <Image src={bellIcon} alt="" width={20} height={20} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>Bildirimler</TooltipContent>
                    </Tooltip>

                    {/* Cart */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => router.push('/dashboard/checkout')}
                                aria-label="Sepetim"
                                className={cn('relative flex items-center justify-center w-10 h-10 rounded-xl bg-[rgba(15,15,28,0.70)] border border-indigo-400/10 text-white/60 hover:bg-indigo-500/10 hover:text-indigo-300 hover:border-indigo-400/30 transition-all duration-150', ICON_BTN_FOCUS)}
                            >
                                <Image src={cartIcon} alt="" width={20} height={20} />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-gradient-btn text-white text-[10px] font-bold font-display leading-none">
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
                            className="relative"
                            onMouseEnter={() => setShowProfile(true)}
                            onMouseLeave={() => setShowProfile(false)}
                        >
                            <button
                                aria-label="Profil menüsü"
                                className={cn('flex items-center justify-center w-10 h-10 rounded-xl bg-[rgba(15,15,28,0.70)] border border-indigo-400/10 text-white/60 hover:bg-indigo-500/10 hover:border-indigo-400/30 transition-all duration-150 overflow-hidden', ICON_BTN_FOCUS)}
                            >
                                <Image
                                    src={profileImage || userIcon}
                                    alt=""
                                    width={24}
                                    height={24}
                                    className="rounded-full object-cover"
                                />
                            </button>
                            {showProfile && (
                                <div className="absolute top-[50px] right-0 z-[100000]">
                                    <ProfilePopup user={user} onLogout={handleLogout} />
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => router.push('/login')}
                            className={cn('px-5 py-2 rounded-xl bg-gradient-btn text-white text-[15px] font-semibold font-display tracking-wide shadow-[0_4px_16px_rgba(79,70,229,0.35)] hover:brightness-110 hover:-translate-y-0.5 transition-all duration-150', ICON_BTN_FOCUS)}
                        >
                            Giriş Yap
                        </button>
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
