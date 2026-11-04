import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  GatewayConfirmResult,
  GatewayInitResult,
  IPaymentGateway,
} from './payment-gateway.interface';

/**
 * MockGateway — default in non-production. Simulates a SATIM-style flow without
 * any real money. initiate() returns a fake hosted-page URL; confirm() always
 * succeeds. Lets the whole booking→payment→contract pipeline run end-to-end in dev.
 */
@Injectable()
export class MockGateway implements IPaymentGateway {
  private readonly logger = new Logger(MockGateway.name);

  async initiate(p: {
    orderRef: string;
    amountDA: number;
    intent: 'capture' | 'authorize';
    returnUrl: string;
  }): Promise<GatewayInitResult> {
    const externalRef = `MOCK-${randomUUID()}`;
    this.logger.warn(
      `[MOCK PAY] ${p.intent} ${p.amountDA} DA order=${p.orderRef} ref=${externalRef}`,
    );
    return { externalRef, paymentUrl: `${p.returnUrl}?mockRef=${externalRef}&status=success` };
  }
  async confirm(externalRef: string): Promise<GatewayConfirmResult> {
    return { success: true, externalRef, rawResponse: { mock: true, status: 'CAPTURED' } };
  }
  async capture(externalRef: string, amountDA: number): Promise<GatewayConfirmResult> {
    this.logger.warn(`[MOCK PAY] capture ${amountDA} DA ref=${externalRef}`);
    return { success: true, externalRef, rawResponse: { mock: true, captured: amountDA } };
  }
  async release(externalRef: string): Promise<GatewayConfirmResult> {
    this.logger.warn(`[MOCK PAY] release ref=${externalRef}`);
    return { success: true, externalRef, rawResponse: { mock: true, released: true } };
  }
  async refund(externalRef: string, amountDA: number): Promise<GatewayConfirmResult> {
    this.logger.warn(`[MOCK PAY] refund ${amountDA} DA ref=${externalRef}`);
    return { success: true, externalRef, rawResponse: { mock: true, refunded: amountDA } };
  }
}
