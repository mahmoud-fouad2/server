import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { AuthRequest } from '../middleware/auth';

const adminService = new AdminService();

export class AdminController {
  async getStats(req: AuthRequest, res: Response) {
    try {
      const stats = await adminService.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Admin Stats Error:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  }

  async getUsers(req: AuthRequest, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const result = await adminService.getUsers(page, limit);
      res.json(result);
    } catch (error) {
      console.error('Admin Users Error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  async getBusinesses(req: AuthRequest, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const result = await adminService.getBusinesses(page, limit);
      res.json(result);
    } catch (error) {
      console.error('Admin Businesses Error:', error);
      res.status(500).json({ error: 'Failed to fetch businesses' });
    }
  }

  async verifyBusiness(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await adminService.verifyBusiness(id);
      res.json({ message: 'Business verified successfully' });
    } catch (error) {
      console.error('Verify Business Error:', error);
      res.status(500).json({ error: 'Failed to verify business' });
    }
  }

  async updateQuota(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { quota } = req.body;
      await adminService.updateQuota(id, quota);
      res.json({ message: 'Quota updated successfully' });
    } catch (error) {
      console.error('Update Quota Error:', error);
      res.status(500).json({ error: 'Failed to update quota' });
    }
  }
}
