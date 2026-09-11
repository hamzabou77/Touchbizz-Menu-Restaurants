import React from 'react';
import { ThemeId } from '../../types';

interface ThemeConfig {
  bodyClass: string;
  headerBg: string;
  headerText: string;
  categoryActive: string;
  categoryInactive: string;
  categoryContainer: string;
  cardBg: string;
  cardBorder: string;
  titleFont: string;
  priceTag: string;
  badgeStyle: (badge: string) => string;
  accentColor: string;
}

export const themeConfigs: Record<ThemeId, ThemeConfig> = {
  modern: {
    bodyClass: 'bg-zinc-950 text-zinc-100 font-sans',
    headerBg: 'bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800/80',
    headerText: 'text-zinc-100',
    categoryActive: 'bg-white text-zinc-950 font-semibold shadow-lg shadow-white/10 scale-105',
    categoryInactive: 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80',
    categoryContainer: 'bg-zinc-950/90 backdrop-blur-md border-b border-zinc-900',
    cardBg: 'bg-zinc-900/80 border border-zinc-800/70 hover:border-zinc-700 transition-all',
    cardBorder: 'border-zinc-800',
    titleFont: 'font-["Outfit",sans-serif] tracking-tight',
    priceTag: 'text-white font-bold text-lg',
    badgeStyle: (b: string) => {
      if (b === 'Chef') return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
      if (b === 'Épicé') return 'bg-rose-500/20 text-rose-300 border border-rose-500/40';
      if (b === 'Nouveau') return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
      return 'bg-blue-500/20 text-blue-300 border border-blue-500/40'; // Populaire
    },
    accentColor: '#3b82f6',
  },
  luxury: {
    bodyClass: 'bg-[#0c0c0d] text-[#e8e4dc] font-serif',
    headerBg: 'bg-[#121214]/95 backdrop-blur-md border-b border-[#2d2922]',
    headerText: 'text-[#f5f1ea]',
    categoryActive: 'bg-gradient-to-r from-[#d4af37] to-[#aa8010] text-[#0c0c0d] font-bold shadow-md shadow-[#d4af37]/20 tracking-wider uppercase text-xs',
    categoryInactive: 'bg-[#18181c] text-[#a39e93] hover:text-[#d4af37] border border-[#2b271f]',
    categoryContainer: 'bg-[#0c0c0d]/95 backdrop-blur-md border-b border-[#26221b]',
    cardBg: 'bg-[#151518] border border-[#2d271e] hover:border-[#d4af37]/50 transition-all',
    cardBorder: 'border-[#2d271e]',
    titleFont: 'font-["Playfair_Display",serif] tracking-wide',
    priceTag: 'text-[#d4af37] font-semibold text-lg tracking-wide',
    badgeStyle: (b: string) => {
      if (b === 'Chef') return 'bg-[#d4af37]/20 text-[#ecd585] border border-[#d4af37]/40';
      if (b === 'Épicé') return 'bg-rose-950/60 text-rose-300 border border-rose-800/40';
      if (b === 'Nouveau') return 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30';
      return 'bg-[#2b2414] text-[#d4af37] border border-[#d4af37]/40';
    },
    accentColor: '#d4af37',
  },
  moroccan: {
    bodyClass: 'bg-[#faf6f0] text-[#2c1810] font-sans',
    headerBg: 'bg-[#f5ede3]/95 backdrop-blur-md border-b border-[#e2d5c3]',
    headerText: 'text-[#361a0f]',
    categoryActive: 'bg-[#b45309] text-white font-semibold shadow-md shadow-[#b45309]/20',
    categoryInactive: 'bg-[#ebdcd0]/70 text-[#694b3c] hover:text-[#2c1810] border border-[#dcc6b2]',
    categoryContainer: 'bg-[#faf6f0]/95 backdrop-blur-md border-b border-[#ebdcd0]',
    cardBg: 'bg-white border border-[#ebdcd0] shadow-sm hover:shadow-md transition-all',
    cardBorder: 'border-[#ebdcd0]',
    titleFont: 'font-["Outfit",sans-serif] font-medium tracking-tight',
    priceTag: 'text-[#b45309] font-bold text-lg',
    badgeStyle: (b: string) => {
      if (b === 'Chef') return 'bg-amber-100 text-amber-900 border border-amber-300';
      if (b === 'Épicé') return 'bg-red-100 text-red-900 border border-red-300';
      if (b === 'Nouveau') return 'bg-emerald-100 text-emerald-900 border border-emerald-300';
      return 'bg-orange-100 text-orange-900 border border-orange-300';
    },
    accentColor: '#b45309',
  },
  minimal: {
    bodyClass: 'bg-white text-neutral-900 font-sans',
    headerBg: 'bg-white/95 backdrop-blur-md border-b border-neutral-200',
    headerText: 'text-neutral-950',
    categoryActive: 'bg-black text-white font-medium shadow-none',
    categoryInactive: 'bg-neutral-100 text-neutral-600 hover:text-black border border-transparent',
    categoryContainer: 'bg-white/95 backdrop-blur-md border-b border-neutral-200',
    cardBg: 'bg-white border border-neutral-200/80 hover:border-neutral-400 transition-all',
    cardBorder: 'border-neutral-200',
    titleFont: 'font-sans font-semibold tracking-tight',
    priceTag: 'text-neutral-950 font-bold text-lg',
    badgeStyle: (_b: string) => 'bg-neutral-100 text-neutral-800 border border-neutral-300',
    accentColor: '#000000',
  },
};
