import { Router, Response } from 'express';
import { db, DbMenuItem } from '../database/db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/restaurants/:restaurantId/items
router.get('/restaurants/:restaurantId/items', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const categoryId = req.query.category_id as string | undefined;
    const items = await db.getMenuItems(restaurantId, categoryId);
    res.json(
      items.map((i) => ({
        ...i,
        price: Number(i.price),
        is_available: Boolean(i.is_available),
      }))
    );
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des articles.' });
  }
});

// POST /api/restaurants/:restaurantId/items
router.post('/restaurants/:restaurantId/items', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const {
      category_id,
      name_fr,
      name_ar,
      name_en,
      description_fr,
      description_ar,
      description_en,
      price,
      image_url,
      is_available,
      badge,
      ingredients,
      allergens,
    } = req.body;

    if (!name_fr) {
      return res.status(400).json({ error: 'Le nom en français est obligatoire.' });
    }
    if (!category_id) {
      return res.status(400).json({ error: 'Veuillez sélectionner une catégorie.' });
    }

    const existingItems = await db.getMenuItems(restaurantId, category_id);
    const nextOrder = existingItems.length > 0 ? Math.max(...existingItems.map((i) => i.sort_order)) + 1 : 1;

    const now = new Date().toISOString();
    const newItem: DbMenuItem = {
      id: `itm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      restaurant_id: restaurantId,
      category_id,
      name_fr: name_fr.trim(),
      name_ar: (name_ar || '').trim(),
      name_en: (name_en || '').trim(),
      description_fr: (description_fr || '').trim(),
      description_ar: (description_ar || '').trim(),
      description_en: (description_en || '').trim(),
      price: parseFloat(price) || 0,
      image_url: image_url || '',
      is_available: is_available !== undefined ? (is_available ? 1 : 0) : 1,
      badge: badge || '',
      ingredients: ingredients || '',
      allergens: allergens || '',
      sort_order: nextOrder,
      created_at: now,
      updated_at: now,
    };

    await db.createMenuItem(newItem);
    res.status(201).json({
      ...newItem,
      price: Number(newItem.price),
      is_available: Boolean(newItem.is_available),
    });
  } catch (err) {
    console.error('Error creating menu item:', err);
    res.status(500).json({ error: 'Erreur lors de la création de l’article.' });
  }
});

// PUT /api/items/:id
router.put('/items/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      category_id,
      name_fr,
      name_ar,
      name_en,
      description_fr,
      description_ar,
      description_en,
      price,
      image_url,
      is_available,
      badge,
      ingredients,
      allergens,
    } = req.body;

    const updates: Partial<DbMenuItem> = {};
    if (category_id !== undefined) updates.category_id = category_id;
    if (name_fr !== undefined) updates.name_fr = name_fr.trim();
    if (name_ar !== undefined) updates.name_ar = name_ar.trim();
    if (name_en !== undefined) updates.name_en = name_en.trim();
    if (description_fr !== undefined) updates.description_fr = description_fr.trim();
    if (description_ar !== undefined) updates.description_ar = description_ar.trim();
    if (description_en !== undefined) updates.description_en = description_en.trim();
    if (price !== undefined) updates.price = parseFloat(price) || 0;
    if (image_url !== undefined) updates.image_url = image_url;
    if (is_available !== undefined) updates.is_available = is_available ? 1 : 0;
    if (badge !== undefined) updates.badge = badge;
    if (ingredients !== undefined) updates.ingredients = ingredients;
    if (allergens !== undefined) updates.allergens = allergens;

    const updated = await db.updateMenuItem(id, updates);
    if (!updated) return res.status(404).json({ error: 'Article introuvable.' });

    res.json({
      ...updated,
      price: Number(updated.price),
      is_available: Boolean(updated.is_available),
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la modification de l’article.' });
  }
});

// POST /api/items/:id/toggle-availability
router.post('/items/:id/toggle-availability', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const item = await db.getMenuItemById(id);
    if (!item) return res.status(404).json({ error: 'Article introuvable.' });

    const newStatus = item.is_available ? 0 : 1;
    const updated = await db.updateMenuItem(id, { is_available: newStatus });
    res.json({
      id: updated!.id,
      is_available: Boolean(updated!.is_available),
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors du changement de disponibilité.' });
  }
});

// POST /api/restaurants/:restaurantId/items/reorder
router.post('/restaurants/:restaurantId/items/reorder', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'Format d’ordonnancement invalide.' });
    }

    await db.reorderMenuItems(restaurantId, orderedIds);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors du réordonnancement.' });
  }
});

// DELETE /api/items/:id
router.delete('/items/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await db.deleteMenuItem(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression de l’article.' });
  }
});

export default router;
