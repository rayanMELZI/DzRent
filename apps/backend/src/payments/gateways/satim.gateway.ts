import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GatewayConfirmResult, GatewayInitResult, IPaymentGateway } from './payment-gateway.interface';

/**
 * SatimGateway — real Algerian card processing (CIB + Edahabia via SATIM).
 *
 * ── Honest status ─────────────────────────────────────────────────────────────
 * SATIM uses a CardPay/register.do + confirmOrder.do REST flow. The exact
 * endpoints, terminal credentials, and certification are issued by the acquiring
 * bank after merchant onboarding. This class implements the well-documented
 * shape but is NOT production-certified — see PROJECT_STATUS.md. Until SATIM_*
 * env vars are provided AND certification passes, the factory falls back to MockGateway.
 */
@Injectable()
export class SatimGateway implements IPaymentGateway {
  private readonly logger = new Logger(SatimGateway.name);
  private readonly base: string;
  private readonly user: string;
  private readonly pass: string;
  private readonly terminal: string;

  constructor(private readonly config: ConfigService) {
    this.base = config.get<string>('SATIM_BASE_URL', 'https://cib.satim.dz/payment/rest');
    this.user = config.get<string>('SATIM_USERNAME', '');
    this.pass = config.get<string>('SATIM_PASSWORD', '');
    this.terminal = config.get<string>('SATIM_TERMINAL_ID', '');
  }

  private async call(path: string, params: Record<string, string>): Promise<any> {
    const url = new URL(`${this.base}/${path}`);
    Object.entries({ userName: this.user, password: this.pass, ...params }).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { method: 'POST' });
    if (!res.ok) throw new ServiceUnavailableException('SATIM gateway error.');
    return res.json();
  }

  async initiate(p: { orderRef: string; amountDA: number; intent: 'capture' | 'authorize'; returnUrl: string }): Promise<GatewayInitResult> {
    // SATIM amounts are in centimes (DA × 100). register.do for capture; registerPreAuth.do for authorize.
    const endpoint = p.intent === 'authorize' ? 'registerPreAuth.do' : 'register.do';
    const data = await this.call(endpoint, {
      orderNumber: p.orderRef, amount: String(Math.round(p.amountDA * 100)),
      returnUrl: p.returnUrl, currency: '012', // DZD ISO 4217 numeric
    });
    if (!data.orderId) throw new ServiceUnavailableException(data.errorMessage ?? 'SATIM register failed.');
    return { externalRef: data.orderId, paymentUrl: data.formUrl };
  }
  async confirm(externalRef: string): Promise<GatewayConfirmResult> {
    const data = await this.call('confirmOrder.do', { orderId: externalRef });
    const success = data.orderStatus === 2 || data.orderStatus === 1; // 2=captured,1=pre-auth held
    return { success, externalRef, rawResponse: data, errorMessage: success ? undefined : data.errorMessage };
  }
  async capture(externalRef: string, amountDA: number): Promise<GatewayConfirmResult> {
    const data = await this.call('deposit.do', { orderId: externalRef, amount: String(Math.round(amountDA * 100)) });
    return { success: data.errorCode === '0', externalRef, rawResponse: data };
  }
  async release(externalRef: string): Promise<GatewayConfirmResult> {
    const data = await this.call('reverse.do', { orderId: externalRef });
    return { success: data.errorCode === '0', externalRef, rawResponse: data };
  }
  async refund(externalRef: string, amountDA: number): Promise<GatewayConfirmResult> {
    const data = await this.call('refund.do', { orderId: externalRef, amount: String(Math.round(amountDA * 100)) });
    return { success: data.errorCode === '0', externalRef, rawResponse: data };
  }
}
