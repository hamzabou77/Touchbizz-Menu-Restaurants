import { LanguageCode } from '../types';

export const translations: Record<LanguageCode, Record<string, string>> = {
  fr: {
    searchPlaceholder: 'Rechercher un plat, une boisson...',
    noResults: 'Aucun plat ne correspond à votre recherche.',
    clearSearch: 'Effacer la recherche',
    all: 'Tous',
    ingredients: 'Ingrédients',
    allergens: 'Allergènes',
    unavailable: 'Non disponible aujourd’hui',
    price: 'Prix',
    close: 'Fermer',
    poweredBy: 'Propulsé par TouchBizz',
    menuUnavailable: 'Ce menu est temporairement indisponible.',
    restaurantNotFound: 'Établissement introuvable ou lien expiré.',
    backToMenu: 'Retour au menu',
    emptyCategory: 'Aucun plat dans cette catégorie pour le moment.',
    viewDetails: 'Voir les détails',
    selectLanguage: 'Langue',
  },
  ar: {
    searchPlaceholder: 'ابحث عن طبق، مشروب أو حلوى...',
    noResults: 'لم يتم العثور على أي نتائج مطابقة.',
    clearSearch: 'مسح البحث',
    all: 'الكل',
    ingredients: 'المكونات',
    allergens: 'مسببات الحساسية',
    unavailable: 'غير متوفر حالياً',
    price: 'السعر',
    close: 'إغلاق',
    poweredBy: 'مشغّل بواسطة TouchBizz',
    menuUnavailable: 'هذه القائمة غير متوفرة حالياً.',
    restaurantNotFound: 'المطعم غير موجود أو تم تغيير الرابط.',
    backToMenu: 'العودة إلى القائمة',
    emptyCategory: 'لا توجد أطباق في هذا القسم حالياً.',
    viewDetails: 'عرض التفاصيل',
    selectLanguage: 'اللغة',
  },
  en: {
    searchPlaceholder: 'Search for a dish, beverage...',
    noResults: 'No dishes match your search.',
    clearSearch: 'Clear search',
    all: 'All',
    ingredients: 'Ingredients',
    allergens: 'Allergens',
    unavailable: 'Unavailable today',
    price: 'Price',
    close: 'Close',
    poweredBy: 'Powered by TouchBizz',
    menuUnavailable: 'This menu is temporarily unavailable.',
    restaurantNotFound: 'Restaurant not found or link has changed.',
    backToMenu: 'Back to menu',
    emptyCategory: 'No items in this category yet.',
    viewDetails: 'View details',
    selectLanguage: 'Language',
  },
};

export function getLocalizedText(
  lang: LanguageCode,
  frText?: string,
  arText?: string,
  enText?: string
): string {
  if (lang === 'ar' && arText?.trim()) return arText;
  if (lang === 'en' && enText?.trim()) return enText;
  if (lang === 'fr' && frText?.trim()) return frText;
  // Fallbacks if current requested lang is missing
  return frText || enText || arText || '';
}
