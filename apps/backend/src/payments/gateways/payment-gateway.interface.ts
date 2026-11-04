/** Abstraction over Algerian card gateways (SATIM for CIB + Edahabia). */
export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export interface GatewayInitResult {
  externalRef: string; // gateway order id
  paymentUrl: string; // hosted page the client is redirected to
}
export interface GatewayConfirmResult {
  success: boolean;
  externalRef: string;
  rawResponse: unknown;
  errorMessage?: string;
}

export interface IPaymentGateway {
  /** Register an order and get a redirect URL (capture for fee, authorize for deposit). */
  initiate(params: {
    orderRef: string;
    amountDA: number;
    intent: 'capture' | 'authorize';
    returnUrl: string;
  }): Promise<GatewayInitResult>;
  /** Verify final status from the gateway callback / polling. */
  confirm(externalRef: string): Promise<GatewayConfirmResult>;
  /** Capture a previously authorized amount (deposit → damage/late fee). */
  capture(externalRef: string, amountDA: number): Promise<GatewayConfirmResult>;
  /** Release a previously authorized hold (clean return). */
  release(externalRef: string): Promise<GatewayConfirmResult>;
  /** Refund a captured amount (cancellation policy). */
  refund(externalRef: string, amountDA: number): Promise<GatewayConfirmResult>;
}
