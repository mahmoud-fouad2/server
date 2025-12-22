import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.get('/me', authenticateToken, authController.me.bind(authController));
router.get('/profile', authenticateToken, authController.profile.bind(authController));
router.patch('/profile', authenticateToken, authController.updateProfile.bind(authController));

export default router;
