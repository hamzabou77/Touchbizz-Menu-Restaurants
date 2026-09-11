import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Utensils,
  Store,
  Settings,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  QrCode,
  CheckCircle2,
  XCircle,
  Eye,
  LogOut,
  ArrowUp,
  ArrowDown,
  Globe,
  Sliders,
  Sparkles,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { Restaurant, Category, MenuItem, User } from '../../types';
import { api } from '../../lib/api';
import { RestaurantModal } from './RestaurantModal';
import { CategoryModal } from './CategoryModal';
import { ItemModal } from './ItemModal';
import { QrModal } from './QrModal';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

type TabType = 'dashboard' | 'restaurants' | 'menu' | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabType>('menu');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');

  // Modals state
  const [restaurantModalOpen, setRestaurantModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // 1. Fetch restaurants on mount
  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const list = await api.getRestaurants();
      setRestaurants(list);
      if (list.length > 0 && !selectedRestaurantId) {
        setSelectedRestaurantId(list[0].id);
      }
    } catch (err: any) {
      showNotification('Erreur de chargement des restaurants: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Selected restaurant object
  const currentRestaurant = useMemo(() => {
    return restaurants.find((r) => r.id === selectedRestaurantId) || restaurants[0] || null;
  }, [restaurants, selectedRestaurantId]);

  // 2. Fetch categories and items when selected restaurant changes
  useEffect(() => {
    if (currentRestaurant) {
      loadRestaurantMenu(currentRestaurant.id);
    }
  }, [currentRestaurant?.id]);

  const loadRestaurantMenu = async (restaurantId: string) => {
    try {
      const [cats, itms] = await Promise.all([
        api.getCategories(restaurantId),
        api.getMenuItems(restaurantId),
      ]);
      setCategories(cats);
      setItems(itms);
    } catch (err: any) {
      showNotification('Erreur de chargement du menu: ' + err.message);
    }
  };

  // Filtered items in Menu view
  const displayedItems = useMemo(() => {
    if (filterCategoryId === 'all') return items;
    return items.filter((i) => i.category_id === filterCategoryId);
  }, [items, filterCategoryId]);

  // Handlers for Restaurant Actions
  const handleTogglePublish = async (restaurant: Restaurant) => {
    try {
      const res = await api.togglePublishRestaurant(restaurant.id);
      setRestaurants((prev) =>
        prev.map((r) => (r.id === restaurant.id ? { ...r, is_published: res.is_published } : r))
      );
      showNotification(res.is_published ? 'Menu publié avec succès !' : 'Menu masqué au public.');
    } catch (err: any) {
      showNotification('Erreur: ' + err.message);
    }
  };

  const handleDeleteRestaurant = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cet établissement et tout son menu ?')) {
      return;
    }
    try {
      await api.deleteRestaurant(id);
      const updated = restaurants.filter((r) => r.id !== id);
      setRestaurants(updated);
      if (selectedRestaurantId === id && updated.length > 0) {
        setSelectedRestaurantId(updated[0].id);
      }
      showNotification('Restaurant supprimé.');
    } catch (err: any) {
      showNotification('Erreur: ' + err.message);
    }
  };

  // Handlers for Category Actions
  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Supprimer cette catégorie et tous les plats qui y sont associés ?')) {
      return;
    }
    try {
      await api.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setItems((prev) => prev.filter((i) => i.category_id !== id));
      showNotification('Catégorie supprimée.');
    } catch (err: any) {
      showNotification('Erreur: ' + err.message);
    }
  };

  const handleReorderCategory = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const reordered = [...categories];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);
    setCategories(reordered);

    if (currentRestaurant) {
      await api.reorderCategories(currentRestaurant.id, reordered.map((c) => c.id));
    }
  };

  // Handlers for Item Actions
  const handleToggleItemAvailability = async (item: MenuItem) => {
    try {
      const res = await api.toggleItemAvailability(item.id);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_available: res.is_available } : i))
      );
      showNotification(res.is_available ? 'Plat marqué disponible.' : 'Plat marqué indisponible.');
    } catch (err: any) {
      showNotification('Erreur: ' + err.message);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Supprimer ce plat définitivement du menu ?')) return;
    try {
      await api.deleteMenuItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      showNotification('Plat supprimé.');
    } catch (err: any) {
      showNotification('Erreur: ' + err.message);
    }
  };

  const handleReorderItem = async (index: number, direction: 'up' | 'down') => {
    const currentList = [...displayedItems];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentList.length) return;

    const [moved] = currentList.splice(index, 1);
    currentList.splice(newIndex, 0, moved);

    // Update main items list preserving others
    const others = items.filter((i) => !currentList.some((c) => c.id === i.id));
    setItems([...currentList, ...others]);

    if (currentRestaurant) {
      await api.reorderMenuItems(currentRestaurant.id, currentList.map((i) => i.id));
    }
  };

  return (
    <div id="touchbizz-admin-dashboard" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo & Brand */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-lg shadow-amber-500/20">
              TB
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white leading-tight">
                TouchBizz Menu
              </h1>
              <p className="text-[11px] text-slate-400">Plateforme de Menus QR</p>
            </div>
          </div>

          {/* Restaurant Selector Dropdown */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/60">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Restaurant Actif
            </label>
            <div className="flex items-center gap-2">
              <select
                id="restaurant-switcher-select"
                value={selectedRestaurantId}
                onChange={(e) => setSelectedRestaurantId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
              >
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} {!r.is_published ? '(Masqué)' : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setEditingRestaurant(null);
                  setRestaurantModalOpen(true);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 shrink-0"
                title="Ajouter un restaurant"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="p-4 space-y-1">
            <button
              id="tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Tableau de Bord</span>
            </button>

            <button
              id="tab-menu"
              onClick={() => setActiveTab('menu')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'menu'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Gestion du Menu</span>
            </button>

            <button
              id="tab-restaurants"
              onClick={() => setActiveTab('restaurants')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'restaurants'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Établissements ({restaurants.length})</span>
            </button>

            <button
              id="tab-settings"
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Branding & Thème</span>
            </button>
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
              HB
            </div>
            <div className="truncate">
              <p className="font-semibold text-slate-200 truncate">
                {user?.name && user.name !== 'Admin TouchBizz' ? user.name : 'Hamza Boaly'}
              </p>
              <p className="text-[11px] text-slate-400 truncate font-mono">
                {user?.email && user.email !== 'admin@touchbizz.ma' ? user.email : 'boalyhamza@gmail.com'}
              </p>
            </div>
          </div>
          <button
            id="logout-button"
            onClick={onLogout}
            className="p-2 rounded-xl hover:bg-slate-800 hover:text-rose-400 transition-colors shrink-0"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Header with Quick Actions */}
        <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/40 backdrop-blur-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{currentRestaurant ? currentRestaurant.name : 'Aucun établissement'}</span>
              {currentRestaurant && (
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                    currentRestaurant.is_published
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {currentRestaurant.is_published ? 'En ligne' : 'Masqué'}
                </span>
              )}
            </h2>
            {currentRestaurant && (
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                URL permanente : /r/{currentRestaurant.slug}
              </p>
            )}
          </div>

          {currentRestaurant && (
            <div className="flex flex-wrap items-center gap-2.5">
              {/* QR & NFC Button */}
              <button
                id="open-qr-modal-button"
                onClick={() => setQrModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span>QR Code & NFC</span>
              </button>

              {/* View Public Menu in new tab */}
              <a
                id="view-public-menu-link"
                href={`/r/${currentRestaurant.slug}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Voir le Menu Public</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {/* Toggle Publish */}
              <button
                onClick={() => handleTogglePublish(currentRestaurant)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  currentRestaurant.is_published
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-rose-900/30 hover:border-rose-700 hover:text-rose-300'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                }`}
              >
                {currentRestaurant.is_published ? 'Dépublier' : 'Publier le menu'}
              </button>
            </div>
          )}
        </header>

        {/* Content Tabs */}
        <div className="p-6">
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Metrics cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Établissements</span>
                  <p className="text-2xl font-black text-white">{restaurants.length}</p>
                  <p className="text-[11px] text-slate-500">Gérés sur TouchBizz</p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Catégories du menu</span>
                  <p className="text-2xl font-black text-white">{categories.length}</p>
                  <p className="text-[11px] text-slate-500">Entrées, Plats, Desserts...</p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Plats enregistrés</span>
                  <p className="text-2xl font-black text-white">{items.length}</p>
                  <p className="text-[11px] text-emerald-400">
                    {items.filter((i) => i.is_available).length} disponibles
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Thème actif</span>
                  <p className="text-lg font-bold text-amber-400 capitalize">
                    {currentRestaurant?.theme || 'Modern'}
                  </p>
                  <p className="text-[11px] text-slate-500">Style mobile du menu client</p>
                </div>
              </div>

              {/* Quick Start Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-500" />
                  <span>Principe de fonctionnement TouchBizz Menu</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300 leading-relaxed">
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                    <strong className="text-white block font-semibold text-sm">1. QR & Tag NFC sur table</strong>
                    <p className="text-slate-400">
                      Chaque table dispose d’un chevalet QR ou badge NFC pointant vers votre URL permanente.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                    <strong className="text-white block font-semibold text-sm">2. Accès instantané client</strong>
                    <p className="text-slate-400">
                      Le client scanne ou tape son smartphone : le menu s’affiche immédiatement sans login ni application.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                    <strong className="text-white block font-semibold text-sm">3. Mises à jour en direct</strong>
                    <p className="text-slate-400">
                      Modifiez les prix, les plats ou masquez un article épuisé en 1 clic sans jamais réimprimer vos QR codes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MENU MANAGEMENT */}
          {activeTab === 'menu' && currentRestaurant && (
            <div className="space-y-8">
              {/* SECTION A: CATEGORIES */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Catégories du Restaurant</span>
                      <span className="px-2 py-0.5 text-xs bg-slate-800 rounded-full text-slate-400">
                        {categories.length}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Organisez les sections de votre menu et modifiez leur ordre d'affichage
                    </p>
                  </div>
                  <button
                    id="add-category-button"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nouvelle Catégorie</span>
                  </button>
                </div>

                {/* Categories Table / List */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
                  {categories.map((cat, idx) => (
                    <div
                      key={cat.id}
                      className="p-3.5 sm:px-5 flex items-center justify-between gap-4 hover:bg-slate-850 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Order buttons */}
                        <div className="flex flex-col gap-1">
                          <button
                            disabled={idx === 0}
                            onClick={() => handleReorderCategory(idx, 'up')}
                            className="p-1 text-slate-500 hover:text-white disabled:opacity-20 transition-colors"
                            title="Monter"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={idx === categories.length - 1}
                            onClick={() => handleReorderCategory(idx, 'down')}
                            className="p-1 text-slate-500 hover:text-white disabled:opacity-20 transition-colors"
                            title="Descendre"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <p className="text-sm font-bold text-white flex items-center gap-2">
                            <span>{cat.name_fr}</span>
                            {cat.name_ar && (
                              <span className="text-xs text-slate-400 font-arabic">
                                ({cat.name_ar})
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {items.filter((i) => i.category_id === cat.id).length} plats associés
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setCategoryModalOpen(true);
                          }}
                          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Modifier la catégorie"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Supprimer la catégorie"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-500">
                      Aucune catégorie créée pour le moment. Cliquez sur "Nouvelle Catégorie".
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION B: DISHES / MENU ITEMS */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Plats & Boissons du Menu</span>
                      <span className="px-2 py-0.5 text-xs bg-slate-800 rounded-full text-slate-400">
                        {displayedItems.length}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Gérez les intitulés, photos, tarifs et disponibilités instantanées
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Filter by category */}
                    <select
                      value={filterCategoryId}
                      onChange={(e) => setFilterCategoryId(e.target.value)}
                      className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                    >
                      <option value="all">Toutes les catégories</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name_fr}
                        </option>
                      ))}
                    </select>

                    <button
                      id="add-dish-button"
                      onClick={() => {
                        setEditingItem(null);
                        setItemModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter un Plat</span>
                    </button>
                  </div>
                </div>

                {/* Items Grid / List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl bg-slate-900 border transition-all flex flex-col justify-between space-y-3 ${
                        item.is_available ? 'border-slate-800' : 'border-rose-950/40 bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Thumbnail */}
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name_fr}
                            className="w-16 h-16 rounded-xl object-cover border border-slate-800 shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-500">
                            <Utensils className="w-6 h-6" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white truncate">
                              {item.name_fr}
                            </h4>
                            {item.badge && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.name_ar && (
                            <p className="text-xs text-slate-400 font-arabic truncate mt-0.5">
                              {item.name_ar}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 line-clamp-1 mt-1">
                            {item.description_fr || 'Sans description'}
                          </p>
                        </div>
                      </div>

                      {/* Bottom row: Price, availability switch, actions */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <span className="text-base font-extrabold text-amber-400">
                          {item.price} {currentRestaurant.currency}
                        </span>

                        <div className="flex items-center gap-2">
                          {/* 1-Click Availability Toggle */}
                          <button
                            onClick={() => handleToggleItemAvailability(item)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                              item.is_available
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {item.is_available ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Disponible</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                <span>Épuisé</span>
                              </>
                            )}
                          </button>

                          {/* Reorder arrows */}
                          <button
                            disabled={idx === 0}
                            onClick={() => handleReorderItem(idx, 'up')}
                            className="p-1 text-slate-500 hover:text-white disabled:opacity-20"
                            title="Monter"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={idx === displayedItems.length - 1}
                            onClick={() => handleReorderItem(idx, 'down')}
                            className="p-1 text-slate-500 hover:text-white disabled:opacity-20"
                            title="Descendre"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setItemModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {displayedItems.length === 0 && (
                  <div className="p-12 text-center text-xs text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
                    Aucun plat trouvé dans cette catégorie. Cliquez sur "Ajouter un Plat".
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: RESTAURANTS LIST */}
          {activeTab === 'restaurants' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Tous les Restaurants</h3>
                  <p className="text-xs text-slate-400">
                    Gérez vos différents établissements et clients TouchBizz
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingRestaurant(null);
                    setRestaurantModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouveau Restaurant</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {restaurants.map((rest) => (
                  <div
                    key={rest.id}
                    className={`p-5 rounded-2xl bg-slate-900 border transition-all space-y-4 ${
                      rest.id === selectedRestaurantId ? 'border-amber-500/80 ring-1 ring-amber-500/20' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-bold text-white">{rest.name}</h4>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">/r/{rest.slug}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                          rest.is_published
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {rest.is_published ? 'En ligne' : 'Masqué'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 space-y-1">
                      <p>
                        <strong>Thème :</strong> <span className="capitalize">{rest.theme}</span>
                      </p>
                      <p>
                        <strong>Devise :</strong> {rest.currency}
                      </p>
                      {rest.address && <p className="truncate"><strong>Adresse :</strong> {rest.address}</p>}
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setSelectedRestaurantId(rest.id);
                          setActiveTab('menu');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold"
                      >
                        Gérer le Menu
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedRestaurantId(rest.id);
                            setQrModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white"
                          title="QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingRestaurant(rest);
                            setRestaurantModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRestaurant(rest.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS & BRANDING */}
          {activeTab === 'settings' && currentRestaurant && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">Branding & Paramètres</h3>
                <p className="text-xs text-slate-400">
                  Personnalisez l’apparence du menu de {currentRestaurant.name}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Identité Visuelle</h4>
                    <p className="text-xs text-slate-400">Logo, image de couverture et thème sélectionné</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingRestaurant(currentRestaurant);
                      setRestaurantModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                  >
                    Modifier le Branding
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800 text-xs text-slate-300">
                  <div>
                    <p className="text-slate-500 text-[11px]">Thème Visuel</p>
                    <p className="font-semibold capitalize text-amber-400">{currentRestaurant.theme}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[11px]">Langue par défaut</p>
                    <p className="font-semibold uppercase">{currentRestaurant.default_language}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[11px]">Devise monétaire</p>
                    <p className="font-semibold">{currentRestaurant.currency}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[11px]">Statut en ligne</p>
                    <p className="font-semibold">{currentRestaurant.is_published ? 'Publié' : 'Masqué'}</p>
                  </div>
                </div>
              </div>

              {/* Hostinger & MySQL Deployment Information */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Architecture & Déploiement Hostinger MySQL</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  L'application utilise un backend Express modulaire avec un schéma relationnel MySQL (<code className="text-amber-400">schema.sql</code>), l'authentification JWT sécurisée et le hachage bcrypt. Compatible avec le déploiement Hostinger Node.js et les variables d'environnement standard (<code className="text-amber-400">DB_HOST</code>, <code className="text-amber-400">DB_USER</code>, <code className="text-amber-400">DB_PASSWORD</code>, <code className="text-amber-400">DB_NAME</code>).
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODALS */}
      {restaurantModalOpen && (
        <RestaurantModal
          restaurant={editingRestaurant}
          onClose={() => setRestaurantModalOpen(false)}
          onSave={(saved) => {
            if (editingRestaurant) {
              setRestaurants((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
              showNotification('Restaurant mis à jour !');
            } else {
              setRestaurants((prev) => [saved, ...prev]);
              setSelectedRestaurantId(saved.id);
              showNotification('Restaurant créé avec succès !');
            }
            setRestaurantModalOpen(false);
          }}
        />
      )}

      {categoryModalOpen && currentRestaurant && (
        <CategoryModal
          restaurantId={currentRestaurant.id}
          category={editingCategory}
          onClose={() => setCategoryModalOpen(false)}
          onSave={(cat) => {
            if (editingCategory) {
              setCategories((prev) => prev.map((c) => (c.id === cat.id ? cat : c)));
              showNotification('Catégorie mise à jour.');
            } else {
              setCategories((prev) => [...prev, cat]);
              showNotification('Catégorie ajoutée.');
            }
            setCategoryModalOpen(false);
          }}
        />
      )}

      {itemModalOpen && currentRestaurant && (
        <ItemModal
          restaurantId={currentRestaurant.id}
          currency={currentRestaurant.currency}
          categories={categories}
          item={editingItem}
          initialCategoryId={filterCategoryId !== 'all' ? filterCategoryId : undefined}
          onClose={() => setItemModalOpen(false)}
          onSave={(savedItem) => {
            if (editingItem) {
              setItems((prev) => prev.map((i) => (i.id === savedItem.id ? savedItem : i)));
              showNotification('Plat mis à jour !');
            } else {
              setItems((prev) => [...prev, savedItem]);
              showNotification('Plat ajouté au menu !');
            }
            setItemModalOpen(false);
          }}
        />
      )}

      {qrModalOpen && currentRestaurant && (
        <QrModal
          restaurant={currentRestaurant}
          onClose={() => setQrModalOpen(false)}
        />
      )}
    </div>
  );
};
