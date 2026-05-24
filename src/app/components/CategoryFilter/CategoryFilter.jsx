'use client';
import { useState, useRef, useEffect } from 'react';
import { Splide, SplideSlide, SplideTrack } from '@splidejs/react-splide';
import '@splidejs/splide/dist/css/splide.min.css';
import './CategoryFilter.css';

export default function CategoryFilter({ categories, onSelect, selected: externalSelected }) {
    const [selected, setSelected] = useState(externalSelected || 'Tümü');
    const [canGoPrev, setCanGoPrev] = useState(false);
    const [canGoNext, setCanGoNext] = useState(true);

    const splideRef = useRef(null);

    // Dışarıdan seçili kategori değişirse yerel state'i güncelle
    useEffect(() => {
        if (externalSelected) setSelected(externalSelected);
    }, [externalSelected]);

    const handleClick = (cat) => {
        const catName = cat.kategori_adi_tr; 
        setSelected(catName);
        if (onSelect) onSelect(catName); 
    };

    /*const handleClick = (cat) => {
        setSelected(cat);
        if (onSelect) onSelect(cat);
    };*/

    const handlePrev = () => splideRef.current?.go('<');
    const handleNext = () => splideRef.current?.go('>');

    // Slider hareket ettiğinde veya yüklendiğinde butonların durumunu güncelle
    const handleSplideMove = (splide) => {
        setCanGoPrev(splide.index > 0);
        setCanGoNext(splide.index < splide.length - splide.options.perPage);
    };

    // Ok Bileşenleri
    const LeftArrow = () => (
        <button className="custom-arrow left" onClick={handlePrev} disabled={!canGoPrev}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path opacity="0.5" d="M13.3334 8.5C13.466 8.5 13.5932 8.44732 13.687 8.35355C13.7807 8.25978 13.8334 8.13261 13.8334 8C13.8334 7.86739 13.7807 7.74022 13.687 7.64645C13.5932 7.55268 13.466 7.5 13.3334 7.5V8.5ZM13.3334 7.5H2.66675V8.5H13.3334V7.5Z"
                    fill={canGoPrev ? "#FF66C4" : "#C0C0C0"} />
                <path d="M6.66675 4L2.66675 8L6.66675 12"
                    stroke={canGoPrev ? "#FF66C4" : "#C0C0C0"}
                    strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </button>
    );

    const RightArrow = () => (
        <button className="custom-arrow right" onClick={handleNext} disabled={!canGoNext}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path opacity="0.5" d="M2.66658 7.5C2.53398 7.5 2.4068 7.55268 2.31303 7.64645C2.21926 7.74022 2.16658 7.86739 2.16658 8C2.16658 8.13261 2.21926 8.25978 2.31303 8.35355C2.4068 8.44732 2.53398 8.5 2.66658 8.5V7.5ZM2.66658 8.5L13.3333 8.5V7.5L2.66658 7.5V8.5Z"
                    fill={canGoNext ? "#FF66C4" : "#C0C0C0"} />
                <path d="M9.33325 12L13.3333 8L9.33325 4"
                    stroke={canGoNext ? "#FF66C4" : "#C0C0C0"}
                    strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </button>
    );

    return (
        <div className="category-filter">
            <div className='arw-ct'>
                <LeftArrow />
            </div>
            <Splide
                // KRİTİK: categories uzunluğu değiştiğinde slider'ı baştan yaratır.
                // Bu sayede yeni gelen verilerle genişlik hesaplamaları doğru yapılır.
                key={categories.length} 
                options={{
                    type: 'slide',
                    gap: '10px',
                    perPage: 5,
                    perMove: 1,
                    pagination: false,
                    arrows: false,
                    drag: 'free', // Serbest kaydırma hissi verir
                    flickPower: 400, // Kaydırma hassasiyeti
                    bound: true, // Başta ve sonda takılı kalmasını sağlar
                    breakpoints: {
                        1200: { perPage: 4 },
                        768: { perPage: 3 },
                        480: { perPage: 2 },
                    },
                }}
                hasTrack={false}
                ref={splideRef}
                onMoved={handleSplideMove}
                onMounted={handleSplideMove}
            >
                <SplideTrack>
                    {categories.map((cat, index) => (
                        <SplideSlide key={`${cat.kategori_adi_tr}-${index}`}>
                            <button
                                onClick={() => handleClick(cat)}
                                className={`cat-btn ${selected === cat.kategori_adi_tr ? 'active' : ''}`}
                            >
                                {cat.kategori_adi_tr}
                            </button>
                        </SplideSlide>
                    ))}
                </SplideTrack>
            </Splide>
            <div className='arw-ct'>
                <RightArrow />
            </div>
        </div>
    );
}