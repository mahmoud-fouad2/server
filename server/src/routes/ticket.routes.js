const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Create a new ticket (Client)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { subject, message, priority } = req.body;
    const businessId = req.user.businessId;
    const userId = req.user.userId;

    if (!businessId) {
      return res.status(400).json({ error: 'Business ID required' });
    }

    const ticket = await prisma.ticket.create({
      data: {
        businessId,
        creatorId: userId,
        subject,
        priority: priority || 'MEDIUM',
        messages: {
          create: {
            senderId: userId,
            message,
            isAdmin: false
          }
        }
      },
      include: {
        messages: true
      }
    });

    // Log creation
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        message: `New ticket created: ${ticket.id} by user ${userId}`,
        context: { ticketId: ticket.id, businessId }
      }
    });

    res.json(ticket);
  } catch (error) {
    console.error('Create Ticket Error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Get all tickets for a business (Client)
router.get('/my-tickets', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const tickets = await prisma.ticket.findMany({
      where: { businessId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { messages: true } }
      }
    });
    res.json(tickets);
  } catch (error) {
    console.error('Get My Tickets Error:', error);
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
        business: { select: { name: true } },
        creator: { select: { name: true, email: true } },
        _count: { select: { messages: true } }
      }
    });
    res.json(tickets);
  } catch (error) {
    console.error('Get All Tickets Error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Get single ticket details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        messages: {
          include: {
            sender: { select: { name: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        business: { select: { name: true } },
        creator: { select: { name: true, email: true } }
      }
    });

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // Access check
    if (req.user.role !== 'SUPERADMIN' && ticket.businessId !== req.user.businessId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Get Ticket Error:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Reply to a ticket
router.post('/:id/reply', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const ticketId = req.params.id;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'SUPERADMIN';

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (!isAdmin && ticket.businessId !== req.user.businessId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const newMessage = await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: userId,
        message,
        isAdmin
      },
      include: {
        sender: { select: { name: true, role: true } }
      }
    });

    // Update ticket status if admin replies
    if (isAdmin && ticket.status === 'OPEN') {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'IN_PROGRESS' }
      });
    }

    // Update ticket status if client replies (re-open if closed?)
    if (!isAdmin && ticket.status === 'RESOLVED') {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'OPEN' }
      });
    }

    res.json(newMessage);
  } catch (error) {
    console.error('Reply Ticket Error:', error);
    res.status(500).json({ error: 'Failed to reply' });
  }
});

// Update ticket status (Admin/Client)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const ticketId = req.params.id;

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (req.user.role !== 'SUPERADMIN' && ticket.businessId !== req.user.businessId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status }
    });

    res.json(updatedTicket);
  } catch (error) {
    console.error('Update Ticket Status Error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
