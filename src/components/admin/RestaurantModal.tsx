import React, { useState } from 'react';
import { X, Upload, Check, AlertCircle, Palette } from 'lucide-react';
import { Restaurant, ThemeId, LanguageCode } from '../../types';
import { api } from '../../lib/api';

interface RestaurantModalProps {
  restaurant?: Restaurant | null;
  onClose: () => void;
  onSave: (saved: Restaurant) => void;
}

export const RestaurantModal: React.FC<RestaurantModalProps> = ({
  restaurant,
  onClose,
  onSave,
}) => {
  const isEdit = !!restaurant;

  const parseLanguages = (val: any): LanguageCode[] => {
    if (Array.isArray(val) && val.length > 0) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return ['fr', 'ar', 'en'];
  };

  const [name, setName] = useState(restaurant?.name || '');
  const [slug, setSlug] = useState(restaurant?.slug || '');
  const [description, setDescription] = useState(restaurant?.description || '');
  const [address, setAddress] = useState(restaurant?.address || '');
  const [phone, setPhone] = useState(restaurant?.phone || '');
  const [currency, setCurrency] = useState(restaurant?.currency || 'MAD');
  const [theme, setTheme] = useState<ThemeId>(restaurant?.theme || 'moroccan');
  const [primaryColor, setPrimaryColor] = useState(restaurant?.primary_color || '#b45309');
  const [languages, setLanguages] = useState<LanguageCode[]>(() => parseLanguages(restaurant?.languages));
  const [defaultLang, setDefaultLang] = useState<LanguageCode>(restaurant?.default_language || 'fr');
  const [logoUrl, setLogoUrl] = useState(restaurant?.logo_url || '');
  const [coverUrl, setCoverUrl] = useState(
    restaurant?.cover_url ||
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&auto=format&fit=crop&q=80'
  );
  const [isPublished, setIsPublished] = useState(restaurant ? restaurant.is_published : true);

  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const themes: { id: ThemeId; label: string; desc: string; previewBg: string }[] = [
    { id: 'modern', label: 'Modern Premium', desc: 'Noir zinc, épuré & contemporain', previewBg: 'bg-zinc-900 border-zinc-700 text-white' },
    { id: 'luxury', label: 'Luxury', desc: 'Noir profond, touches or & typographie serif', previewBg: 'bg-[#151518] border-[#d4af37]/40 text-[#d4af37]' },
    { id: 'moroccan', label: 'Moroccan', desc: 'Terre cuite, zellige chaud & élégance artisanale', previewBg: 'bg-[#faf6f0] border-[#b45309] text-[#b45309]' },
    { id: 'minimal', label: 'Minimal', desc: 'Blanc immaculé, suisse & aéré', previewBg: 'bg-white border-neutral-300 text-black' },
  ];

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setError(null);
    try {
      const res = await api.uploadImage(file);
      setLogoUrl(res.url);
    } catch (err: any) {
      setError(err.message || 'Erreur d’envoi de logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setError(null);
    try {
      const res = await api.uploadImage(file);
      setCoverUrl(res.url);
    } catch (err: any) {
      setError(err.message || 'Erreur d’envoi de couverture.');
    } finally {
      setUploadingCover(false);
    }
  };

  const toggleLanguage = (lang: LanguageCode) => {
    const current = Array.isArray(languages) ? languages : ['fr', 'ar', 'en'];
    if (current.includes(lang)) {
      if (current.length === 1) return; // keep at least one
      const updated = current.filter((l) => l !== lang);
      setLanguages(updated);
      if (defaultLang === lang) {
        setDefaultLang(updated[0] || 'fr');
      }
    } else {
      setLanguages([...current, lang]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Le nom du restaurant est obligatoire.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim(),
      address: address.trim(),
      phone: phone.trim(),
      currency: currency.trim() || 'MAD',
      theme,
      primary_color: primaryColor,
      languages,
      default_language: defaultLang,
      logo_url: logoUrl.trim(),
      cover_url: coverUrl.trim(),
      is_published: isPublished,
    };

    try {
      let saved: Restaurant;
      if (isEdit && restaurant) {
        saved = await api.updateRestaurant(restaurant.id, payload);
      } else {
        saved = await api.createRestaurant(payload);
      }
      onSave(saved);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l’enregistrement du restaurant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-1">
          {isEdit ? 'Modifier l’Établissement' : 'Nouveau Restaurant TouchBizz'}
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Identité de marque, langues et thème visuel du menu numérique
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Restaurant Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Nom du Restaurant *
              </label>
              <input
                id="restaurant-name-field"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: La Table Marrakech"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Slug URL (Permanent)
              </label>
              <input
                id="restaurant-slug-field"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ex: la-table-marrakech"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Génère l’URL : /r/{slug || 'nom-du-restaurant'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Description / Accroche
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Gastronomie marocaine raffinée et saveurs méditerranéennes..."
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Adresse
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ex: Guéliz, Marrakech"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Téléphone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+212 5 24 00 00 00"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Devise
              </label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="MAD, €, $"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Theme Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-amber-500" />
              <span>Thème Visuel du Menu Public</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {themes.map((th) => (
                <div
                  key={th.id}
                  onClick={() => setTheme(th.id)}
                  className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-start justify-between ${
                    theme === th.id
                      ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20'
                      : 'border-slate-800 bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{th.label}</span>
                      {theme === th.id && (
                        <Check className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{th.desc}</p>
                  </div>
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 ${th.previewBg}`}>
                    Aa
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Languages configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Langues disponibles sur le menu
              </label>
              <div className="flex items-center gap-3">
                {(['fr', 'ar', 'en'] as LanguageCode[]).map((code) => {
                  const labels: Record<LanguageCode, string> = { fr: 'Français', ar: 'العربية', en: 'English' };
                  const active = Array.isArray(languages) ? languages.includes(code) : false;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => toggleLanguage(code)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        active
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {labels[code]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Langue par défaut
              </label>
              <select
                value={defaultLang}
                onChange={(e) => setDefaultLang(e.target.value as LanguageCode)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
              >
                {(Array.isArray(languages) ? languages : (['fr', 'ar', 'en'] as LanguageCode[])).map((l) => (
                  <option key={l} value={l}>
                    {l === 'fr' ? 'Français (Défaut)' : l === 'ar' ? 'العربية (RTL)' : 'English'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Images Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Logo */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Logo du Restaurant
              </label>
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-14 h-14 rounded-xl object-cover border border-slate-700" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-500">
                    Sans logo
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingLogo ? 'Envoi...' : 'Téléverser'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                  </label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="ou URL de l'image"
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Cover */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Image de Couverture
              </label>
              <div className="flex items-center gap-3">
                {coverUrl ? (
                  <img src={coverUrl} alt="Cover" className="w-20 h-14 rounded-xl object-cover border border-slate-700" />
                ) : (
                  <div className="w-20 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-500">
                    Sans photo
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingCover ? 'Envoi...' : 'Téléverser'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
                  </label>
                  <input
                    type="text"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="ou URL de l'image"
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Published Toggle */}
          <div className="flex items-center gap-3 pt-2">
            <input
              id="publish-toggle-checkbox"
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
            />
            <label htmlFor="publish-toggle-checkbox" className="text-sm font-medium text-slate-200 cursor-pointer">
              Menu publié et accessible au public
            </label>
          </div>

          {/* Submit */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer le restaurant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
