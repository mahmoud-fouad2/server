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

  async getFinancialStats(req: AuthRequest, res: Response) {
    try {
      const stats = await adminService.getFinancialStats();
      res.json(stats);
    } catch (error) {
      console.error('Admin Financial Stats Error:', error);
      res.status(500).json({ error: 'Failed to fetch financial stats' });
    }
  }

  async getSystemHealth(req: AuthRequest, res: Response) {
    try {
      const health = await adminService.getSystemHealth();
      res.json(health);
    } catch (error) {
      console.error('Admin Health Error:', error);
      res.status(500).json({ error: 'Failed to fetch system health' });
    }
  }

  async getUsers(req: AuthRequest, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const search = req.query.search as string;
      const result = await adminService.getUsers(page, limit, search);
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
      const status = req.query.status as string;
      const result = await adminService.getBusinesses(page, limit, status);
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

  async suspendBusiness(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await adminService.suspendBusiness(id);
      res.json({ message: 'Business suspended successfully' });
    } catch (error) {
      console.error('Suspend Business Error:', error);
      res.status(500).json({ error: 'Failed to suspend business' });
    }
  }

  async activateBusiness(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await adminService.activateBusiness(id);
      res.json({ message: 'Business activated successfully' });
    } catch (error) {
      console.error('Activate Business Error:', error);
      res.status(500).json({ error: 'Failed to activate business' });
    }
  }

  async deleteBusiness(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await adminService.deleteBusiness(id);
      res.json({ message: 'Business deleted successfully' });
    } catch (error) {
      console.error('Delete Business Error:', error);
      res.status(500).json({ error: 'Failed to delete business' });
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

  async getAuditLogs(req: AuthRequest, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const result = await adminService.getAuditLogs(page, limit);
      res.json(result);
    } catch (error) {
      console.error('Admin Audit Logs Error:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }
}
