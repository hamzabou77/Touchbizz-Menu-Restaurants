import { Router, Response } from 'express';
import { db, DbCategory } from '../database/db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/restaurants/:restaurantId/categories
router.get('/restaurants/:restaurantId/categories', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const categories = await db.getCategories(restaurantId);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des catégories.' });
  }
});

// POST /api/restaurants/:restaurantId/categories
router.post('/restaurants/:restaurantId/categories', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const { name_fr, name_ar, name_en } = req.body;

    if (!name_fr) {
      return res.status(400).json({ error: 'Le nom en français est obligatoire.' });
    }

    const existingCats = await db.getCategories(restaurantId);
    const nextOrder = existingCats.length > 0 ? Math.max(...existingCats.map((c) => c.sort_order)) + 1 : 1;

    const now = new Date().toISOString();
    const newCat: DbCategory = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      restaurant_id: restaurantId,
      name_fr: name_fr.trim(),
      name_ar: (name_ar || '').trim(),
      name_en: (name_en || '').trim(),
      sort_order: nextOrder,
      is_active: 1,
      created_at: now,
      updated_at: now,
    };

    await db.createCategory(newCat);
    res.status(201).json(newCat);
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Erreur lors de la création de la catégorie.' });
  }
});

// PUT /api/categories/:id
router.put('/categories/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name_fr, name_ar, name_en, is_active } = req.body;

    const updates: Partial<DbCategory> = {};
    if (name_fr !== undefined) updates.name_fr = name_fr.trim();
    if (name_ar !== undefined) updates.name_ar = name_ar.trim();
    if (name_en !== undefined) updates.name_en = name_en.trim();
    if (is_active !== undefined) updates.is_active = is_active ? 1 : 0;

    const updated = await db.updateCategory(id, updates);
    if (!updated) return res.status(404).json({ error: 'Catégorie non trouvée.' });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la catégorie.' });
  }
});

// POST /api/restaurants/:restaurantId/categories/reorder
router.post('/restaurants/:restaurantId/categories/reorder', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'Format d’ordonnancement invalide.' });
    }

    await db.reorderCategories(restaurantId, orderedIds);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors du réordonnancement.' });
  }
});

// DELETE /api/categories/:id
router.delete('/categories/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await db.deleteCategory(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la catégorie.' });
  }
});

export default router;
