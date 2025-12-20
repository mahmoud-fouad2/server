import prisma from '../config/database.js';

export class PaymentService {
  
  async getPayments(businessId: string) {
    return prisma.payment.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createPaymentIntent(businessId: string, amount: number, currency: string) {
    // Stub for Stripe/Paddle integration
    return {
      clientSecret: 'pi_stub_' + Math.random().toString(36).substring(7),
      amount,
      currency
    };
  }
}
