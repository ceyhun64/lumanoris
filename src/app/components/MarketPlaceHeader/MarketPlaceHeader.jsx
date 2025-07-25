'use client';
import Image from 'next/image';
import logo from '../../../images/ubeyaz.png';
import { useRef, useState } from 'react';

export default function MarketplaceHeader() {
    const fileInputRef = useRef(null);
    const [selectedFileName, setSelectedFileName] = useState('');

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFileName(file.name);
        }
    };

    return (
        <div className="marketplace-header">
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />

            
            <div className="logo">
                <Image src={logo} alt="Logo" />
                <svg width="153" height="153" viewBox="0 0 153 153" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g filter="url(#filter0_f_7776_8385)">
                        <circle cx="76.2031" cy="76.7031" r="26.1386" fill="url(#paint0_linear_7776_8385)" />
                    </g>
                    <defs>
                        <filter id="filter0_f_7776_8385" x="0.28228" y="0.78228" width="151.842" height="151.842" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                            <feGaussianBlur stdDeviation="24.8911" result="effect1_foregroundBlur_7776_8385" />
                        </filter>
                        <linearGradient id="paint0_linear_7776_8385" x1="60.7575" y1="86.8021" x2="87.1932" y2="66.9011" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#FF66C4" />
                            <stop offset="1" stopColor="#4699FF" />
                        </linearGradient>
                    </defs>
                </svg>

            </div>
            
            <div className='search-box'>
                {selectedFileName && (
                <div className="file-preview">
                    <span>📎 {selectedFileName}</span>
                    <button onClick={() => setSelectedFileName('')}>×</button>
                </div>
            )}
                <button className='icon-plus' onClick={() => fileInputRef.current.click()}>
                    <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.5 5.20117V19.7842M5.2085 12.4927H19.7915" stroke="#FF66C4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <input type="text" placeholder="Yeni sohbete başla..." />
                <button className='send'>
                    <svg width="34" height="35" viewBox="0 0 34 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#clip0_7772_2648)">
                            <path d="M14.6049 17.4928L10.9684 7.79529L32.7877 17.4928L10.9684 27.1902L14.6049 17.4928Z" fill="#FF66C4" fillOpacity="0.2" />
                            <path d="M14.6049 17.4928L10.9684 7.79529L32.7877 17.4928L10.9684 27.1902L14.6049 17.4928ZM14.6049 17.4928H21.878" stroke="#FF99D6" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                        <defs>
                            <clipPath id="clip0_7772_2648">
                                <rect width="24" height="24" fill="white" transform="translate(17.0293 0.521484) rotate(45)" />
                            </clipPath>
                        </defs>
                    </svg>
                </button>
            </div>
        </div>
    );
}
