import React, { useEffect } from 'react';
import { X, Sparkles, AlertCircle, Utensils } from 'lucide-react';
import { MenuItem, Restaurant, LanguageCode } from '../../types';
import { getLocalizedText, translations } from '../../lib/i18n';
import { themeConfigs } from './ThemeWrapper';

interface ProductDetailModalProps {
  item: MenuItem | null;
  restaurant: Restaurant;
  lang: LanguageCode;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  item,
  restaurant,
  lang,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (item) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [item, onClose]);

  if (!item) return null;

  const themeConfig = themeConfigs[restaurant.theme || 'modern'];
  const t = translations[lang] || translations.fr;
  const isRtl = lang === 'ar';

  const name = getLocalizedText(lang, item.name_fr, item.name_ar, item.name_en);
  const description = getLocalizedText(lang, item.description_fr, item.description_ar, item.description_en);

  return (
    <div 
      id="product-detail-modal-overlay" 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="product-detail-modal-card"
        className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl transition-transform duration-300 ease-out animate-in slide-in-from-bottom-8 sm:zoom-in-95 ${
          restaurant.theme === 'luxury'
            ? 'bg-[#151518] text-[#f5f1ea] border border-[#2d271e]'
            : restaurant.theme === 'moroccan'
            ? 'bg-white text-[#2c1810] border border-[#ebdcd0]'
            : restaurant.theme === 'minimal'
            ? 'bg-white text-neutral-900 border border-neutral-200'
            : 'bg-zinc-900 text-zinc-100 border border-zinc-800'
        }`}
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          id="close-product-modal-button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition-colors shadow-lg"
          aria-label={t.close}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image */}
        {item.image_url ? (
          <div className="relative w-full h-64 sm:h-72 bg-neutral-800 overflow-hidden">
            <img
              src={item.image_url}
              alt={name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                // Fallback image if broken
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            
            {/* Badges on image */}
            <div className="absolute bottom-3 left-4 flex flex-wrap gap-2">
              {item.badge && (
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shadow-md ${themeConfig.badgeStyle(item.badge)}`}>
                  {item.badge}
                </span>
              )}
              {!item.is_available && (
                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-600 text-white shadow-md">
                  {t.unavailable}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-36 bg-gradient-to-b from-neutral-800 to-neutral-900 flex items-center justify-center">
            <Utensils className="w-12 h-12 text-neutral-600" />
          </div>
        )}

        {/* Product Info Content */}
        <div className="p-6 sm:p-8 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className={`text-2xl font-bold ${themeConfig.titleFont}`}>
                {name}
              </h2>
            </div>
            <div className="text-right whitespace-nowrap">
              <span className={`text-2xl font-extrabold ${themeConfig.priceTag}`}>
                {item.price} {restaurant.currency}
              </span>
            </div>
          </div>

          {/* Description */}
          {description && (
            <p className="text-base leading-relaxed opacity-85">
              {description}
            </p>
          )}

          {/* Ingredients */}
          {item.ingredients && (
            <div className="pt-3 border-t border-current/10 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-60">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.ingredients}</span>
              </div>
              <p className="text-sm opacity-80 leading-normal">
                {item.ingredients}
              </p>
            </div>
          )}

          {/* Allergens */}
          {item.allergens && (
            <div className="pt-3 border-t border-current/10 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{t.allergens}</span>
              </div>
              <p className="text-sm opacity-80 leading-normal">
                {item.allergens}
              </p>
            </div>
          )}

          {/* Clean Dismiss Button */}
          <div className="pt-4">
            <button
              id="dismiss-product-modal-button"
              onClick={onClose}
              className={`w-full py-3.5 px-6 rounded-2xl font-medium text-center transition-all ${
                restaurant.theme === 'luxury'
                  ? 'bg-[#d4af37] text-black font-semibold hover:bg-[#c49f2b]'
                  : restaurant.theme === 'moroccan'
                  ? 'bg-[#b45309] text-white hover:bg-[#92400e]'
                  : restaurant.theme === 'minimal'
                  ? 'bg-black text-white hover:bg-neutral-800'
                  : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
            >
              {t.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
