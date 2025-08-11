"use client";
import './Sidebar.css';
import headerLogo from '../../../images/header-logo-icon.png';
import homeIcon from '../../../images/anasayfa-icon.svg';
import chatIcon from '../../../images/chatbotlarim-icon.svg';
import storeIcon from '../../../images/satilik-icon.svg';
import followIcon from '../../../images/takip-edilenler-icon.svg';
import listIcon from '../../../images/liste-icon.svg';
import historyIcon from '../../../images/gecmisim-icon.svg';
import walletIcon from '../../../images/bakiyom-icon.svg';
import noteIcon from '../../../images/diyalog-defteri-icon.svg';
import settingsIcon from '../../../images/ayarlar-icon.svg';
import logoutIcon from '../../../images/logout-icon.svg';
import Link from 'next/link';
import logoIcon from '../../../images/header-dashboard-left.png';
import QuitModal from '../QuitModal/QuitModal';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Sidebar({ isMobileOpen = false }) {
  const pathname = usePathname();

  const handleCreateClick = () => {
    router.push('/dashboard/chatbots/create');
  };

  const router = useRouter();
  const [logoClicked, setLogoClicked] = useState(false); // <- class kontrolü
  const [isQuitModalOpen, setIsQuitModalOpen] = useState(false);

  const isActive = (route) => pathname.startsWith(route);

  const handleLogoClick = () => {
    setLogoClicked((prev) => !prev); // toggle et
    // Global event dispatch
    window.dispatchEvent(new CustomEvent('logoClicked', { 
      detail: { clicked: !logoClicked } 
    }));
  };

  return (
    <div className={`page-sidebar ${isMobileOpen ? 'mobile-visible' : 'mobile-hidden'} ${logoClicked ? 'logo-clicked' : ''}`}>

      <div className={`logo-circle ${logoClicked ? 'rotated' : ''}`} onClick={handleLogoClick}>
        <Image src={logoIcon} alt="logo" />
      </div>
      <div>


        <Link href="/dashboard" className="logo">
          <div className="icon">
            <img src={headerLogo.src} alt="" />
          </div>
          <span>
            LUMANORIS
          </span>
        </Link>

        <button className="create-button" onClick={handleCreateClick}>
          <p>OLUŞTUR</p>
          <span>
            <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_7772_2494)">
                <path d="M7 1.16211V14.1621M0.5 7.62211H13.5" stroke="#FF66C4" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              <defs>
                <clipPath id="clip0_7772_2494">
                  <rect width="14" height="14" fill="white" transform="translate(0 0.662109)" />
                </clipPath>
              </defs>
            </svg>
          </span>
        </button>
        <div className="seperator"></div>

        <ul className="menu">
          <li className={pathname === '/dashboard' ? 'active' : ''}>

            <Link href="/dashboard">
              <img src={homeIcon.src} alt="anasayfa" />
              <span>Anasayfa</span>
            </Link>
          </li>

          <li className={isActive('/dashboard/chatbots') ? 'active' : ''}>
            <Link href="/dashboard/chatbots">
              <img src={chatIcon.src} alt="chatbotlarım" />
              <span>Chatbotlarım</span>
            </Link>
          </li>

          <li className={isActive('/dashboard/market') ? 'active' : ''}>
            <Link href="/dashboard/market">
              <img src={storeIcon.src} alt="satılık" />
              <span>Satılık</span>
            </Link>
          </li>

          <li className={isActive('/dashboard/following') ? 'active' : ''}>
            <Link href="/dashboard/following">
              <img src={followIcon.src} alt="takip edilenler" />
              <span>Takip Edilenler</span>
            </Link>
          </li>

          <li className={isActive('/dashboard/list') ? 'active' : ''}>
            <Link href="/dashboard/list">
              <img src={listIcon.src} alt="liste" />
              <span>Liste</span>
            </Link>
          </li>

          <li className={isActive('/dashboard/history') ? 'active' : ''}>
            <Link href="/dashboard/history">
              <img src={historyIcon.src} alt="geçmişim" />
              <span>Geçmişim</span>
            </Link>
          </li>

          <li className={isActive('/dashboard/wallet') ? 'active' : ''}>
            <Link href="/dashboard/wallet">
              <img src={walletIcon.src} alt="bakiyem" />
              <span>Bakiyem</span>
            </Link>
          </li>

          <li className={isActive('/dashboard/notes') ? 'active' : ''}>
            <Link href="/dashboard/notes">
              <img src={noteIcon.src} alt="diyalog defteri" />
              <span>Diyalog Defteri</span>
            </Link>
          </li>
        </ul>
      </div>

      <div className="bottom">
        <div className="settings">
          <div className="top-left-icc">
            <svg xmlns="http://www.w3.org/2000/svg" width="134" height="96" viewBox="0 0 134 96" fill="none">
              <g filter="url(#filter0_f_7772_2636)">
                <circle cx="21" cy="8" r="28" fill="url(#paint0_linear_7772_2636)" />
              </g>
              <defs>
                <filter id="filter0_f_7772_2636" x="-91.784" y="-104.784" width="225.568" height="225.568" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                  <feGaussianBlur stdDeviation="42.392" result="effect1_foregroundBlur_7772_2636" />
                </filter>
                <linearGradient id="paint0_linear_7772_2636" x1="53.7895" y1="49.1291" x2="-6.25079" y2="-29.1474" gradientUnits="userSpaceOnUse">
                  <stop offset="0.211538" stopColor="#FF66C4" />
                  <stop offset="1" stopColor="#4699FF" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <Link
            href="/dashboard/settings"
            className={pathname === '/dashboard/settings' ? 'active' : ''}
          >
            <img src={settingsIcon.src} alt="ayarlar" style={{ marginRight: 8 }} />
            <span>Ayarlar</span>
          </Link>


          {/* <button className="logout-btn" onClick={() => setIsQuitModalOpen(true)}>
            <img src={logoutIcon.src} alt="çıkış" style={{ marginRight: 8 }} />
            <span>Çıkış</span>
          </button> */}
        </div>
        <Link href="/dashboard/upgrade" className="upgrade">
          <span>
            Hesabınızı Yükseltin
          </span>

          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 18h14M5 14h14l1-9l-4 3l-4-5l-4 5l-4-3z" /></svg>
        </Link>
      </div>
      <QuitModal
        isOpen={isQuitModalOpen}
        onClose={() => setIsQuitModalOpen(false)}
        onConfirm={() => {
          router.push('/auth');
        }}
      />
    </div>
  );
}
