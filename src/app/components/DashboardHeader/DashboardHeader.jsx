"use client";
import './Header.css';
import Image from 'next/image';

import searchIcon from '../../../images/search-icon.svg';
import bellIcon from '../../../images/bell-icon.svg';
import cartIcon from '../../../images/cart-icon.svg';
import userIcon from '../../../images/user-icon.svg';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import NotificationPopup from '../NotificationPopup';

export default function Header() {
    const router = useRouter();
    const [showNotification, setShowNotification] = useState();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchKey = (e) => {
        if (e.key === 'Enter' && searchQuery.trim() !== '') {
            router.push(`/dashboard/explore?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleProfileClick = () => {
        router.push('/register');
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
                                if (searchQuery.trim() !== '') {
                                    router.push(`/dashboard/explore?search=${encodeURIComponent(searchQuery.trim())}`);
                                }
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
                    </button>
                    <button className="icon-btn" onClick={handleProfileClick}>
                        <Image src={userIcon} alt="profil" />
                    </button>
                </div>
            </header>
        </>
    );
}
