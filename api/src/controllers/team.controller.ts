import { Request, Response } from 'express';
import { TeamService } from '../services/team.service.js';
import { AuthRequest } from '../middleware/auth.js';

const teamService = new TeamService();

export class TeamController {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const businessId = req.user!.businessId;
      if (!businessId) {
        return res.status(400).json({ error: 'Business ID required' });
      }

      const employees = await teamService.getEmployees(businessId);
      res.json(employees);
    } catch (error) {
      console.error('Get Employees Error:', error);
      res.status(500).json({ error: 'Failed to fetch employees' });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const businessId = req.user!.businessId;
      if (!businessId) {
        return res.status(400).json({ error: 'Business ID required' });
      }
      
      const { AddTeamMemberSchema } = await import('@fahimo/shared');
      
      // Inject default role if missing
      const payload = {
        ...req.body,
        role: req.body.role || 'EMPLOYEE'
      };

      const { name, email, password, role } = AddTeamMemberSchema.parse(payload);

      const employee = await teamService.addEmployee(businessId, { name, email, password, role });
      res.status(201).json(employee);
    } catch (error: any) {
      console.error('Add Employee Error:', error);
      if (error.message === 'User already exists') {
        return res.status(400).json({ error: 'User already exists' });
      }
      res.status(500).json({ error: 'Failed to add employee' });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const businessId = req.user!.businessId;

      if (!businessId) {
        return res.status(400).json({ error: 'Business ID required' });
      }

      await teamService.removeEmployee(id, businessId);
      res.json({ message: 'Employee removed successfully' });
    } catch (error) {
      console.error('Remove Employee Error:', error);
      res.status(500).json({ error: 'Failed to remove employee' });
    }
  }
}
