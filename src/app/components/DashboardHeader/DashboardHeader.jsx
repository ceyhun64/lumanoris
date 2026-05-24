"use client";
import './Header.css';
import Image from 'next/image';

import searchIcon from '../../../images/search-icon.svg';
import bellIcon from '../../../images/bell-icon.svg';
import cartIcon from '../../../images/cart-icon.svg';
import userIcon from '../../../images/user-icon.svg';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import NotificationPopup from '../NotificationPopup';
import ProfilePopup from '../ProfilePopup';
import QuitModal from '../QuitModal/QuitModal';
export default function Header({userId}) {
    const router = useRouter();
    const [showProfile, setShowProfile] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [user, setUser] = useState(
        {
            id: 0,
            username: "",
            fullname: "",
            followerCount: 0, // şimdilik sabit, ileride DB’den çekilebilir
            chatbotCount: 0,
            }
    );

    const fetchCartCount = async () => {
        const targetId = userId || user.id; 
        if (!targetId) return;

        try {
            const res = await fetch(`/api/getcartcount.php?user_id=${targetId}`);
            const result = await res.json();
            if (result.success) {
                setCartCount(result.count);
                console.log("Cart Item Count: ",cartCount);
            }
        } catch (err) {
            console.error("Sepet sayısı çekilemedi:", err);
        }
    };

    const [showNotification, setShowNotification] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [cartCount, setCartCount] = useState(0);
    const [quitOpen, setQuitOpen] = useState(false);

    // 1. Sadece Kullanıcı Bilgilerini Çek
    useEffect(() => {
        async function fetchUser() {
            const res = await fetch(`/api/getuserheader.php?id=${userId}`);
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

    // 2. Sepet Sayısını ve Eventleri Yönet (user.id değiştikçe tetiklenir)
    useEffect(() => {
        if (!user.id) return;

        // İlk yüklemede çek
        fetchCartCount();

        const handleCartUpdate = () => fetchCartCount();
        window.addEventListener('cartUpdated', handleCartUpdate);
        const interval = setInterval(fetchCartCount, 30000);

        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
            clearInterval(interval);
        };
    }, [user.id]); // user.id dolduğunda bu blok tekrar çalışır

    const handleLogout = () => {
        setQuitOpen(true);
    };

    const handleConfirmLogout = async () => {
        setQuitOpen(false);

        try {
            await fetch("/api/logout.php", {
            method: "POST",
            credentials: "include",
            });
        } catch (err) {
            console.error("Logout error:", err);
        }

        location.href = "/login";
    };


    useEffect(() => {
        if (typeof window === "undefined") return;

        const updateCartCount = () => {
            try {
                const cartString = localStorage.getItem('cart');
                const cart = cartString ? JSON.parse(cartString) : [];
                setCartCount(Array.isArray(cart) ? cart.length : 0);
            } catch {
                setCartCount(0);
            }
        };

        const updateProfileImage = () => {
            const savedImage = localStorage.getItem('userProfileImage');
            setProfileImage(savedImage);
        };

        // Initial load
        updateCartCount();
        updateProfileImage();

        // Listen for updates from other tabs
        const handleStorage = (e) => {
            if (e.key === 'cart') updateCartCount();
            if (e.key === 'userProfileImage') updateProfileImage();
        };
        window.addEventListener('storage', handleStorage);

        // Listen for in-tab updates
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
        if (e.key === 'Enter' && searchQuery.trim() !== '') {
            goToExplore();
        }
    };

    const handleProfileClick = () => {
        router.push('/auth');
    };

    const handleCheckoutClick = () => {
        router.push('/dashboard/checkout');
    };
    return (
        <>
            {showNotification && <NotificationPopup onClose={() => {
                setShowNotification(false);
            }} userId={user.id} />}
            <header className="dashboard-header">
                <div className="left">

                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="KEŞFET"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchKey}
                        />
                        <button
                            onClick={goToExplore}
                            onTouchStart={goToExplore}
                        >
                            <Image src={searchIcon} alt="ara" />
                        </button>
                    </div>
                </div>



                <div className="right-icons">
                    <button className="icon-btn" onClick={() => {
                        setShowNotification(true);
                    }}>
                        <Image src={bellIcon} alt="bildirim" />
                    </button>
                    <button className="icon-btn" onClick={handleCheckoutClick}>
                        <Image src={cartIcon} alt="sepet" />
                        {cartCount > 0 && (
                            <span className="cart-badge">{cartCount}</span>
                        )}
                    </button>
                    <div
                        className="profile-menu-wrapper"
                        onMouseEnter={() => setShowProfile(true)}
                        onMouseLeave={() => setShowProfile(false)}
                        style={{ position: 'relative' }}
                    >
                        <button className="icon-btn">
                        <Image 
                                    src={userIcon} 
                                    alt="profil" 
                                    width={24} 
                                    height={24} 
                                    style={{ 
                                        borderRadius: '50%',
                                        objectFit: 'cover'
                                    }} 
                                />
                        </button>
                        {showProfile && (
                            <div style={{ position: "absolute", top: 50, right: 0, zIndex: 100000 }}>
                                <ProfilePopup user={user} onLogout={handleLogout} />
                            </div>
                        )}
                    </div>
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
