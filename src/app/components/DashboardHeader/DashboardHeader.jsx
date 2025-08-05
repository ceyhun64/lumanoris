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
export default function Header() {
    const router = useRouter();
    const [showProfile, setShowProfile] = useState(false);

    const [showNotification, setShowNotification] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [cartCount, setCartCount] = useState(0);


    const user = {
        username: "Kullanicadi123",
        fullname: "Ahmet Yılmaz",
        followerCount: 1500,
        followingCount: 40,
    };

    const handleLogout = () => {
        // Logout işlemi
    };
    useEffect(() => {
        if (typeof window !== "undefined") {
            const cartString = localStorage.getItem('cart');
            if (cartString) {
                try {
                    const cart = JSON.parse(cartString);
                    setCartCount(cart.length);
                } catch (e) {
                    setCartCount(0);
                }
            } else {
                setCartCount(0);
            }
        }
    }, []);

    const handleSearchKey = (e) => {
        if (e.key === 'Enter' && searchQuery.trim() !== '') {
            router.push(`/dashboard/explore?search=${encodeURIComponent(searchQuery.trim())}`);
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
            }} />}
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
                            onClick={() => {
                                router.push(`/dashboard/explore?search=${encodeURIComponent(searchQuery.trim())}`);
                            }}
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
                            <Image src={userIcon} alt="profil" />
                        </button>
                        {showProfile && (
                            <div style={{ position: "absolute", top: 50, right: 0, zIndex: 20 }}>
                                <ProfilePopup user={user} onLogout={handleLogout} />
                            </div>
                        )}
                    </div>
                </div>
            </header>
        </>
    );
}
