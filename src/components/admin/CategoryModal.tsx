import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Category } from '../../types';
import { api } from '../../lib/api';

interface CategoryModalProps {
  restaurantId: string;
  category?: Category | null;
  onClose: () => void;
  onSave: (cat: Category) => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  restaurantId,
  category,
  onClose,
  onSave,
}) => {
  const isEdit = !!category;
  const [nameFr, setNameFr] = useState(category?.name_fr || '');
  const [nameAr, setNameAr] = useState(category?.name_ar || '');
  const [nameEn, setNameEn] = useState(category?.name_en || '');
  const [isActive, setIsActive] = useState(category ? category.is_active : true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameFr.trim()) {
      setError('Le nom de catégorie en français est obligatoire.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      name_fr: nameFr.trim(),
      name_ar: nameAr.trim(),
      name_en: nameEn.trim(),
      is_active: isActive,
    };

    try {
      let result: Category;
      if (isEdit && category) {
        result = await api.updateCategory(category.id, payload);
      } else {
        result = await api.createCategory(restaurantId, payload);
      }
      onSave(result);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l’enregistrement de la catégorie.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-1">
          {isEdit ? 'Modifier la Catégorie' : 'Nouvelle Catégorie'}
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Saisissez les intitulés dans les langues souhaitées
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Nom Français (Défaut) *
            </label>
            <input
              type="text"
              required
              value={nameFr}
              onChange={(e) => setNameFr(e.target.value)}
              placeholder="ex: Tajines Traditionnels"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Nom Arabe (العربية)
            </label>
            <input
              type="text"
              dir="rtl"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="طواجن تقليدية"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 font-arabic"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Nom Anglais (English)
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="Traditional Tagines"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              id="category-active-toggle"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
            />
            <label htmlFor="category-active-toggle" className="text-sm text-slate-200 cursor-pointer">
              Catégorie active et visible sur le menu
            </label>
          </div>

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
              {loading ? 'Enregistrement...' : isEdit ? 'Enregistrer' : 'Créer la catégorie'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
