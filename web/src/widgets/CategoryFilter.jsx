'use client';
import { useState, useRef, useEffect } from 'react';
import { Splide, SplideSlide, SplideTrack } from '@splidejs/react-splide';
import '@splidejs/splide/dist/css/splide.min.css';
import { cn } from '@/lib/utils';

export default function CategoryFilter({ categories, onSelect, selected: externalSelected }) {
    const [selected, setSelected] = useState(externalSelected || 'Tümü');
    const [canGoPrev, setCanGoPrev] = useState(false);
    const [canGoNext, setCanGoNext] = useState(true);
    const splideRef = useRef(null);

    useEffect(() => {
        if (externalSelected) setSelected(externalSelected);
    }, [externalSelected]);

    const handleClick = (cat) => {
        const catName = cat.kategori_adi_tr;
        setSelected(catName);
        if (onSelect) onSelect(catName);
    };

    const handlePrev = () => splideRef.current?.go('<');
    const handleNext = () => splideRef.current?.go('>');

    const handleSplideMove = (splide) => {
        setCanGoPrev(splide.index > 0);
        setCanGoNext(splide.index < splide.length - splide.options.perPage);
    };

    const ArrowBtn = ({ direction, disabled, onClick }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={direction === 'left' ? 'Önceki kategoriler' : 'Sonraki kategoriler'}
            className={cn(
                'flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                disabled
                    ? 'border-white/8 text-white/18 cursor-not-allowed'
                    : 'border-indigo-400/20 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-400/40',
            )}
        >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                {direction === 'left' ? (
                    <>
                        <path opacity="0.5" d="M13.3334 8.5H2.66675V7.5H13.3334V8.5Z" fill="currentColor" />
                        <path d="M6.66675 4L2.66675 8L6.66675 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                ) : (
                    <>
                        <path opacity="0.5" d="M2.66658 7.5H13.3333V8.5H2.66658V7.5Z" fill="currentColor" />
                        <path d="M9.33325 12L13.3333 8L9.33325 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                )}
            </svg>
        </button>
    );

    return (
        <div className="flex items-center gap-3 px-6 py-3 overflow-hidden">
            <ArrowBtn direction="left" disabled={!canGoPrev} onClick={handlePrev} />

            <div className="relative flex-1 min-w-0">
                <div
                    aria-hidden="true"
                    className={cn(
                        'pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-r from-luma-base to-transparent transition-opacity duration-150',
                        canGoPrev ? 'opacity-100' : 'opacity-0',
                    )}
                />
                <div
                    aria-hidden="true"
                    className={cn(
                        'pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-l from-luma-base to-transparent transition-opacity duration-150',
                        canGoNext ? 'opacity-100' : 'opacity-0',
                    )}
                />
                <Splide
                    key={categories.length}
                    options={{
                        type: 'slide',
                        gap: '8px',
                        perPage: 5,
                        perMove: 1,
                        pagination: false,
                        arrows: false,
                        drag: 'free',
                        flickPower: 400,
                        bound: true,
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
                        {categories.map((cat, index) => {
                            const isActive = selected === cat.kategori_adi_tr;
                            return (
                                <SplideSlide key={`${cat.kategori_adi_tr}-${index}`}>
                                    <button
                                        onClick={() => handleClick(cat)}
                                        className={cn(
                                            'w-full px-4 py-2 rounded-xl text-[14px] font-sans font-medium whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                            isActive
                                                ? 'bg-[rgba(99,102,241,0.22)] text-indigo-300 border border-indigo-400/40 shadow-[0_2px_12px_rgba(99,102,241,0.20)]'
                                                : 'bg-transparent text-white/55 border border-white/8 hover:bg-indigo-500/8 hover:text-white/80 hover:border-indigo-400/18',
                                        )}
                                    >
                                        {cat.kategori_adi_tr}
                                    </button>
                                </SplideSlide>
                            );
                        })}
                    </SplideTrack>
                </Splide>
            </div>

            <ArrowBtn direction="right" disabled={!canGoNext} onClick={handleNext} />
        </div>
    );
}
