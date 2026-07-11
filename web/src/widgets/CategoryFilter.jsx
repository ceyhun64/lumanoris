'use client';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function CategoryFilter({ categories, onSelect, selected: externalSelected }) {
    const [selected, setSelected] = useState(externalSelected || 'Tümü');

    useEffect(() => {
        if (externalSelected) setSelected(externalSelected);
    }, [externalSelected]);

    const handleClick = (cat) => {
        const catName = cat.kategori_adi_tr;
        setSelected(catName);
        if (onSelect) onSelect(catName);
    };

    return (
        <div className="flex flex-wrap gap-2 px-6 py-3">
            {categories.map((cat, index) => {
                const isActive = selected === cat.kategori_adi_tr;
                return (
                    <button
                        key={`${cat.kategori_adi_tr}-${index}`}
                        onClick={() => handleClick(cat)}
                        className={cn(
                            'rounded-xl px-4 py-2 text-[14px] font-sans font-medium whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            isActive
                                ? 'bg-[rgba(217,70,239,0.22)] text-fuchsia-300 border border-fuchsia-400/40 shadow-[0_2px_12px_rgba(217,70,239,0.20)]'
                                : 'bg-transparent text-white/55 border border-transparent hover:bg-fuchsia-500/8 hover:text-white/80 hover:border-fuchsia-400/18',
                        )}
                    >
                        {cat.kategori_adi_tr}
                    </button>
                );
            })}
        </div>
    );
}
