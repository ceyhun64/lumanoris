'use client';
import { ListFilter, Check, Search, X } from 'lucide-react';
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

// The global header search already covers "find a bot" — this bar only
// surfaces the sort control plus a clearable chip for a search term that
// arrived via the header (?search=). No second text input, so the two
// search affordances never appear stacked on screen at once.
export default function MarketplaceSearchBar({ query, onQueryChange, sort, onSortChange }) {
    const activeLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Önerilen';

    return (
        <div className="flex items-center gap-3">
            {query?.trim() ? (
                <div className="flex flex-1 items-center gap-2 rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/[0.06] py-2.5 pl-4 pr-2.5 text-[14px] text-white/85">
                    <Search className="h-3.5 w-3.5 shrink-0 text-fuchsia-300" />
                    <span className="min-w-0 flex-1 truncate">"{query}" için sonuçlar</span>
                    <button
                        type="button"
                        onClick={() => onQueryChange('')}
                        aria-label="Aramayı temizle"
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/45 transition-colors hover:bg-white/[0.08] hover:text-white/85"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            ) : (
                <div className="flex-1" />
            )}

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="flex shrink-0 items-center gap-2 rounded-xl border border-fuchsia-400/25 bg-fuchsia-500/10 px-4 py-2.5 text-[13px] font-medium text-fuchsia-200 transition-colors hover:bg-fuchsia-500/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        </div>
    );
}
