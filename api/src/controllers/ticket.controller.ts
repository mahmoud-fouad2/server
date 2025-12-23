import { Request, Response } from 'express';
import { TicketService } from '../services/ticket.service.js';
import { AuthRequest } from '../middleware/auth.js';
import { CreateTicketSchema } from '@fahimo/shared';

const ticketService = new TicketService();

export class TicketController {
  async create(req: AuthRequest, res: Response) {
    try {
      const parseResult = CreateTicketSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: 'Invalid ticket data',
          details: parseResult.error.errors 
        });
      }
      
      const { subject, message, priority } = parseResult.data;
      const userId = req.user!.userId;
      const businessId = req.user!.businessId;

      if (!businessId) {
        return res.status(400).json({ error: 'Business ID required' });
      }

      const ticket = await ticketService.createTicket(userId, businessId, {
        subject,
        message,
        priority,
      });

      res.status(201).json(ticket);
    } catch (error) {
      console.error('Create Ticket Error:', error);
      res.status(500).json({ 
        error: 'Failed to create ticket',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getAll(req: AuthRequest, res: Response) {
    try {
      const businessId = req.user!.businessId;
      if (!businessId) {
        return res.status(400).json({ error: 'Business ID required' });
      }

      const tickets = await ticketService.getTickets(businessId);
      res.json(tickets);
    } catch (error) {
      console.error('Get Tickets Error:', error);
      res.status(500).json({ error: 'Failed to fetch tickets' });
    }
  }

  async getOne(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const businessId = req.user!.businessId;
      if (!businessId) {
        return res.status(400).json({ error: 'Business ID required' });
      }

      const ticket = await ticketService.getTicketById(id, businessId);
      res.json(ticket);
    } catch (error) {
      console.error('Get Ticket Error:', error);
      res.status(404).json({ error: 'Ticket not found' });
    }
  }

  async addMessage(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { message } = req.body;
      const userId = req.user!.userId;

      const newMessage = await ticketService.addMessage(id, userId, message);
      res.status(201).json(newMessage);
    } catch (error) {
      console.error('Add Message Error:', error);
      res.status(500).json({ error: 'Failed to add message' });
    }
  }

  async updateStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updatedTicket = await ticketService.updateStatus(id, status);
      res.json(updatedTicket);
    } catch (error) {
      console.error('Update Status Error:', error);
      res.status(500).json({ error: 'Failed to update status' });
    }
  }
}
