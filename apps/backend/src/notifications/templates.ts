/**
 * Bilingual SMS template registry. Every template exists in fr + ar
 * (platform rule ⑤: Arabic + French on all user-facing text).
 * Variables use {var} placeholders.
 */
type Tpl = { fr: string; ar: string };

export const SMS_TEMPLATES: Record<string, Tpl> = {
  BOOKING_CREATED_AGENCY: {
    fr: '[DzRent] Nouvelle demande de réservation {bookingRef} — véhicule {plate}, du {from} au {until}. Consultez votre tableau de bord.',
    ar: '[DzRent] طلب حجز جديد {bookingRef} — مركبة {plate}، من {from} إلى {until}. راجع لوحة التحكم.',
  },
  BOOKING_APPROVED: {
    fr: '[DzRent] Votre réservation {bookingRef} est approuvée. Procédez au paiement pour la confirmer.',
    ar: '[DzRent] تمت الموافقة على حجزك {bookingRef}. قم بالدفع لتأكيده.',
  },
  BOOKING_REJECTED: {
    fr: '[DzRent] Votre réservation {bookingRef} a été refusée par l\'agence. Motif: {reason}',
    ar: '[DzRent] تم رفض حجزك {bookingRef} من طرف الوكالة. السبب: {reason}',
  },
  BOOKING_PAID: {
    fr: '[DzRent] Paiement reçu pour {bookingRef}. Votre contrat est prêt à signer dans l\'application.',
    ar: '[DzRent] تم استلام الدفع للحجز {bookingRef}. عقدك جاهز للتوقيع في التطبيق.',
  },
  BOOKING_CANCELLED: {
    fr: '[DzRent] Réservation {bookingRef} annulée. Remboursement: {refundPct}% ({refundDA} DA).',
    ar: '[DzRent] تم إلغاء الحجز {bookingRef}. الاسترداد: {refundPct}% ({refundDA} دج).',
  },
  KYC_APPROVED: {
    fr: '[DzRent] Votre document {docType} a été approuvé. Vous pouvez désormais réserver des véhicules.',
    ar: '[DzRent] تمت الموافقة على وثيقتك {docType}. يمكنك الآن حجز المركبات.',
  },
  KYC_REJECTED: {
    fr: '[DzRent] Votre document {docType} a été refusé. Motif: {reason}. Veuillez le soumettre à nouveau.',
    ar: '[DzRent] تم رفض وثيقتك {docType}. السبب: {reason}. يرجى إعادة إرسالها.',
  },
  AGENCY_VERIFIED: {
    fr: '[DzRent] Félicitations ! Votre agence {agencyName} est vérifiée et active sur DzRent.',
    ar: '[DzRent] تهانينا! وكالتك {agencyName} موثقة ونشطة على DzRent.',
  },
  GEOFENCE_ALERT: {
    fr: '[DzRent] ALERTE: véhicule {plate} hors zone autorisée (réservation {bookingRef}). Position: {lat},{lng}',
    ar: '[DzRent] تنبيه: المركبة {plate} خارج المنطقة المسموح بها (الحجز {bookingRef}). الموقع: {lat},{lng}',
  },
  DEPOSIT_RELEASED: {
    fr: '[DzRent] Votre caution de {amount} DA pour {bookingRef} a été libérée.',
    ar: '[DzRent] تم تحرير وديعتك البالغة {amount} دج للحجز {bookingRef}.',
  },
};

export function renderTemplate(templateId: string, locale: 'fr' | 'ar', vars: Record<string, string | number>): string {
  const tpl = SMS_TEMPLATES[templateId];
  if (!tpl) throw new Error(`Unknown SMS template: ${templateId}`);
  let body = tpl[locale];
  for (const [k, v] of Object.entries(vars)) body = body.split(`{${k}}`).join(String(v));
  return body;
}
