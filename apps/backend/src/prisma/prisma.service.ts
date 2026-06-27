import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

import { getCurrentAgencyContext } from '../common/context/agency-context.store';

/**
 * PrismaService — singleton Prisma client with:
 *
 *  ① Graceful startup/shutdown hooks
 *  ② Development slow-query logger (>100ms warnings)
 *  ③ RLS context middleware (preparation for Sprint 3)
 *  ④ withAgencyContext() helper for explicit transaction-scoped RLS
 *  ⑤ Safe soft-delete helpers
 *
 * ── RLS Architecture (Sprint 2 preparation, Sprint 3 activation) ────────────
 *
 * The $use middleware below reads from AgencyContextStore (AsyncLocalStorage)
 * and is ready to inject SET LOCAL into transactions. It is currently a NO-OP
 * because the DB has no RLS policies yet (those are applied in Sprint 3).
 *
 * When Sprint 3 enables RLS:
 *   1. Run: prisma/migrations/manual/enable_rls.sql
 *   2. Uncomment the SET LOCAL block in the $use middleware below.
 *   3. All queries that touch agency-scoped tables will automatically enforce
 *      isolation at the Postgres layer — zero application code changes needed.
 *
 * ── Singleton pattern ────────────────────────────────────────────────────────
 *
 * NestJS DI ensures one PrismaClient per process.
 * Never instantiate PrismaClient directly in services.
 * Never create multiple PrismaClient instances — each maintains its own
 * connection pool, exhausting Postgres max_connections.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env['NODE_ENV'] === 'development'
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'stdout', level: 'warn' },
              { emit: 'stdout', level: 'error' },
            ]
          : [
              { emit: 'stdout', level: 'warn' },
              { emit: 'stdout', level: 'error' },
            ],
    });

    this.registerMiddleware();
    this.registerSlowQueryLogger();
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('✅ Prisma connected to PostgreSQL');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('🔌 Prisma disconnected (graceful shutdown)');
  }

  // ── RLS Context Middleware ─────────────────────────────────────────────────

  /**
   * Registers the Prisma $use middleware that reads the current request's
   * agency context and (in Sprint 3) sets the Postgres session variable.
   *
   * Structure: read context → if agencyId exists → inject SET LOCAL.
   * The SET LOCAL must be inside the transaction that executes the query.
   *
   * IMPORTANT: $use middleware runs for EVERY query.
   * The SET LOCAL approach only works within an explicit transaction.
   * For single-query requests outside transactions, use withAgencyContext().
   */
  private registerMiddleware(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).$use(async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<unknown>) => {
      const context = getCurrentAgencyContext();

      // ── Sprint 3: Uncomment the block below when RLS policies are live ──
      //
      // if (context?.agencyId) {
      //   // SET LOCAL only persists for the current transaction.
      // await this.$executeRaw`
      //   SELECT set_config('app.current_agency_id', ${context.agencyId}, true)
      // `;
      // }
      //
      // ─────────────────────────────────────────────────────────────────────

      // For now: just pass through. Agency isolation is enforced at
      // application layer via explicit `where: { agencyId }` clauses.
      void context; // suppress unused-variable warning

      return next(params);
    });
  }

  // ── Slow Query Logger ──────────────────────────────────────────────────────

  private registerSlowQueryLogger(): void {
    if (process.env['NODE_ENV'] !== 'development') return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).$on('query', (e: { duration: number; query: string; params: string }) => {
      if (e.duration > 100) {
        this.logger.warn(
          `🐢 Slow query ${e.duration}ms:\n` +
          `   Query: ${e.query}\n` +
          `   Params: ${e.params}`,
        );
      }
    });
  }

  // ── withAgencyContext() ────────────────────────────────────────────────────

  /**
   * Executes `fn` inside a transaction with the Postgres session variable
   * set to `agencyId`. Use this for multi-query operations on agency-scoped
   * data where you need RLS enforcement across all queries in the block.
   *
   * Example (Sprint 3+):
   *   await this.prisma.withAgencyContext(user.agencyId, async (tx: any) => {
   *     const vehicles = await tx.vehicle.findMany();
   *     const bookings = await tx.booking.findMany();
   *     return { vehicles, bookings };
   *   });
   *
   * Currently a thin wrapper around $transaction. The SET LOCAL call
   * inside is commented out until Sprint 3 enables RLS policies.
   */
  async withAgencyContext<T>(
    agencyId: string,
    fn: (tx: Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx: any) => {
      // Sprint 3: uncomment when RLS policies are live
      // await tx.$executeRaw`
      //   SELECT set_config('app.current_agency_id', ${agencyId}, true)
      // `;
      void agencyId;
      return fn(tx as unknown as PrismaService);
    });
  }

  // ── Soft-delete helpers ────────────────────────────────────────────────────

  /**
   * Returns a `where` clause that filters out soft-deleted records.
   * Convenience shorthand — prevents forgetting `deletedAt: null`.
   *
   * Usage:
   *   await this.prisma.user.findMany({ where: this.prisma.notDeleted() })
   */
  notDeleted(): { deletedAt: null } {
    return { deletedAt: null };
  }

  /**
   * Soft-deletes a record by setting `deletedAt` to now.
   * Use this instead of .delete() for any entity with a deletedAt field.
   */
  softDelete(): { deletedAt: Date } {
    return { deletedAt: new Date() };
  }
}
