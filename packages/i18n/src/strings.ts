/**
 * DzRent bilingual string dictionary (French primary / Arabic).
 *
 * Ported verbatim from the design handoff (`i18n.jsx`). Both FR and AR copy are
 * final and approved — do not paraphrase. New keys must ship with both languages.
 *
 * The flat `key → { fr, ar }` shape is intentionally framework-agnostic; an app
 * adapter can feed it into i18next, a React context, or server components.
 */

export interface LocalizedString {
  fr: string;
  ar: string;
}

export const STR = {
  // Global / shell
  brand: { fr: 'DzRent', ar: 'DzRent' },
  surface_client: { fr: 'Client', ar: 'الزبون' },
  surface_agency: { fr: 'Agence', ar: 'الوكالة' },
  tagline: { fr: 'Louez en confiance, partout en Algérie', ar: 'استأجر بثقة، في كل الجزائر' },

  // OTP
  otp_title: { fr: 'Votre numéro de téléphone', ar: 'رقم هاتفك' },
  otp_sub: {
    fr: "On vous envoie un code par SMS. Pas d'email, pas de mot de passe.",
    ar: 'نرسل لك رمزًا عبر SMS. بدون بريد أو كلمة مرور.',
  },
  otp_phone_ph: { fr: '05 / 06 / 07 ..', ar: '..05 / 06 / 07' },
  otp_continue: { fr: 'Recevoir le code', ar: 'استلام الرمز' },
  otp_code_title: { fr: 'Entrez le code', ar: 'أدخل الرمز' },
  otp_code_sub: { fr: 'Code à 6 chiffres envoyé au', ar: 'رمز من 6 أرقام أُرسل إلى' },
  otp_resend: { fr: 'Renvoyer le code', ar: 'إعادة إرسال الرمز' },
  otp_verify: { fr: 'Vérifier', ar: 'تحقق' },
  otp_terms: {
    fr: 'En continuant vous acceptez les conditions et la politique de confidentialité.',
    ar: 'بالمتابعة فإنك توافق على الشروط وسياسة الخصوصية.',
  },

  // KYC
  kyc_title: { fr: 'Vérifiez votre identité', ar: 'وثّق هويتك' },
  kyc_sub: {
    fr: 'Les agences louent uniquement à des profils vérifiés. Une seule fois.',
    ar: 'تكري الوكالات فقط للملفات الموثقة. مرة واحدة فقط.',
  },
  kyc_why: { fr: 'Pourquoi ?', ar: 'لماذا؟' },
  kyc_take_photo: { fr: 'Prendre une photo', ar: 'التقاط صورة' },
  kyc_upload: { fr: 'Importer un fichier', ar: 'تحميل ملف' },
  kyc_retake: { fr: 'Reprendre', ar: 'إعادة' },
  kyc_submit: { fr: 'Soumettre pour vérification', ar: 'إرسال للتحقق' },
  kyc_pending_note: {
    fr: "Vos documents sont en cours de vérification par l'agence. Vous pouvez continuer à parcourir.",
    ar: 'وثائقك قيد التحقق من الوكالة. يمكنك متابعة التصفح.',
  },
  kyc_progress: { fr: 'documents sur', ar: 'وثائق من' },
  kyc_skip: { fr: 'Plus tard', ar: 'لاحقًا' },

  // Search / home
  search_greeting: { fr: 'Où louez-vous ?', ar: 'أين تستأجر؟' },
  search_wilaya: { fr: 'Wilaya', ar: 'الولاية' },
  search_wilaya_ph: { fr: 'Choisir une wilaya', ar: 'اختر ولاية' },
  search_wilaya_find: { fr: 'Rechercher une wilaya…', ar: 'ابحث عن ولاية…' },
  search_dates: { fr: 'Dates', ar: 'التواريخ' },
  search_from: { fr: 'Départ', ar: 'الانطلاق' },
  search_to: { fr: 'Retour', ar: 'الإرجاع' },
  search_category: { fr: 'Catégorie', ar: 'الفئة' },
  search_all_cat: { fr: 'Toutes', ar: 'الكل' },
  search_cta: { fr: 'Voir les agences', ar: 'عرض الوكالات' },
  search_recent: { fr: 'Recherche récente', ar: 'بحث أخير' },

  // Results = agencies
  res_title: { fr: 'Agences disponibles', ar: 'الوكالات المتاحة' },
  res_count_a: { fr: 'agences à', ar: 'وكالات في' },
  res_filtered: { fr: 'Agences proposant', ar: 'وكالات تقترح' },
  res_sort: { fr: 'Trier', ar: 'ترتيب' },
  res_verified: { fr: 'Vérifiée', ar: 'موثّقة' },
  res_cars_avail: { fr: 'voitures dispo', ar: 'سيارات متاحة' },
  res_rentals: { fr: 'locations', ar: 'تأجير' },
  res_filter_model: { fr: 'Filtrer par modèle', ar: 'تصفية حسب الطراز' },

  // Agency page
  ag_cars: { fr: 'Ses voitures', ar: 'سياراتها' },
  ag_about: { fr: 'À propos', ar: 'حول' },
  ag_reviews: { fr: 'avis', ar: 'تقييم' },
  ag_verified_on: { fr: 'Vérifiée le', ar: 'موثّقة في' },
  ag_per_day: { fr: '/ jour', ar: '/ يوم' },
  ag_filter: { fr: 'Filtrer', ar: 'تصفية' },
  ag_no_cars: { fr: 'Aucune voiture pour ce filtre.', ar: 'لا توجد سيارة لهذا الفلتر.' },

  // Car detail
  car_specs: { fr: 'Caractéristiques', ar: 'المواصفات' },
  car_features: { fr: 'Équipements', ar: 'التجهيزات' },
  car_seats: { fr: 'places', ar: 'مقاعد' },
  car_trans_man: { fr: 'Manuelle', ar: 'يدوي' },
  car_trans_auto: { fr: 'Automatique', ar: 'أوتوماتيكي' },
  car_fuel_diesel: { fr: 'Diesel', ar: 'ديزل' },
  car_fuel_essence: { fr: 'Essence', ar: 'بنزين' },
  car_year: { fr: 'Année', ar: 'السنة' },
  car_by: { fr: 'Proposée par', ar: 'مقترحة من' },
  car_book: { fr: 'Réserver', ar: 'احجز' },
  car_price_day: { fr: 'par jour', ar: 'في اليوم' },

  // Checkout
  co_title: { fr: 'Récapitulatif', ar: 'الملخص' },
  co_period: { fr: 'Période de location', ar: 'مدة الكراء' },
  co_days: { fr: 'jours', ar: 'أيام' },
  co_addons: { fr: 'Options', ar: 'خيارات' },
  co_addon_seat: { fr: 'Siège enfant', ar: 'مقعد طفل' },
  co_addon_gps: { fr: 'GPS portable', ar: 'GPS محمول' },
  co_addon_driver: { fr: 'Conducteur additionnel', ar: 'سائق إضافي' },
  co_addon_cdw: { fr: 'Rachat de franchise', ar: 'تخفيض التحمل' },
  co_breakdown: { fr: 'Détail du prix', ar: 'تفصيل السعر' },
  co_subtotal: { fr: 'Sous-total location', ar: 'المجموع الفرعي' },
  co_tva: { fr: 'TVA (19%)', ar: 'الرسم (19%)' },
  co_insurance: { fr: 'Assurance', ar: 'التأمين' },
  co_total: { fr: 'Total à payer', ar: 'المجموع للدفع' },
  co_deposit: { fr: 'Caution (bloquée)', ar: 'الضمان (محجوز)' },
  co_deposit_note: {
    fr: 'Remboursée au retour du véhicule, sans dommage.',
    ar: 'تُرجع عند إعادة المركبة دون أضرار.',
  },
  co_deposit_tag: { fr: 'Remboursable', ar: 'قابل للاسترجاع' },
  co_continue: { fr: 'Continuer vers le contrat', ar: 'متابعة نحو العقد' },

  // Contract
  ct_title: { fr: 'Contrat de location', ar: 'عقد الكراء' },
  ct_sub: {
    fr: 'Lisez puis signez. Version bilingue, valeur légale.',
    ar: 'اقرأ ثم وقّع. نسخة ثنائية اللغة، ذات قيمة قانونية.',
  },
  ct_clause1: {
    fr: "Le locataire s'engage à restituer le véhicule à la date convenue, dans son état initial.",
    ar: 'يلتزم المستأجر بإرجاع المركبة في الموعد المتفق عليه وبحالتها الأصلية.',
  },
  ct_clause2: {
    fr: "La caution est libérée après inspection. Tout dommage non couvert par l'assurance en est déduit.",
    ar: 'يُحرر الضمان بعد المعاينة. تُخصم منه أي أضرار غير مغطاة بالتأمين.',
  },
  ct_clause3: {
    fr: "Le kilométrage est illimité en wilaya. Sortie de wilaya à déclarer à l'agence.",
    ar: 'المسافة غير محدودة داخل الولاية. الخروج منها يُصرّح به للوكالة.',
  },
  ct_sign: { fr: 'Signez ci-dessous', ar: 'وقّع أدناه' },
  ct_clear: { fr: 'Effacer', ar: 'مسح' },
  ct_agree: { fr: "J'ai lu et j'accepte le contrat", ar: 'قرأت وأوافق على العقد' },
  ct_continue: { fr: 'Valider et payer', ar: 'تأكيد والدفع' },

  // Payment
  pay_title: { fr: 'Paiement', ar: 'الدفع' },
  pay_sub: { fr: 'Choisissez votre moyen de paiement', ar: 'اختر وسيلة الدفع' },
  pay_cib: { fr: 'Carte CIB', ar: 'بطاقة CIB' },
  pay_edahabia: { fr: 'Carte Edahabia', ar: 'بطاقة الذهبية' },
  pay_cash: { fr: 'Paiement à la prise', ar: 'الدفع عند الاستلام' },
  pay_cash_note: {
    fr: "Réglez en espèces au comptoir de l'agence.",
    ar: 'ادفع نقدًا في مكتب الوكالة.',
  },
  pay_card_num: { fr: 'Numéro de carte', ar: 'رقم البطاقة' },
  pay_card_exp: { fr: 'Expiration', ar: 'الانتهاء' },
  pay_card_cvv: { fr: 'CVV', ar: 'CVV' },
  pay_now: { fr: 'Payer', ar: 'ادفع' },
  pay_confirm_cash: { fr: 'Confirmer la réservation', ar: 'تأكيد الحجز' },
  pay_deposit_hold: { fr: 'Caution bloquée, non débitée', ar: 'الضمان محجوز وغير مخصوم' },

  // Confirmation / active
  cf_sent: { fr: "Demande envoyée à l'agence", ar: 'أُرسل الطلب للوكالة' },
  cf_sent_sub: {
    fr: "L'agence vérifie votre dossier et confirme la réservation. Vous serez notifié.",
    ar: 'تتحقق الوكالة من ملفك وتؤكد الحجز. ستُعلَم.',
  },
  cf_status: { fr: 'Statut de la demande', ar: 'حالة الطلب' },
  cf_pickup: { fr: 'Retrait', ar: 'الاستلام' },
  cf_code: { fr: 'Code de retrait', ar: 'رمز الاستلام' },
  cf_view_contract: { fr: 'Voir le contrat', ar: 'عرض العقد' },
  cf_active: { fr: 'Location active', ar: 'كراء نشط' },
  cf_time_left: { fr: 'Temps restant', ar: 'الوقت المتبقي' },
  cf_your_vehicle: { fr: 'Votre véhicule', ar: 'مركبتك' },
  cf_on_road: { fr: "En cours d'utilisation", ar: 'قيد الاستعمال' },
  cf_home: { fr: 'Accueil', ar: 'الرئيسية' },
  cf_waiting: { fr: "En attente de l'agence", ar: 'بانتظار الوكالة' },
  cf_approved_by: { fr: 'Approuvée par', ar: 'تمت الموافقة من' },

  // Bottom nav
  nav_home: { fr: 'Accueil', ar: 'الرئيسية' },
  nav_trips: { fr: 'Locations', ar: 'الحجوزات' },
  nav_docs: { fr: 'Documents', ar: 'الوثائق' },
  nav_profile: { fr: 'Profil', ar: 'الملف' },

  // Agency dashboard
  dash_nav_home: { fr: 'Tableau de bord', ar: 'لوحة القيادة' },
  dash_nav_fleet: { fr: 'Flotte', ar: 'الأسطول' },
  dash_nav_requests: { fr: 'Demandes', ar: 'الطلبات' },
  dash_nav_blacklist: { fr: 'Liste noire', ar: 'القائمة السوداء' },
  dash_nav_map: { fr: 'Carte GPS', ar: 'خريطة GPS' },
  dash_nav_revenue: { fr: 'Revenus', ar: 'الإيرادات' },
  dash_nav_staff: { fr: 'Équipe', ar: 'الفريق' },
  dash_search: { fr: 'Rechercher…', ar: 'بحث…' },

  kpi_active: { fr: 'Locations actives', ar: 'حجوزات نشطة' },
  kpi_revenue: { fr: 'Revenu (ce mois)', ar: 'الإيراد (هذا الشهر)' },
  kpi_util: { fr: 'Utilisation flotte', ar: 'استغلال الأسطول' },
  kpi_pending: { fr: 'Demandes en attente', ar: 'طلبات معلّقة' },
  dash_alerts: { fr: 'Alertes de conformité', ar: 'تنبيهات المطابقة' },
  dash_alert_ins: { fr: 'Assurance expire dans', ar: 'التأمين ينتهي خلال' },
  dash_alert_tech: { fr: 'Visite technique expire dans', ar: 'الفحص التقني ينتهي خلال' },
  dash_days: { fr: 'jours', ar: 'يوم' },
  dash_recent_req: { fr: 'Dernières demandes', ar: 'آخر الطلبات' },
  dash_view_all: { fr: 'Tout voir', ar: 'عرض الكل' },

  fleet_title: { fr: 'Gestion de flotte', ar: 'إدارة الأسطول' },
  fleet_add: { fr: 'Ajouter un véhicule', ar: 'إضافة مركبة' },
  fleet_st_available: { fr: 'Disponible', ar: 'متاحة' },
  fleet_st_rented: { fr: 'Louée', ar: 'مكراة' },
  fleet_st_maint: { fr: 'Maintenance', ar: 'صيانة' },
  fleet_st_oos: { fr: 'Hors service', ar: 'خارج الخدمة' },
  fleet_st_inspect: { fr: 'Inspection', ar: 'فحص' },
  fleet_compliance: { fr: 'Conformité', ar: 'المطابقة' },
  fleet_plate: { fr: 'Immatriculation', ar: 'الترقيم' },
  fleet_all: { fr: 'Tous', ar: 'الكل' },

  req_title: { fr: 'File des demandes', ar: 'قائمة الطلبات' },
  req_pending: { fr: 'En attente', ar: 'معلّقة' },
  req_approved: { fr: 'Approuvées', ar: 'موافَق عليها' },
  req_refused: { fr: 'Refusées', ar: 'مرفوضة' },
  req_new: { fr: 'Nouvelle', ar: 'جديد' },
  req_kyc_snapshot: { fr: 'Dossier KYC du client', ar: 'ملف التحقق من الزبون' },
  req_approve: { fr: 'Approuver', ar: 'موافقة' },
  req_refuse: { fr: 'Refuser', ar: 'رفض' },
  req_view: { fr: 'Examiner', ar: 'فحص' },
  req_customer: { fr: 'Client', ar: 'الزبون' },
  req_rentals_done: { fr: 'locations effectuées', ar: 'حجوزات سابقة' },
  req_member_since: { fr: 'Membre depuis', ar: 'عضو منذ' },
  req_risk: { fr: 'Signaux de risque', ar: 'إشارات الخطر' },
  req_no_risk: { fr: 'Aucun signal de risque', ar: 'لا إشارات خطر' },
  req_not_bl: { fr: 'Absent de la liste noire', ar: 'غير مدرج في القائمة السوداء' },
  req_empty: { fr: 'Aucune demande ici.', ar: 'لا طلبات هنا.' },
  req_approved_toast: { fr: 'Réservation approuvée', ar: 'تمت الموافقة على الحجز' },
  req_refused_toast: { fr: 'Demande refusée', ar: 'رُفض الطلب' },
  req_period: { fr: 'Période', ar: 'المدة' },

  bl_title: { fr: 'Liste noire inter-agences', ar: 'القائمة السوداء بين الوكالات' },
  bl_sub: {
    fr: 'Partagée entre toutes les agences vérifiées DzRent.',
    ar: 'مشتركة بين كل الوكالات الموثقة في DzRent.',
  },
  bl_add: { fr: 'Signaler un client', ar: 'الإبلاغ عن زبون' },
  bl_reason: { fr: 'Motif', ar: 'السبب' },
  bl_added_by: { fr: 'Signalé par', ar: 'أبلغت عنه' },
  bl_sev_high: { fr: 'Grave', ar: 'خطير' },
  bl_sev_mid: { fr: 'Modéré', ar: 'متوسط' },
  bl_search: { fr: 'Rechercher un nom ou téléphone…', ar: 'ابحث باسم أو هاتف…' },

  // Status labels (shared vocabulary)
  st_approved: { fr: 'Approuvé', ar: 'مقبول' },
  st_verified: { fr: 'Vérifié', ar: 'موثّق' },
  st_pending: { fr: 'En revue', ar: 'قيد المراجعة' },
  st_refused: { fr: 'Refusé', ar: 'مرفوض' },
  st_expiring: { fr: 'Expire bientôt', ar: 'ينتهي قريبًا' },
  st_none: { fr: 'Non soumis', ar: 'غير مُرسل' },
  st_blacklist: { fr: 'Liste noire', ar: 'قائمة سوداء' },

  common_back: { fr: 'Retour', ar: 'رجوع' },
  common_next: { fr: 'Continuer', ar: 'متابعة' },
  common_close: { fr: 'Fermer', ar: 'إغلاق' },
  common_dzd: { fr: 'DZD', ar: 'دج' },
  common_day: { fr: 'jour', ar: 'يوم' },
  common_per_day: { fr: '/jour', ar: '/يوم' },
} satisfies Record<string, LocalizedString>;

export type StringKey = keyof typeof STR;
