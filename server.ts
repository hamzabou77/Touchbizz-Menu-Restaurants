import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { initDatabase } from './server/database/db';
import authRoutes from './server/routes/authRoutes';
import restaurantRoutes from './server/routes/restaurantRoutes';
import categoryRoutes from './server/routes/categoryRoutes';
import itemRoutes from './server/routes/itemRoutes';
import uploadRoutes from './server/routes/uploadRoutes';

// Load environment variables
dotenv.config();

const PORT = 3000;

async function startServer() {
  // Initialize Database (MySQL or persistent file store fallback)
  await initDatabase();

  const app = express();

  // Basic Middlewares
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static uploads directory
  const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
  app.use('/uploads', express.static(uploadsPath));
  const publicPath = path.join(process.cwd(), 'public');
  app.use(express.static(publicPath));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'TouchBizz Menu API',
      timestamp: new Date().toISOString(),
    });
  });

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api', restaurantRoutes);
  app.use('/api', categoryRoutes);
  app.use('/api', itemRoutes);
  app.use('/api', uploadRoutes);

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TouchBizz Menu] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[TouchBizz Menu] Fatal server startup error:', err);
});
