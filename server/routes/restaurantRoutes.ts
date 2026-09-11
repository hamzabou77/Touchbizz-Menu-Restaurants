import { Router, Request, Response } from 'express';
import QRCode from 'qrcode';
import { db, DbRestaurant } from '../database/db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Helper to generate clean slug
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// ==========================================
// PUBLIC CUSTOMER ROUTE (NO AUTHENTICATION)
// ==========================================
// GET /api/public/menu/:slug
router.get('/public/menu/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const restaurant = await db.getRestaurantBySlug(slug);

    if (!restaurant) {
      return res.status(404).json({ error: 'Ce restaurant n’existe pas ou est introuvable.' });
    }

    if (!restaurant.is_published) {
      return res.status(403).json({ error: 'Ce menu est temporairement indisponible.' });
    }

    const categories = await db.getCategories(restaurant.id);
    const activeCategories = categories.filter((c) => c.is_active);
    const items = await db.getMenuItems(restaurant.id);

    // Parse languages safely
    let languages = ['fr', 'ar', 'en'];
    try {
      if (typeof restaurant.languages === 'string') {
        languages = JSON.parse(restaurant.languages);
      } else if (Array.isArray(restaurant.languages)) {
        languages = restaurant.languages;
      }
    } catch {
      languages = ['fr', 'ar', 'en'];
    }

    // Return sanitized public customer payload (no private internal details or other restaurant info)
    res.json({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        description: restaurant.description,
        address: restaurant.address,
        phone: restaurant.phone,
        currency: restaurant.currency || 'MAD',
        logo_url: restaurant.logo_url,
        cover_url: restaurant.cover_url,
        theme: restaurant.theme || 'modern',
        primary_color: restaurant.primary_color || '#0f172a',
        languages,
        default_language: restaurant.default_language || 'fr',
      },
      categories: activeCategories.map((c) => ({
        id: c.id,
        restaurant_id: c.restaurant_id,
        name_fr: c.name_fr,
        name_ar: c.name_ar,
        name_en: c.name_en,
        sort_order: c.sort_order,
      })),
      items: items.map((i) => ({
        id: i.id,
        restaurant_id: i.restaurant_id,
        category_id: i.category_id,
        name_fr: i.name_fr,
        name_ar: i.name_ar,
        name_en: i.name_en,
        description_fr: i.description_fr,
        description_ar: i.description_ar,
        description_en: i.description_en,
        price: Number(i.price),
        image_url: i.image_url,
        is_available: Boolean(i.is_available),
        badge: i.badge,
        ingredients: i.ingredients,
        allergens: i.allergens,
        sort_order: i.sort_order,
      })),
    });
  } catch (err) {
    console.error('Error fetching public menu:', err);
    res.status(500).json({ error: 'Ce menu est temporairement indisponible.' });
  }
});

// ==========================================
// ADMIN PROTECTED ROUTES
// ==========================================

// GET /api/restaurants - List all restaurants for current user or admin
router.get('/restaurants', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.role === 'admin' ? undefined : req.user?.id;
    const restaurants = await db.getRestaurants(userId);
    
    // Parse languages
    const formatted = restaurants.map((r) => {
      let langs = ['fr', 'ar', 'en'];
      try {
        if (typeof r.languages === 'string') langs = JSON.parse(r.languages);
        else if (Array.isArray(r.languages)) langs = r.languages;
      } catch {}
      return {
        ...r,
        languages: langs,
        is_published: Boolean(r.is_published),
      };
    });

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des restaurants.' });
  }
});

// GET /api/restaurants/:id - Get specific restaurant
router.get('/restaurants/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await db.getRestaurantById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouvé.' });
    }

    // Owner check
    if (req.user?.role !== 'admin' && restaurant.user_id !== req.user?.id) {
      return res.status(403).json({ error: 'Accès non autorisé.' });
    }

    let langs = ['fr', 'ar', 'en'];
    try {
      if (typeof restaurant.languages === 'string') langs = JSON.parse(restaurant.languages);
      else if (Array.isArray(restaurant.languages)) langs = restaurant.languages;
    } catch {}

    res.json({
      ...restaurant,
      languages: langs,
      is_published: Boolean(restaurant.is_published),
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/restaurants - Create new restaurant
router.post('/restaurants', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, description, address, phone, currency, logo_url, cover_url, theme, primary_color, languages, default_language } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Le nom du restaurant est obligatoire.' });
    }

    let generatedSlug = slug ? slugify(slug) : slugify(name);
    let existing = await db.getRestaurantBySlug(generatedSlug);
    if (existing) {
      generatedSlug = `${generatedSlug}-${Date.now().toString().slice(-4)}`;
    }

    const now = new Date().toISOString();
    const newRestaurant: DbRestaurant = {
      id: `rst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: req.user!.id,
      name: name.trim(),
      slug: generatedSlug,
      description: description || '',
      address: address || '',
      phone: phone || '',
      currency: currency || 'MAD',
      logo_url: logo_url || '',
      cover_url: cover_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&auto=format&fit=crop&q=80',
      theme: theme || 'modern',
      primary_color: primary_color || '#0f172a',
      languages: JSON.stringify(languages || ['fr', 'ar', 'en']),
      default_language: default_language || 'fr',
      is_published: 1,
      created_at: now,
      updated_at: now,
    };

    await db.createRestaurant(newRestaurant);

    // Create 3 default starter categories to make restaurant ready
    const starterCategories = [
      { name_fr: 'Entrées', name_ar: 'مقبلات', name_en: 'Starters', sort_order: 1 },
      { name_fr: 'Plats Principaux', name_ar: 'أطباق رئيسية', name_en: 'Main Courses', sort_order: 2 },
      { name_fr: 'Desserts & Boissons', name_ar: 'حلويات ومشروبات', name_en: 'Desserts & Drinks', sort_order: 3 },
    ];

    for (const cat of starterCategories) {
      await db.createCategory({
        id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        restaurant_id: newRestaurant.id,
        name_fr: cat.name_fr,
        name_ar: cat.name_ar,
        name_en: cat.name_en,
        sort_order: cat.sort_order,
        is_active: 1,
        created_at: now,
        updated_at: now,
      });
    }

    res.status(201).json({
      ...newRestaurant,
      languages: languages || ['fr', 'ar', 'en'],
      is_published: true,
    });
  } catch (err) {
    console.error('Error creating restaurant:', err);
    res.status(500).json({ error: 'Erreur lors de la création du restaurant.' });
  }
});

// PUT /api/restaurants/:id - Update restaurant branding and settings
router.put('/restaurants/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await db.getRestaurantById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Restaurant non trouvé.' });
    }

    if (req.user?.role !== 'admin' && existing.user_id !== req.user?.id) {
      return res.status(403).json({ error: 'Action non autorisée.' });
    }

    const { name, slug, description, address, phone, currency, logo_url, cover_url, theme, primary_color, languages, default_language, is_published } = req.body;

    const updates: Partial<DbRestaurant> = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description;
    if (address !== undefined) updates.address = address;
    if (phone !== undefined) updates.phone = phone;
    if (currency !== undefined) updates.currency = currency;
    if (logo_url !== undefined) updates.logo_url = logo_url;
    if (cover_url !== undefined) updates.cover_url = cover_url;
    if (theme !== undefined) updates.theme = theme;
    if (primary_color !== undefined) updates.primary_color = primary_color;
    if (default_language !== undefined) updates.default_language = default_language;
    if (is_published !== undefined) updates.is_published = is_published ? 1 : 0;
    if (languages !== undefined) {
      updates.languages = typeof languages === 'string' ? languages : JSON.stringify(languages);
    }

    if (slug && slug !== existing.slug) {
      const cleanSlug = slugify(slug);
      const slugCheck = await db.getRestaurantBySlug(cleanSlug);
      if (slugCheck && slugCheck.id !== existing.id) {
        return res.status(400).json({ error: 'Cet identifiant d’URL (slug) est déjà utilisé par un autre établissement.' });
      }
      updates.slug = cleanSlug;
    }

    const updated = await db.updateRestaurant(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Restaurant non trouvé.' });
    }

    let langs = ['fr', 'ar', 'en'];
    try {
      if (typeof updated.languages === 'string') {
        const parsed = JSON.parse(updated.languages);
        if (Array.isArray(parsed) && parsed.length > 0) langs = parsed;
      } else if (Array.isArray(updated.languages)) {
        langs = updated.languages;
      }
    } catch {
      langs = ['fr', 'ar', 'en'];
    }

    res.json({
      ...updated,
      languages: langs,
      is_published: Boolean(updated.is_published),
    });
  } catch (err) {
    console.error('Error updating restaurant:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour.' });
  }
});

// POST /api/restaurants/:id/toggle-publish
router.post('/restaurants/:id/toggle-publish', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await db.getRestaurantById(req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant non trouvé' });
    if (req.user?.role !== 'admin' && restaurant.user_id !== req.user?.id) {
      return res.status(403).json({ error: 'Action non autorisée' });
    }

    const newStatus = restaurant.is_published ? 0 : 1;
    await db.updateRestaurant(restaurant.id, { is_published: newStatus });
    res.json({ is_published: Boolean(newStatus) });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors du changement de statut.' });
  }
});

// DELETE /api/restaurants/:id
router.delete('/restaurants/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await db.getRestaurantById(req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant non trouvé.' });
    if (req.user?.role !== 'admin' && restaurant.user_id !== req.user?.id) {
      return res.status(403).json({ error: 'Action non autorisée.' });
    }

    await db.deleteRestaurant(req.params.id);
    res.json({ success: true, message: 'Restaurant supprimé avec succès.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression.' });
  }
});

// GET /api/restaurants/:id/qr - QR Code and NFC link generator
router.get('/restaurants/:id/qr', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await db.getRestaurantById(req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant non trouvé.' });

    // Base URL resolution
    const hostHeader = req.get('host') || 'menu.touchbizz.ma';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseUrl = process.env.APP_URL || `${protocol}://${hostHeader}`;
    
    // Stable permanent public URL
    const publicUrl = `${baseUrl.replace(/\/$/, '')}/r/${restaurant.slug}`;

    // Generate high resolution QR code data URL
    const qrDataUrl = await QRCode.toDataURL(publicUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 600,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    const qrSvg = await QRCode.toString(publicUrl, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    res.json({
      publicUrl,
      qrDataUrl,
      qrSvg,
      restaurantName: restaurant.name,
      slug: restaurant.slug,
    });
  } catch (err) {
    console.error('QR code generation error:', err);
    res.status(500).json({ error: 'Impossible de générer le QR code.' });
  }
});

export default router;
