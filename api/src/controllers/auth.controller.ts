import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { LoginSchema, RegisterSchema } from '../shared_local/index.js';

const authService = new AuthService();

export class AuthController {
  
  async register(req: Request, res: Response) {
    try {
      const data = RegisterSchema.parse(req.body);
      const result = await authService.register(data);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Registration failed' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const data = LoginSchema.parse(req.body);
      const result = await authService.login(data);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message || 'Login failed' });
    }
  }

  async me(req: Request, res: Response) {
    // @ts-ignore
    res.json({ user: req.user });
  }
}
