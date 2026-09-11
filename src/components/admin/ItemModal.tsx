import React, { useState } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import { MenuItem, Category, ProductBadge } from '../../types';
import { api } from '../../lib/api';

interface ItemModalProps {
  restaurantId: string;
  currency: string;
  categories: Category[];
  item?: MenuItem | null;
  initialCategoryId?: string;
  onClose: () => void;
  onSave: (item: MenuItem) => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  restaurantId,
  currency,
  categories,
  item,
  initialCategoryId,
  onClose,
  onSave,
}) => {
  const isEdit = !!item;

  const [categoryId, setCategoryId] = useState(
    item?.category_id || initialCategoryId || (categories[0]?.id ?? '')
  );
  const [nameFr, setNameFr] = useState(item?.name_fr || '');
  const [nameAr, setNameAr] = useState(item?.name_ar || '');
  const [nameEn, setNameEn] = useState(item?.name_en || '');
  const [descFr, setDescFr] = useState(item?.description_fr || '');
  const [descAr, setDescAr] = useState(item?.description_ar || '');
  const [descEn, setDescEn] = useState(item?.description_en || '');
  const [price, setPrice] = useState(item ? item.price.toString() : '');
  const [imageUrl, setImageUrl] = useState(item?.image_url || '');
  const [isAvailable, setIsAvailable] = useState(item ? item.is_available : true);
  const [badge, setBadge] = useState<string>(item?.badge || '');
  const [ingredients, setIngredients] = useState(item?.ingredients || '');
  const [allergens, setAllergens] = useState(item?.allergens || '');

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const badges: { value: string; label: string }[] = [
    { value: '', label: 'Aucun badge' },
    { value: 'Populaire', label: '★ Populaire' },
    { value: 'Chef', label: '👨‍🍳 Chef' },
    { value: 'Nouveau', label: '✨ Nouveau' },
    { value: 'Épicé', label: '🌶️ Épicé' },
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError(null);

    try {
      const res = await api.uploadImage(file);
      setImageUrl(res.url);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du téléversement de l’image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameFr.trim()) {
      setError('Le nom du plat en français est obligatoire.');
      return;
    }
    if (!categoryId) {
      setError('Veuillez sélectionner une catégorie.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      category_id: categoryId,
      name_fr: nameFr.trim(),
      name_ar: nameAr.trim(),
      name_en: nameEn.trim(),
      description_fr: descFr.trim(),
      description_ar: descAr.trim(),
      description_en: descEn.trim(),
      price: parseFloat(price) || 0,
      image_url: imageUrl.trim(),
      is_available: isAvailable,
      badge,
      ingredients: ingredients.trim(),
      allergens: allergens.trim(),
    };

    try {
      let result: MenuItem;
      if (isEdit && item) {
        result = await api.updateMenuItem(item.id, payload);
      } else {
        result = await api.createMenuItem(restaurantId, payload);
      }
      onSave(result);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l’enregistrement du plat.');
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
          {isEdit ? 'Modifier le Plat' : 'Ajouter un Plat au Menu'}
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Informations complètes, traductions, photo et tarifs
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Catégorie *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_fr} {c.name_ar ? `(${c.name_ar})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Prix ({currency}) *
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="120"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Names in 3 languages */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">
              Titres du plat (Multi-langues)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Nom (Français) *</label>
                <input
                  type="text"
                  required
                  value={nameFr}
                  onChange={(e) => setNameFr(e.target.value)}
                  placeholder="Tajine d’Agneau"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Nom (العربية)</label>
                <input
                  type="text"
                  dir="rtl"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="طاجين لحم الخروف"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 font-arabic"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Nom (English)</label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="Lamb Tagine"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Descriptions in 3 languages */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">
              Descriptions détaillées
            </h3>
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Description (Français)</label>
                <textarea
                  rows={2}
                  value={descFr}
                  onChange={(e) => setDescFr(e.target.value)}
                  placeholder="Souris d’agneau fondante cuite 5 heures à feu doux..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Description (العربية)</label>
                  <textarea
                    rows={2}
                    dir="rtl"
                    value={descAr}
                    onChange={(e) => setDescAr(e.target.value)}
                    placeholder="لحم خروف طري مطهو ببطء مع زعفران تالوين..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 font-arabic"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Description (English)</label>
                  <textarea
                    rows={2}
                    value={descEn}
                    onChange={(e) => setDescEn(e.target.value)}
                    placeholder="Slow-cooked lamb shank with saffron reduction..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Photo & Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Photo du Plat
              </label>
              <div className="flex items-center gap-3">
                {imageUrl ? (
                  <img src={imageUrl} alt="Plat preview" className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-500 shrink-0">
                    Sans photo
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Envoi...' : 'Téléverser photo'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="ou URL (ex: Unsplash)"
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Badge d'accent
              </label>
              <select
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
              >
                {badges.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ingredients & Allergens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Ingrédients
              </label>
              <input
                type="text"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="Agneau, Pruneaux, Amandes, Safran..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Allergènes
              </label>
              <input
                type="text"
                value={allergens}
                onChange={(e) => setAllergens(e.target.value)}
                placeholder="Fruits à coque, Gluten, Lait..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Availability Switch */}
          <div className="flex items-center gap-3 pt-2">
            <input
              id="item-available-checkbox"
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
            />
            <label htmlFor="item-available-checkbox" className="text-sm font-medium text-slate-200 cursor-pointer">
              Plat disponible immédiatement à la commande
            </label>
          </div>

          {/* Actions */}
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
              {loading ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Ajouter au menu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
