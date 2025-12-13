const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const prisma = require('../config/database');
const logger = require('../utils/logger');

// Create a new ticket
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { subject, message, priority } = req.body;
    const { businessId } = req.user;

    if (!businessId) {
      return res.status(400).json({ error: 'Business ID not found for user' });
    }

    const ticket = await prisma.ticket.create({
      data: {
        subject,
        priority: priority || 'MEDIUM',
        businessId,
        creatorId: req.user.userId,
        messages: {
          create: {
            message,
            senderId: req.user.userId,
            isAdmin: false
          }
        }
      },
      include: {
        messages: true
      }
    });

    res.status(201).json(ticket);
  } catch (error) {
    logger.error('Create Ticket Error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Get tickets for current user (Client)
router.get('/my-tickets', authenticateToken, async (req, res) => {
  try {
    const { businessId } = req.user;
    
    const tickets = await prisma.ticket.findMany({
      where: { businessId },
      orderBy: { updatedAt: 'desc' },
      include: {
        creator: { select: { name: true, email: true } }
      }
    });

    res.json(tickets);
  } catch (error) {
    logger.error('Get My Tickets Error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Get all tickets (Admin)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const tickets = await prisma.ticket.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        creator: { select: { name: true, email: true } },
        business: { select: { name: true } }
      }
    });

    res.json(tickets);
  } catch (error) {
    logger.error('Get All Tickets Error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Get ticket details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, businessId } = req.user;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        messages: {
          include: { sender: { select: { name: true } } },
          orderBy: { createdAt: 'asc' }
        },
        creator: { select: { name: true, email: true } },
        business: { select: { name: true } }
      }
    });

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // Access Control
    if (role !== 'SUPERADMIN' && ticket.businessId !== businessId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(ticket);
  } catch (error) {
    logger.error('Get Ticket Details Error:', error);
    res.status(500).json({ error: 'Failed to fetch ticket details' });
  }
});

// Reply to ticket
router.post('/:id/reply', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const { userId, role, businessId } = req.user;

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (role !== 'SUPERADMIN' && ticket.businessId !== businessId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const isAdmin = role === 'SUPERADMIN';

    const newMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: userId,
        message,
        isAdmin
      },
      include: { sender: { select: { name: true } } }
    });

    // Update ticket status if needed
    if (isAdmin && ticket.status === 'OPEN') {
      await prisma.ticket.update({ where: { id }, data: { status: 'IN_PROGRESS' } });
    } else if (!isAdmin && ticket.status === 'RESOLVED') {
      await prisma.ticket.update({ where: { id }, data: { status: 'OPEN' } }); // Re-open if client replies
    }
    
    // Always update updatedAt
    await prisma.ticket.update({ where: { id }, data: { updatedAt: new Date() } });

    res.json(newMessage);
  } catch (error) {
    logger.error('Reply Ticket Error:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

// Update ticket status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { role } = req.user;

    // Only admin or the ticket owner (maybe) can close? Let's allow both for now but usually admin manages status
    // For simplicity, allow both if they have access
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (role !== 'SUPERADMIN' && ticket.businessId !== req.user.businessId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: { status }
    });

    res.json(updatedTicket);
  } catch (error) {
    logger.error('Update Status Error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
