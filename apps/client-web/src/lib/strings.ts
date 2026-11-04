/**
 * Client-website strings that the shared `@dzrent/i18n` dictionary does not carry
 * (desktop navigation, empty/error states, KYC/booking statuses from the live
 * API). Same `key → { fr, ar }` shape; every key ships in both languages.
 * Shared prototype copy (`otp_*`, `search_*`, `co_*`, …) is used as-is.
 */
import type { LocalizedString } from '@dzrent/i18n';

export const CLIENT_STR = {
  nav_search: { fr: 'Rechercher', ar: 'بحث' },
  nav_login: { fr: 'Se connecter', ar: 'تسجيل الدخول' },
  nav_for_agencies: { fr: 'Espace agences', ar: 'فضاء الوكالات' },
  footer_rights: { fr: 'Tous droits réservés.', ar: 'جميع الحقوق محفوظة.' },
  footer_trust: {
    fr: 'Agences vérifiées (RC/NIF), contrats électroniques, caution remboursable.',
    ar: 'وكالات موثّقة (RC/NIF)، عقود إلكترونية، كفالة قابلة للاسترداد.',
  },

  home_hero: {
    fr: 'Louez une voiture auprès d’agences vérifiées',
    ar: 'استأجر سيارة من وكالات موثّقة',
  },
  home_how: { fr: 'Comment ça marche', ar: 'كيف يعمل' },
  home_step1: { fr: 'Choisissez une wilaya et vos dates', ar: 'اختر الولاية والتواريخ' },
  home_step2: { fr: 'Comparez les agences vérifiées', ar: 'قارن بين الوكالات الموثّقة' },
  home_step3: { fr: 'Réservez — l’agence confirme', ar: 'احجز — الوكالة تؤكّد' },
  home_trust1: { fr: 'Agences vérifiées', ar: 'وكالات موثّقة' },
  home_trust1_sub: {
    fr: 'Registre du commerce et NIF contrôlés par DzRent.',
    ar: 'السجل التجاري ورقم التعريف الجبائي مراقَبان من DzRent.',
  },
  home_trust2: { fr: 'Caution claire', ar: 'كفالة واضحة' },
  home_trust2_sub: {
    fr: 'Toujours affichée à part, jamais ajoutée au total.',
    ar: 'تُعرض دائمًا منفصلة ولا تُضاف إلى المجموع.',
  },
  home_trust3: { fr: 'Identité par téléphone', ar: 'الهوية عبر الهاتف' },
  home_trust3_sub: {
    fr: 'Connexion par code SMS. Pas d’email, pas de mot de passe.',
    ar: 'الدخول برمز SMS. بدون بريد أو كلمة مرور.',
  },

  res_none: {
    fr: 'Aucune agence disponible pour ces critères.',
    ar: 'لا توجد وكالة متاحة لهذه المعايير.',
  },
  res_none_sub: {
    fr: 'Essayez d’autres dates, une autre catégorie ou une wilaya voisine.',
    ar: 'جرّب تواريخ أخرى أو فئة أخرى أو ولاية مجاورة.',
  },
  res_count_one: { fr: 'agence', ar: 'وكالة' },
  res_count_n: { fr: 'agences', ar: 'وكالات' },
  res_all_models: { fr: 'Tous les modèles', ar: 'كل الطرازات' },
  res_from: { fr: 'dès', ar: 'ابتداءً من' },
  res_edit: { fr: 'Modifier la recherche', ar: 'تعديل البحث' },
  res_new: { fr: 'Nouvelle agence', ar: 'وكالة جديدة' },
  res_no_reviews: { fr: 'Pas encore d’avis', ar: 'لا تقييمات بعد' },

  ag_contact: { fr: 'Contact', ar: 'الاتصال' },
  ag_address: { fr: 'Adresse', ar: 'العنوان' },
  ag_period_hint: {
    fr: 'Choisissez vos dates pour voir uniquement les voitures libres.',
    ar: 'اختر تواريخك لرؤية السيارات المتاحة فقط.',
  },

  car_doors: { fr: 'portes', ar: 'أبواب' },
  car_color: { fr: 'Couleur', ar: 'اللون' },
  car_available: { fr: 'Disponible', ar: 'متاحة' },
  car_unavailable: {
    fr: 'Cette voiture n’est pas disponible pour ces dates.',
    ar: 'هذه السيارة غير متاحة لهذه التواريخ.',
  },
  car_pick_dates: { fr: 'Choisissez vos dates', ar: 'اختر تواريخك' },
  car_book_login: { fr: 'Se connecter pour réserver', ar: 'سجّل الدخول للحجز' },
  car_book_send: { fr: 'Envoyer la demande', ar: 'إرسال الطلب' },
  car_book_note: {
    fr: 'Aucun paiement maintenant : l’agence vérifie votre dossier puis confirme.',
    ar: 'لا دفع الآن: الوكالة تتحقق من ملفك ثم تؤكّد.',
  },
  car_options: { fr: 'Options', ar: 'خيارات' },
  car_opt_waiver: { fr: 'Rachat de franchise', ar: 'إعفاء من التحمّل' },
  car_opt_driver: { fr: 'Conducteur additionnel', ar: 'سائق إضافي' },
  car_opt_seat: { fr: 'Siège enfant', ar: 'مقعد طفل' },
  car_opt_gps: { fr: 'Écran GPS', ar: 'شاشة GPS' },
  car_kyc_needed: {
    fr: 'Vos documents (CIN, permis, selfie) doivent être vérifiés avant de réserver.',
    ar: 'يجب التحقق من وثائقك (البطاقة، الرخصة، الصورة) قبل الحجز.',
  },
  car_kyc_go: { fr: 'Compléter mes documents', ar: 'إكمال وثائقي' },
  feature_AC: { fr: 'Climatisation', ar: 'مكيّف' },
  feature_BLUETOOTH: { fr: 'Bluetooth', ar: 'بلوتوث' },
  feature_GPS: { fr: 'GPS', ar: 'GPS' },
  feature_CAMERA: { fr: 'Caméra de recul', ar: 'كاميرا خلفية' },
  feature_SUNROOF: { fr: 'Toit ouvrant', ar: 'سقف قابل للفتح' },
  fuel_ESSENCE: { fr: 'Essence', ar: 'بنزين' },
  fuel_DIESEL: { fr: 'Diesel', ar: 'مازوت' },
  fuel_ELECTRIC: { fr: 'Électrique', ar: 'كهربائية' },
  fuel_HYBRID: { fr: 'Hybride', ar: 'هجينة' },
  fuel_GPL: { fr: 'GPL', ar: 'غاز البترول المميّع' },

  login_new_user: {
    fr: 'Première connexion ? Indiquez votre nom.',
    ar: 'أول دخول؟ أدخل اسمك.',
  },
  login_first: { fr: 'Prénom', ar: 'الاسم' },
  login_last: { fr: 'Nom', ar: 'اللقب' },
  login_agency_account: {
    fr: 'Ce numéro est un compte agence. Utilisez l’espace agences.',
    ar: 'هذا الرقم حساب وكالة. استخدم فضاء الوكالات.',
  },
  login_change_number: { fr: 'Changer de numéro', ar: 'تغيير الرقم' },

  trips_title: { fr: 'Mes réservations', ar: 'حجوزاتي' },
  trips_empty: { fr: 'Aucune réservation pour le moment.', ar: 'لا حجوزات حاليًا.' },
  trips_ref: { fr: 'Réf.', ar: 'المرجع' },
  bk_title: { fr: 'Votre réservation', ar: 'حجزك' },
  bk_cancel: { fr: 'Annuler la demande', ar: 'إلغاء الطلب' },
  bk_cancel_confirm: {
    fr: 'Annuler cette réservation ?',
    ar: 'إلغاء هذا الحجز؟',
  },
  bk_refused_sub: {
    fr: 'L’agence n’a pas pu accepter cette demande. Aucun montant n’a été débité.',
    ar: 'لم تتمكن الوكالة من قبول هذا الطلب. لم يُخصم أي مبلغ.',
  },
  bk_approved_sub: {
    fr: 'L’agence a accepté. Elle vous contacte pour le contrat et le paiement.',
    ar: 'قبلت الوكالة. ستتصل بك بخصوص العقد والدفع.',
  },
  bk_agency_phone: { fr: 'Téléphone de l’agence', ar: 'هاتف الوكالة' },
  bk_live: { fr: 'Mise à jour automatique', ar: 'تحديث تلقائي' },
  bst_PENDING: { fr: 'En attente de l’agence', ar: 'في انتظار الوكالة' },
  bst_APPROVED: { fr: 'Approuvée', ar: 'مقبولة' },
  bst_AWAITING_PAYMENT: { fr: 'Approuvée · paiement à régler', ar: 'مقبولة · الدفع مستحق' },
  bst_PAID: { fr: 'Payée · prête', ar: 'مدفوعة · جاهزة' },
  bst_ACTIVE: { fr: 'Location active', ar: 'كراء نشط' },
  bst_COMPLETED: { fr: 'Terminée', ar: 'منتهية' },
  bst_CANCELLED_CLIENT: { fr: 'Annulée par vous', ar: 'ألغيتها أنت' },
  bst_CANCELLED_AGENCY: { fr: 'Refusée par l’agence', ar: 'رفضتها الوكالة' },
  bst_DISPUTED: { fr: 'Litige en cours', ar: 'نزاع قائم' },
  bst_NO_SHOW: { fr: 'Non présenté', ar: 'لم يحضر' },

  docs_title: { fr: 'Mes documents', ar: 'وثائقي' },
  docs_sub: {
    fr: 'Vérifiés une seule fois, valables pour toutes vos locations.',
    ar: 'يتم التحقق منها مرة واحدة، صالحة لكل عمليات الكراء.',
  },
  docs_eligible: {
    fr: 'Dossier complet — vous pouvez réserver.',
    ar: 'الملف مكتمل — يمكنك الحجز.',
  },
  docs_not_eligible: {
    fr: 'Dossier incomplet — la réservation sera possible après vérification.',
    ar: 'الملف غير مكتمل — يصبح الحجز ممكنًا بعد التحقق.',
  },
  docs_number: { fr: 'Numéro du document (facultatif)', ar: 'رقم الوثيقة (اختياري)' },
  docs_choose: { fr: 'Choisir un fichier', ar: 'اختيار ملف' },
  docs_send: { fr: 'Envoyer', ar: 'إرسال' },
  docs_sent: { fr: 'Document envoyé pour vérification.', ar: 'أُرسلت الوثيقة للتحقق.' },
  docs_formats: { fr: 'JPG, PNG ou PDF · 10 Mo max', ar: 'JPG أو PNG أو PDF · 10 ميغا كحد أقصى' },
  docs_rejected: { fr: 'Motif du refus', ar: 'سبب الرفض' },
  docs_upload_failed: {
    fr: 'L’envoi du fichier a échoué. Réessayez.',
    ar: 'فشل إرسال الملف. أعد المحاولة.',
  },
  kyc_CIN: { fr: 'Carte d’identité (CIN)', ar: 'بطاقة التعريف' },
  kyc_DRIVING_LICENSE: { fr: 'Permis de conduire', ar: 'رخصة السياقة' },
  kyc_SELFIE: { fr: 'Selfie', ar: 'صورة شخصية' },
  kyc_PROOF_OF_ADDRESS: { fr: 'Justificatif de domicile', ar: 'إثبات السكن' },
  kyc_PASSPORT: { fr: 'Passeport', ar: 'جواز السفر' },
  kst_NOT_SUBMITTED: { fr: 'Non envoyé', ar: 'غير مُرسل' },
  kst_PENDING_REVIEW: { fr: 'En vérification', ar: 'قيد التحقق' },
  kst_APPROVED: { fr: 'Vérifié', ar: 'موثّق' },
  kst_REJECTED: { fr: 'Refusé', ar: 'مرفوض' },
  kst_EXPIRED: { fr: 'Expiré', ar: 'منتهي الصلاحية' },

  profile_title: { fr: 'Mon profil', ar: 'ملفي' },
  profile_phone: { fr: 'Téléphone', ar: 'الهاتف' },
  profile_name: { fr: 'Nom', ar: 'الاسم' },
  profile_lang: { fr: 'Langue', ar: 'اللغة' },

  vat: { fr: 'TVA', ar: 'الرسم على القيمة المضافة' },
  err_generic: { fr: 'Une erreur est survenue.', ar: 'حدث خطأ.' },
  err_not_found: { fr: 'Page introuvable.', ar: 'الصفحة غير موجودة.' },
} satisfies Record<string, LocalizedString>;

export type ClientStringKey = keyof typeof CLIENT_STR;
