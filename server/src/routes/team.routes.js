const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Get all employees for the business
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { businessId } = req.user;
    if (!businessId) return res.status(400).json({ error: 'Business ID required' });

    const employees = await prisma.user.findMany({
      where: { 
        employerId: businessId,
        role: 'AGENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true
      }
    });

    res.json(employees);
  } catch (error) {
    console.error('Get Employees Error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Add new employee
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { businessId } = req.user;
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'AGENT',
        employerId: businessId
      }
    });

    res.json({
      id: newEmployee.id,
      name: newEmployee.name,
      email: newEmployee.email,
      role: newEmployee.role
    });

  } catch (error) {
    console.error('Add Employee Error:', error);
    res.status(500).json({ error: 'Failed to add employee' });
  }
});

// Remove employee
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { businessId } = req.user;
    const { id } = req.params;

    // Verify employee belongs to business
    const employee = await prisma.user.findFirst({
      where: { 
        id, 
        employerId: businessId,
        role: 'AGENT'
      }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await prisma.user.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete Employee Error:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

module.exports = router;
