import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, MapPin, Phone, Globe, X, Utensils, AlertCircle } from 'lucide-react';
import { PublicMenuData, LanguageCode, MenuItem, Category } from '../../types';
import { api } from '../../lib/api';
import { translations, getLocalizedText } from '../../lib/i18n';
import { themeConfigs } from './ThemeWrapper';
import { ProductDetailModal } from './ProductDetailModal';

interface PublicMenuProps {
  restaurantSlug: string;
}

export const PublicMenu: React.FC<PublicMenuProps> = ({ restaurantSlug }) => {
  const [data, setData] = useState<PublicMenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState<LanguageCode>('fr');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);

  const categoryNavRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Fetch Public Menu
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    api.getPublicMenu(restaurantSlug)
      .then((res) => {
        if (isMounted) {
          setData(res);
          // Set default language from restaurant preferences
          if (res.restaurant.default_language) {
            setCurrentLang(res.restaurant.default_language);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Menu load error:', err);
          setError(err.message || 'Ce menu est temporairement indisponible.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [restaurantSlug]);

  const restaurant = data?.restaurant;
  const theme = restaurant?.theme || 'modern';
  const themeConfig = themeConfigs[theme];
  const t = translations[currentLang] || translations.fr;
  const isRtl = currentLang === 'ar';

  // Available languages configured for this restaurant
  const availableLanguages: LanguageCode[] = useMemo(() => {
    if (!restaurant?.languages) return ['fr', 'ar', 'en'];
    if (Array.isArray(restaurant.languages)) {
      return restaurant.languages.length > 0 ? restaurant.languages : ['fr', 'ar', 'en'];
    }
    if (typeof restaurant.languages === 'string') {
      try {
        const parsed = JSON.parse(restaurant.languages);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return ['fr', 'ar', 'en'];
  }, [restaurant]);

  // Filtered menu items based on search query
  const filteredItems = useMemo(() => {
    if (!data) return [];
    let items = data.items;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter((item) => {
        const name = getLocalizedText(currentLang, item.name_fr, item.name_ar, item.name_en).toLowerCase();
        const desc = getLocalizedText(currentLang, item.description_fr, item.description_ar, item.description_en).toLowerCase();
        const ing = (item.ingredients || '').toLowerCase();
        return name.includes(q) || desc.includes(q) || ing.includes(q);
      });
    }

    return items;
  }, [data, searchQuery, currentLang]);

  // Group items by category
  const categoriesWithItems = useMemo(() => {
    if (!data) return [];
    return data.categories.map((cat) => {
      const items = filteredItems.filter((i) => i.category_id === cat.id);
      return {
        category: cat,
        items,
      };
    }).filter((group) => group.items.length > 0 || !searchQuery.trim());
  }, [data, filteredItems, searchQuery]);

  // Scroll to category handler
  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    if (categoryId === 'all') {
      window.scrollTo({ top: 320, behavior: 'smooth' });
      return;
    }
    const element = sectionRefs.current[categoryId];
    if (element) {
      const yOffset = -90; // offset for sticky header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Intersection observer for sticky nav highlight
  useEffect(() => {
    if (searchQuery.trim() || !data) return;

    const handleScroll = () => {
      const scrollPos = window.scrollY + 120;
      for (const cat of data.categories) {
        const el = sectionRefs.current[cat.id];
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveCategory(cat.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [data, searchQuery]);

  // 1. Loading Skeleton State
  if (loading) {
    return (
      <div id="menu-loading-skeleton" className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-full border-4 border-neutral-700 border-t-amber-500 animate-spin mb-6" />
        <p className="text-sm uppercase tracking-widest text-neutral-400 font-medium">
          Chargement du menu TouchBizz...
        </p>
      </div>
    );
  }

  // 2. Error / Offline State
  if (error || !restaurant) {
    return (
      <div id="menu-error-state" className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-500 mb-6 shadow-xl">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          {translations.fr.menuUnavailable}
        </h1>
        <p className="text-neutral-400 text-sm max-w-sm mb-6">
          {error || translations.fr.restaurantNotFound}
        </p>
        <div className="pt-6 border-t border-neutral-800 text-xs text-neutral-500 tracking-wider">
          TouchBizz Menu
        </div>
      </div>
    );
  }

  return (
    <div
      id="touchbizz-customer-menu-view"
      className={`min-h-screen ${themeConfig.bodyClass} selection:bg-amber-500/20`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* 1. RESTAURANT HERO COVER */}
      <header className="relative w-full h-64 sm:h-80 overflow-hidden bg-neutral-900">
        <img
          id="restaurant-cover-image"
          src={restaurant.cover_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&auto=format&fit=crop&q=80'}
          alt={restaurant.name}
          className="w-full h-full object-cover scale-105 filter brightness-75 transition-transform duration-700 hover:scale-100"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

        {/* Top bar: Language selector and search icon */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20">
          {/* Language Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
            <Globe className="w-3.5 h-3.5 ml-2 mr-1 text-white/70" />
            {(Array.isArray(availableLanguages) ? availableLanguages : (['fr', 'ar', 'en'] as LanguageCode[])).map((lang) => (
              <button
                key={lang}
                id={`lang-select-${lang}`}
                onClick={() => setCurrentLang(lang)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase transition-all ${
                  currentLang === lang
                    ? 'bg-white text-black shadow-sm font-bold'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Search Toggle Button */}
          <button
            id="toggle-search-button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-black/80 transition-transform active:scale-95 shadow-lg"
            aria-label="Rechercher"
          >
            {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>
        </div>

        {/* Restaurant Identity Overlay */}
        <div className="absolute bottom-4 inset-x-4 sm:inset-x-8 flex items-end gap-4 z-10 text-white">
          {restaurant.logo_url && (
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl bg-neutral-900 shrink-0">
              <img
                id="restaurant-logo-image"
                src={restaurant.logo_url}
                alt={`${restaurant.name} logo`}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 id="restaurant-name-heading" className={`text-2xl sm:text-3xl font-extrabold truncate text-white drop-shadow-md ${themeConfig.titleFont}`}>
              {restaurant.name}
            </h1>
            {restaurant.description && (
              <p className="text-xs sm:text-sm text-white/85 line-clamp-2 mt-0.5 leading-snug">
                {restaurant.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-white/70">
              {restaurant.address && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{restaurant.address}</span>
                </span>
              )}
              {restaurant.phone && (
                <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1 hover:underline text-white/90">
                  <Phone className="w-3 h-3 shrink-0" />
                  <span>{restaurant.phone}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. SEARCH BAR (COLLAPSIBLE / EXPANDABLE) */}
      {isSearchOpen && (
        <div className="sticky top-0 z-40 p-3 bg-black/90 backdrop-blur-md border-b border-white/10 animate-in slide-in-from-top-4 duration-200">
          <div className="relative max-w-2xl mx-auto flex items-center">
            <Search className="absolute left-3.5 rtl:right-3.5 rtl:left-auto w-4 h-4 text-neutral-400" />
            <input
              id="menu-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              autoFocus
              className="w-full py-2.5 pl-10 pr-10 rtl:pr-10 rtl:pl-10 text-sm bg-neutral-900 text-white placeholder-neutral-400 rounded-full border border-neutral-700 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 rtl:left-3 rtl:right-auto text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. STICKY HORIZONTAL CATEGORY NAVIGATION */}
      {!searchQuery && (
        <nav
          id="sticky-category-nav"
          ref={categoryNavRef}
          className={`sticky top-0 z-30 py-3 px-4 overflow-x-auto no-scrollbar ${themeConfig.categoryContainer}`}
        >
          <div className="flex items-center gap-2 min-w-max mx-auto max-w-4xl">
            <button
              id="category-tab-all"
              onClick={() => handleCategoryClick('all')}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                activeCategory === 'all'
                  ? themeConfig.categoryActive
                  : themeConfig.categoryInactive
              }`}
            >
              {t.all}
            </button>
            {data?.categories.map((cat) => {
              const catName = getLocalizedText(currentLang, cat.name_fr, cat.name_ar, cat.name_en);
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  id={`category-tab-${cat.id}`}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? themeConfig.categoryActive
                      : themeConfig.categoryInactive
                  }`}
                >
                  {catName}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* 4. PRODUCT LIST BY CATEGORY */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:px-6 space-y-10">
        {/* Empty search results state */}
        {searchQuery && filteredItems.length === 0 && (
          <div id="search-empty-state" className="py-16 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-neutral-800/60 flex items-center justify-center text-neutral-400">
              <Search className="w-7 h-7" />
            </div>
            <p className="text-base font-semibold">{t.noResults}</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-amber-500 hover:underline"
            >
              {t.clearSearch}
            </button>
          </div>
        )}

        {/* Categories & Products */}
        {categoriesWithItems.map(({ category, items }) => {
          const catName = getLocalizedText(currentLang, category.name_fr, category.name_ar, category.name_en);

          return (
            <section
              key={category.id}
              id={`section-${category.id}`}
              ref={(el) => {
                sectionRefs.current[category.id] = el;
              }}
              className="scroll-mt-24 space-y-4"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between border-b border-current/10 pb-2">
                <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${themeConfig.titleFont}`}>
                  {catName}
                </h2>
                <span className="text-xs opacity-50 font-medium">
                  {items.length} {items.length === 1 ? 'plat' : 'plats'}
                </span>
              </div>

              {/* Items Grid */}
              {items.length === 0 ? (
                <p className="text-xs opacity-50 italic py-4">
                  {t.emptyCategory}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((item) => {
                    const itemName = getLocalizedText(currentLang, item.name_fr, item.name_ar, item.name_en);
                    const itemDesc = getLocalizedText(currentLang, item.description_fr, item.description_ar, item.description_en);

                    return (
                      <article
                        key={item.id}
                        id={`product-card-${item.id}`}
                        onClick={() => setSelectedProduct(item)}
                        className={`group relative flex flex-col sm:flex-row overflow-hidden rounded-2xl cursor-pointer select-none transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] ${themeConfig.cardBg} ${
                          !item.is_available ? 'opacity-65 grayscale-[20%]' : ''
                        }`}
                      >
                        {/* Image banner on mobile, thumbnail on desktop */}
                        {item.image_url ? (
                          <div className="relative w-full sm:w-44 h-48 sm:h-auto shrink-0 overflow-hidden bg-neutral-800">
                            <img
                              src={item.image_url}
                              alt={itemName}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80';
                              }}
                            />
                            {/* Badges on image */}
                            <div className="absolute top-2.5 left-2.5 rtl:right-2.5 rtl:left-auto flex flex-wrap gap-1.5 z-10">
                              {item.badge && (
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full shadow-sm ${themeConfig.badgeStyle(item.badge)}`}>
                                  {item.badge}
                                </span>
                              )}
                              {!item.is_available && (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-600 text-white shadow-sm">
                                  {t.unavailable}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="w-full sm:w-36 h-28 sm:h-auto bg-current/5 flex items-center justify-center shrink-0">
                            <Utensils className="w-8 h-8 opacity-20" />
                          </div>
                        )}

                        {/* Content */}
                        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-2">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className={`text-base sm:text-lg font-bold leading-tight group-hover:text-amber-500 transition-colors ${themeConfig.titleFont}`}>
                                {itemName}
                              </h3>
                            </div>
                            {itemDesc && (
                              <p className="text-xs sm:text-sm opacity-70 line-clamp-2 mt-1 leading-relaxed">
                                {itemDesc}
                              </p>
                            )}
                          </div>

                          <div className="pt-2 flex items-center justify-between border-t border-current/10">
                            <span className={themeConfig.priceTag}>
                              {item.price} {restaurant.currency}
                            </span>
                            <span className="text-[11px] font-semibold opacity-60 group-hover:opacity-100 transition-opacity">
                              {t.viewDetails} →
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </main>

      {/* 5. PRODUCT DETAIL MODAL / SHEET */}
      <ProductDetailModal
        item={selectedProduct}
        restaurant={restaurant}
        lang={currentLang}
        onClose={() => setSelectedProduct(null)}
      />

      {/* 6. TOUCHBIZZ BRANDING FOOTER */}
      <footer className="py-12 px-4 text-center border-t border-current/10 mt-12">
        <p className="text-xs opacity-50 tracking-wider font-medium">
          {t.poweredBy}
        </p>
      </footer>
    </div>
  );
};
