import React, { useState, useEffect } from 'react';
import { PublicMenu } from './components/public/PublicMenu';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LoginView } from './components/admin/LoginView';
import { api } from './lib/api';
import { User } from './types';
import { QrCode, Smartphone, ArrowRight, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const [currentUser, setCurrentUser] = useState<User | null>(api.getCurrentUser());
  const [authChecked, setAuthChecked] = useState(false);

  // Sync with browser history and popstate
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Validate session on start
  useEffect(() => {
    if (api.getToken()) {
      api.getMe()
        .then((res) => {
          setCurrentUser(res.user);
          setAuthChecked(true);
        })
        .catch(() => {
          api.clearAuth();
          setCurrentUser(null);
          setAuthChecked(true);
        });
    } else {
      setAuthChecked(true);
    }
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Route 1: PUBLIC CUSTOMER MENU (/r/:slug)
  // Must NEVER show admin buttons, dashboard, login, settings, or technical information.
  if (currentPath.startsWith('/r/')) {
    const slug = currentPath.replace('/r/', '').split('/')[0] || 'la-table-marrakech';
    return <PublicMenu restaurantSlug={slug} />;
  }

  // Route 2: LOGIN (/login)
  if (currentPath === '/login') {
    if (currentUser) {
      navigateTo('/dashboard');
      return null;
    }
    return (
      <LoginView
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          navigateTo('/dashboard');
        }}
      />
    );
  }

  // Route 3: ADMIN DASHBOARD (/dashboard or /admin)
  if (currentPath === '/dashboard' || currentPath === '/admin') {
    if (!currentUser && authChecked) {
      return (
        <LoginView
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            navigateTo('/dashboard');
          }}
        />
      );
    }
    if (!currentUser) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Vérification de la session...
        </div>
      );
    }
    return (
      <AdminDashboard
        user={currentUser}
        onLogout={() => {
          api.clearAuth();
          setCurrentUser(null);
          navigateTo('/login');
        }}
      />
    );
  }

  // Route 4: PORTAL / HOMEPAGE (/)
  return (
    <div id="touchbizz-portal-home" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500/20">
      {/* Top Bar */}
      <header className="px-6 py-5 max-w-6xl mx-auto w-full flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-lg shadow-amber-500/20">
            TB
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">TouchBizz Menu</h1>
            <p className="text-[11px] text-slate-400">Plateforme de Menus Digitaux pour Restaurants</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentUser ? (
            <button
              onClick={() => navigateTo('/dashboard')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
            >
              <span>Accéder au Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => navigateTo('/login')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all"
            >
              Espace Administrateur
            </button>
          )}
        </div>
      </header>

      {/* Main Hero */}
      <main className="max-w-4xl mx-auto px-6 py-12 text-center space-y-8 my-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Production Ready • Mobile First • NFC & QR Code</span>
        </div>

        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Le Menu Digital Élégant <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">
            pour Votre Restaurant
          </span>
        </h2>

        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Le client tape un badge NFC ou scanne un QR code sur sa table : le menu s'ouvre instantanément sans téléchargement, sans compte et sans friction.
        </p>

        {/* Big Action Cards: Customer Experience vs Admin Experience */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-4 max-w-3xl mx-auto">
          {/* Card 1: Experience Client Menu */}
          <div
            onClick={() => navigateTo('/r/la-table-marrakech')}
            className="group cursor-pointer p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 transition-all shadow-xl flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
                <span>Menu Client Public</span>
                <ExternalLink className="w-4 h-4 opacity-50" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Découvrez l'expérience vécue par le client sur table : photos HD, catégories défilantes, multilingue (FR / AR / EN avec support RTL) et détails des plats.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-amber-400 flex items-center gap-1">
              <span>Tester le menu /r/la-table-marrakech</span>
              <span>→</span>
            </div>
          </div>

          {/* Card 2: Experience Admin Dashboard */}
          <div
            onClick={() => navigateTo('/dashboard')}
            className="group cursor-pointer p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 transition-all shadow-xl flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
                <span>Dashboard Administrateur</span>
                <ArrowRight className="w-4 h-4 opacity-50" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gérez vos établissements, catégories, plats, photos, statuts de disponibilité en direct et générez vos QR codes et liens permanents NFC.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-amber-400 flex items-center gap-1">
              <span>Gérer les restaurants</span>
              <span>→</span>
            </div>
          </div>
        </div>

        {/* Technology Highlights */}
        <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-slate-400" />
            <span>QR & NFC Permanent</span>
          </span>
          <span>•</span>
          <span>4 Thèmes Visuels (Modern, Luxury, Moroccan, Minimal)</span>
          <span>•</span>
          <span>Multi-langues FR / AR (RTL) / EN</span>
          <span>•</span>
          <span>MySQL & Node.js Hostinger Compatible</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-slate-900 text-center text-xs text-slate-600">
        <p>TouchBizz Menu © 2026 • Tous droits réservés</p>
      </footer>
    </div>
  );
}
