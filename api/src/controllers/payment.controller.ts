import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service.js';

const paymentService = new PaymentService();

export class PaymentController {
  
  async list(req: Request, res: Response) {
    try {
      // @ts-ignore
      const businessId = req.user.businessId;
      const payments = await paymentService.getPayments(businessId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch payments' });
    }
  }

  async createIntent(req: Request, res: Response) {
    try {
      // @ts-ignore
      const businessId = req.user.businessId;
      const { amount, currency } = req.body;
      const intent = await paymentService.createPaymentIntent(businessId, amount, currency);
      res.json(intent);
    } catch (error) {
      res.status(400).json({ error: 'Failed to create payment intent' });
    }
  }
}
