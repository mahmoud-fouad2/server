import { body, validationResult } from 'express-validator';

export const validateUser = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('name').notEmpty().withMessage('Name is required'),
  body('role').isIn(['SUPERADMIN', 'CLIENT', 'AGENT']).withMessage('Invalid role'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export default { validateUser }; 
