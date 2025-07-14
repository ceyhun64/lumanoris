'use client';
import { useState, useRef, useEffect } from 'react';
import { Splide, SplideSlide, SplideTrack } from '@splidejs/react-splide';
import '@splidejs/splide/dist/css/splide.min.css';

const categories = ['Tümü', 'Resmi', 'Eğitim', 'Çeviri', 'Öne Çıkanlar', 'Teknoloji', 'Sağlık', 'Yazılım', 'Sanat'];

export default function CategoryFilter({ onSelect, selected: externalSelected }) {
    const [selected, setSelected] = useState(externalSelected || 'Tümü');

    const splideRef = useRef(null);

    const handleClick = (cat) => {
        setSelected(cat);
        if (onSelect) onSelect(cat);
    };

    const handlePrev = () => {
        splideRef.current?.go('<');
    };

    const handleNext = () => {
        splideRef.current?.go('>');
    };

    const LeftArrow = () => (
        <button className="custom-arrow left" onClick={handlePrev}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path opacity="0.5" d="M13.3334 8.5C13.466 8.5 13.5932 8.44732 13.687 8.35355C13.7807 8.25978 13.8334 8.13261 13.8334 8C13.8334 7.86739 13.7807 7.74022 13.687 7.64645C13.5932 7.55268 13.466 7.5 13.3334 7.5V8.5ZM13.3334 7.5H2.66675V8.5H13.3334V7.5Z" fill="white" />
                <path d="M6.66675 4L2.66675 8L6.66675 12" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </button>
    );

    const RightArrow = () => (
        <button className="custom-arrow right" onClick={handleNext}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path opacity="0.5" d="M2.66658 7.5C2.53398 7.5 2.4068 7.55268 2.31303 7.64645C2.21926 7.74022 2.16658 7.86739 2.16658 8C2.16658 8.13261 2.21926 8.25978 2.31303 8.35355C2.4068 8.44732 2.53398 8.5 2.66658 8.5V7.5ZM2.66658 8.5L13.3333 8.5V7.5L2.66658 7.5V8.5Z" fill="#FF66C4" />
                <path d="M9.33325 12L13.3333 8L9.33325 4" stroke="#FF66C4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </button>
    );


    useEffect(() => {
        if (externalSelected) setSelected(externalSelected);
    }, [externalSelected]);

    return (
        <div className="category-filter">
            <div className='arw-ct'>
                <LeftArrow />
            </div>
            <Splide
                options={{
                    type: 'slide',
                    gap: '7px',
                    perPage: 5,
                    perMove: 1,
                    pagination: false,
                    arrows: false,
                    drag: 'free',
                    breakpoints: {
                        768: { perPage: 3 },
                        1200: { perPage: 4 },
                    },
                }}
                hasTrack={false}
                ref={splideRef}
            >
                <SplideTrack>
                    {categories.map((cat) => (
                        <SplideSlide key={cat}>
                            <button
                                onClick={() => handleClick(cat)}
                                className={`cat-btn ${selected === cat ? 'active' : ''}`}
                            >
                                {cat}
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
