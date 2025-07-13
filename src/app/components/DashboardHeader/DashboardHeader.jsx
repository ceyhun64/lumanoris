"use client";
import './Header.css';
import Image from 'next/image';

import logoIcon from '../../../images/header-dashboard-left.png';
import searchIcon from '../../../images/search-icon.svg';
import bellIcon from '../../../images/bell-icon.svg';
import cartIcon from '../../../images/cart-icon.svg';
import userIcon from '../../../images/user-icon.svg';

export default function Header() {
    return (
        <header className="dashboard-header">
            <div className="left">
                <div className="logo-circle">
                    <Image src={logoIcon} alt="logo" />
                </div>
                <div className="search-bar">
                    <input type="text" placeholder="KEŞFET" />
                    <button>
                        <Image src={searchIcon} alt="ara" />
                    </button>
                </div>
            </div>



            <div className="right-icons">
                <button className="icon-btn">
                    <Image src={bellIcon} alt="bildirim" />
                </button>
                <button className="icon-btn">
                    <Image src={cartIcon} alt="sepet" />
                </button>
                <button className="icon-btn">
                    <Image src={userIcon} alt="profil" />
                </button>
            </div>
        </header>
    );
}
