import { Router, Request, Response, NextFunction } from 'express';
import { Category } from '../models/Category';
import { Deal } from '../models/Deal';
import { Setting } from '../models/Setting';
import { Log } from '../models/Log';
import { DataRefreshJob } from '../jobs/dataRefresh';
import { verifyAdmin } from '../middleware/auth';

export const adminRouter = Router();

// Development bypass middleware (only for localhost)
const devBypass = (req: Request, res: Response, next: NextFunction) => {
  // Allow access without authentication in development
  if (process.env.NODE_ENV !== 'production' && 
      (req.hostname === 'localhost' || req.hostname === '127.0.0.1')) {
    console.log('🔓 Development mode: Admin access bypassed');
    // Set a mock user for development
    (req as any).user = { 
      whop_user_id: 'dev-user',
      email: 'dev@localhost',
      membership_active: true
    };
    return next();
  }
  // In production, use real authentication
  verifyAdmin(req, res, next);
};

// Apply admin authentication middleware (with dev bypass)
adminRouter.use(devBypass);

// Get all categories
adminRouter.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.json([]);
  }
});

// Create category
adminRouter.post('/categories', async (req: Request, res: Response) => {
  try {
    const { name, slug } = req.body;
    const category = new Category({ name, slug });
    await category.save();
    res.json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
adminRouter.put('/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, is_active } = req.body;
    const category = await Category.findByIdAndUpdate(
      id,
      { name, slug, is_active },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Feature/unfeature a deal
adminRouter.put('/deals/:id/feature', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_featured } = req.body;
    const deal = await Deal.findByIdAndUpdate(
      id,
      { is_featured },
      { new: true }
    );
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json(deal);
  } catch (error) {
    console.error('Error updating deal:', error);
    res.status(500).json({ error: 'Failed to update deal' });
  }
});

// Get settings
adminRouter.get('/settings', async (req: Request, res: Response) => {
  try {
    // Check MongoDB connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'MongoDB connection failed. Please check your connection string.',
        settings: {}
      });
    }

    const settingsDocs = await Setting.find();
    const settings: any = {};
    settingsDocs.forEach((doc: any) => {
      settings[doc.key] = doc.value;
    });
    res.json(settings);
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch settings',
      message: error.message || 'Database query failed',
      settings: {}
    });
  }
});

// Update settings
adminRouter.put('/settings', async (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;
    await Setting.findOneAndUpdate(
      { key },
      { key, value, updated_at: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get logs
adminRouter.get('/logs', async (req: Request, res: Response) => {
  try {
    // Check MongoDB connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'MongoDB connection failed. Please check your connection string.',
        logs: []
      });
    }

    const { type, limit = 100 } = req.query;
    const query: any = {};
    if (type) {
      query.type = type;
    }
    
    const logs = await Log.find(query)
      .sort({ created_at: -1 })
      .limit(Math.min(parseInt(limit as string) || 100, 1000)); // Cap at 1000
    
    res.json(logs);
  } catch (error: any) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch logs',
      message: error.message || 'Database query failed',
      logs: []
    });
  }
});

// Manual refresh trigger
adminRouter.post('/refresh', async (req: Request, res: Response) => {
  console.log('\n' + '='.repeat(60));
  console.log('🎯 [ADMIN] POST /api/admin/refresh called');
  console.log('='.repeat(60));
  console.log('   - Timestamp:', new Date().toISOString());
  console.log('   - Request IP:', req.ip);
  
  try {
    console.log('   - Creating DataRefreshJob instance...');
    const refreshJob = new DataRefreshJob();
    console.log('   ✅ DataRefreshJob created');
    
    // Trigger refresh and WAIT for it to complete (so we can see errors)
    console.log('   - Calling refreshJob.trigger()...');
    console.log('   ⚠️ Running synchronously to catch errors...');
    
    try {
      await refreshJob.trigger();
      console.log('   ✅ Refresh job completed successfully');
      console.log('='.repeat(60) + '\n');
      
      res.json({ 
        message: 'Refresh job completed', 
        timestamp: new Date(),
        status: 'completed'
      });
    } catch (error: any) {
      console.error('\n' + '='.repeat(60));
      console.error('   ❌ Refresh job failed:', error.message);
      console.error('   - Error stack:', error.stack);
      console.error('='.repeat(60) + '\n');
      
      res.status(500).json({ 
        error: 'Refresh job failed',
        message: error.message,
        timestamp: new Date()
      });
    }
  } catch (error: any) {
    console.error('\n' + '='.repeat(60));
    console.error('   ❌ Error triggering refresh:', error.message);
    console.error('   - Error stack:', error.stack);
    console.error('='.repeat(60) + '\n');
    res.status(500).json({ 
      error: 'Failed to trigger refresh',
      message: error.message 
    });
  }
});
