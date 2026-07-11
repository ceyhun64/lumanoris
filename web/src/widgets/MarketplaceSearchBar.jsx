'use client';
import { Search, ListFilter, Check } from 'lucide-react';
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuLabel,
} from '@/shared/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export const SORT_OPTIONS = [
    { value: 'onerilen',        label: 'Önerilen' },
    { value: 'fiyat_artan',     label: 'En düşük fiyat' },
    { value: 'fiyat_azalan',    label: 'En yüksek fiyat' },
    { value: 'favoriler',       label: 'En favoriler' },
    { value: 'liste',           label: 'En çok listeye eklenen' },
    { value: 'yeni',            label: 'En yeniler' },
    { value: 'diyalog',         label: 'En çok diyalog' },
    { value: 'degerlendirme',   label: 'En çok değerlendirilen' },
];

export default function MarketplaceSearchBar({ query, onQueryChange, sort, onSortChange, onSubmit }) {
    const activeLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Önerilen';

    return (
        <form
            onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }}
            className="flex items-center gap-3 px-6 pt-5"
        >
            <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    placeholder="Sohbet botu, uygulama veya kişi ara"
                    className="w-full rounded-xl border border-fuchsia-400/14 bg-luma-input py-3 pl-11 pr-4 text-[14px] text-white placeholder:text-white/35 outline-none transition-all duration-200 focus:border-fuchsia-500/45 focus:ring-2 focus:ring-fuchsia-500/15"
                />
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="flex shrink-0 items-center gap-2 rounded-xl border border-fuchsia-400/25 bg-fuchsia-500/10 px-4 py-3 text-[13px] font-medium text-fuchsia-200 transition-colors hover:bg-fuchsia-500/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <ListFilter className="h-4 w-4" />
                        {activeLabel}
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[220px]">
                    <DropdownMenuLabel>Sırala</DropdownMenuLabel>
                    {SORT_OPTIONS.map((opt) => (
                        <DropdownMenuItem
                            key={opt.value}
                            onClick={() => onSortChange(opt.value)}
                            className={cn('justify-between', sort === opt.value && 'text-fuchsia-300')}
                        >
                            {opt.label}
                            {sort === opt.value && <Check className="h-3.5 w-3.5" />}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <button
                type="submit"
                aria-label="Ara"
                className="flex shrink-0 items-center justify-center rounded-xl border border-fuchsia-400/25 bg-fuchsia-500/10 p-3.5 text-fuchsia-200 transition-colors hover:bg-fuchsia-500/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <Search className="h-4 w-4" />
            </button>
        </form>
    );
}
