// data.jsx — DzRent seed data: wilayas, agencies, cars, KYC docs, blacklist.
// All bilingual (fr/ar) where user-facing.

// ---- Wilayas grouped by region (representative subset, real codes) ----
const REGIONS = [
  { id: 'nc', fr: 'Nord Centre', ar: 'الوسط الشمالي', wilayas: [
    { code: '16', fr: 'Alger', ar: 'الجزائر' },
    { code: '09', fr: 'Blida', ar: 'البليدة' },
    { code: '35', fr: 'Boumerdès', ar: 'بومرداس' },
    { code: '42', fr: 'Tipaza', ar: 'تيبازة' },
    { code: '15', fr: 'Tizi Ouzou', ar: 'تيزي وزو' },
    { code: '10', fr: 'Bouira', ar: 'البويرة' },
    { code: '26', fr: 'Médéa', ar: 'المدية' },
  ]},
  { id: 'ne', fr: 'Nord Est', ar: 'الشمال الشرقي', wilayas: [
    { code: '25', fr: 'Constantine', ar: 'قسنطينة' },
    { code: '23', fr: 'Annaba', ar: 'عنابة' },
    { code: '19', fr: 'Sétif', ar: 'سطيف' },
    { code: '06', fr: 'Béjaïa', ar: 'بجاية' },
    { code: '21', fr: 'Skikda', ar: 'سكيكدة' },
    { code: '18', fr: 'Jijel', ar: 'جيجل' },
  ]},
  { id: 'no', fr: 'Nord Ouest', ar: 'الشمال الغربي', wilayas: [
    { code: '31', fr: 'Oran', ar: 'وهران' },
    { code: '13', fr: 'Tlemcen', ar: 'تلمسان' },
    { code: '22', fr: 'Sidi Bel Abbès', ar: 'سيدي بلعباس' },
    { code: '27', fr: 'Mostaganem', ar: 'مستغانم' },
    { code: '29', fr: 'Mascara', ar: 'معسكر' },
  ]},
  { id: 'hp', fr: 'Hauts Plateaux', ar: 'الهضاب العليا', wilayas: [
    { code: '05', fr: 'Batna', ar: 'باتنة' },
    { code: '17', fr: 'Djelfa', ar: 'الجلفة' },
    { code: '14', fr: 'Tiaret', ar: 'تيارت' },
    { code: '28', fr: "M'Sila", ar: 'المسيلة' },
  ]},
  { id: 'gs', fr: 'Grand Sud', ar: 'الجنوب الكبير', wilayas: [
    { code: '11', fr: 'Tamanrasset', ar: 'تمنراست' },
    { code: '30', fr: 'Ouargla', ar: 'ورقلة' },
    { code: '47', fr: 'Ghardaïa', ar: 'غرداية' },
    { code: '01', fr: 'Adrar', ar: 'أدرار' },
    { code: '08', fr: 'Béchar', ar: 'بشار' },
  ]},
];

// ---- Categories ----
const CATEGORIES = [
  { id: 'citadine', fr: 'Citadine', ar: 'حضرية' },
  { id: 'berline', fr: 'Berline', ar: 'صالون' },
  { id: 'suv', fr: 'SUV', ar: 'دفع رباعي' },
  { id: 'utilitaire', fr: 'Utilitaire', ar: 'نفعية' },
  { id: 'minivan', fr: 'Monospace', ar: 'عائلية' },
  { id: 'prestige', fr: 'Prestige', ar: 'فاخرة' },
];

// ---- Cars catalogue (shared across agencies via refs) ----
// price = DZD/day, deposit = refundable DZD
const CARS = [
  { id: 'logan',   fr: 'Dacia Logan',     ar: 'داسيا لوغان',     cat: 'berline',    year: 2022, seats: 5, trans: 'man', fuel: 'diesel', price: 5500,  deposit: 30000 },
  { id: 'sandero', fr: 'Dacia Sandero',   ar: 'داسيا سانديرو',   cat: 'citadine',   year: 2023, seats: 5, trans: 'man', fuel: 'essence',price: 4200,  deposit: 25000 },
  { id: 'i10',     fr: 'Hyundai i10',     ar: 'هيونداي i10',     cat: 'citadine',   year: 2023, seats: 4, trans: 'auto',fuel: 'essence',price: 4500,  deposit: 25000 },
  { id: 'accent',  fr: 'Hyundai Accent',  ar: 'هيونداي أكسنت',   cat: 'berline',    year: 2022, seats: 5, trans: 'auto',fuel: 'essence',price: 6500,  deposit: 35000 },
  { id: 'symbol',  fr: 'Renault Symbol',  ar: 'رينو سامبول',     cat: 'berline',    year: 2021, seats: 5, trans: 'man', fuel: 'essence',price: 5000,  deposit: 30000 },
  { id: 'clio',    fr: 'Renault Clio 5',  ar: 'رينو كليو 5',     cat: 'citadine',   year: 2023, seats: 5, trans: 'man', fuel: 'essence',price: 4800,  deposit: 28000 },
  { id: 'golf',    fr: 'VW Golf 8',       ar: 'فولكس واغن غولف 8',cat: 'berline',   year: 2022, seats: 5, trans: 'auto',fuel: 'essence',price: 8500,  deposit: 50000 },
  { id: 'tucson',  fr: 'Hyundai Tucson',  ar: 'هيونداي توكسون',  cat: 'suv',        year: 2023, seats: 5, trans: 'auto',fuel: 'diesel', price: 11000, deposit: 60000 },
  { id: 'sportage',fr: 'Kia Sportage',    ar: 'كيا سبورتاج',     cat: 'suv',        year: 2022, seats: 5, trans: 'auto',fuel: 'diesel', price: 10500, deposit: 60000 },
  { id: 'duster',  fr: 'Dacia Duster',    ar: 'داسيا دوستر',     cat: 'suv',        year: 2023, seats: 5, trans: 'man', fuel: 'diesel', price: 8000,  deposit: 45000 },
  { id: 'dokker',  fr: 'Dacia Dokker',    ar: 'داسيا دوكر',      cat: 'minivan',    year: 2021, seats: 7, trans: 'man', fuel: 'diesel', price: 6800,  deposit: 38000 },
  { id: 'express', fr: 'Renault Express', ar: 'رينو إكسبرس',     cat: 'utilitaire', year: 2022, seats: 2, trans: 'man', fuel: 'diesel', price: 5800,  deposit: 32000 },
  { id: 'classec', fr: 'Mercedes Classe C',ar: 'مرسيدس الفئة C', cat: 'prestige',   year: 2023, seats: 5, trans: 'auto',fuel: 'essence',price: 18000, deposit: 90000 },
  { id: 'passat',  fr: 'VW Passat',       ar: 'فولكس واغن باسات',cat: 'prestige',   year: 2022, seats: 5, trans: 'auto',fuel: 'diesel', price: 14000, deposit: 75000 },
];
const carById = (id) => CARS.find(c => c.id === id);

const FEATURES = [
  { id: 'ac', fr: 'Climatisation', ar: 'تكييف' },
  { id: 'bt', fr: 'Bluetooth', ar: 'بلوتوث' },
  { id: 'gps', fr: 'GPS intégré', ar: 'نظام تتبع' },
  { id: 'usb', fr: 'USB / Charge', ar: 'منفذ USB' },
  { id: 'abs', fr: 'ABS + Airbags', ar: 'ABS ووسائد هوائية' },
  { id: 'cam', fr: 'Caméra de recul', ar: 'كاميرا خلفية' },
];

// ---- Agencies (in Alger for the demo flow) ----
const AGENCIES = [
  {
    id: 'sahara', fr: 'Sahara Auto Location', ar: 'الصحراء لكراء السيارات',
    verified: true, verifiedOn: '12 mars 2026', rating: 4.8, reviews: 213,
    commune: { fr: 'Hydra, Alger', ar: 'حيدرة، الجزائر' }, distanceKm: 2.4,
    responseTime: { fr: 'Répond < 1h', ar: 'يرد خلال أقل من ساعة' }, completed: 1240,
    cars: ['logan','accent','tucson','golf','classec','sandero'],
  },
  {
    id: 'atlas', fr: 'Atlas Cars', ar: 'أطلس للسيارات',
    verified: true, verifiedOn: '04 févr. 2026', rating: 4.6, reviews: 158,
    commune: { fr: 'Bab Ezzouar, Alger', ar: 'باب الزوار، الجزائر' }, distanceKm: 8.1,
    responseTime: { fr: 'Répond < 2h', ar: 'يرد خلال أقل من ساعتين' }, completed: 870,
    cars: ['sandero','i10','symbol','duster','dokker','sportage'],
  },
  {
    id: 'medina', fr: 'Medina Rent', ar: 'المدينة لكراء',
    verified: true, verifiedOn: '21 janv. 2026', rating: 4.9, reviews: 302,
    commune: { fr: 'El Biar, Alger', ar: 'الأبيار، الجزائر' }, distanceKm: 3.7,
    responseTime: { fr: 'Répond < 1h', ar: 'يرد خلال أقل من ساعة' }, completed: 1610,
    cars: ['clio','accent','passat','tucson','golf','logan'],
  },
  {
    id: 'baraka', fr: 'El Baraka Auto', ar: 'البركة أوتو',
    verified: false, verifiedOn: null, rating: 4.2, reviews: 41,
    commune: { fr: 'Kouba, Alger', ar: 'القبة، الجزائر' }, distanceKm: 5.5,
    responseTime: { fr: 'Répond < 4h', ar: 'يرد خلال أقل من 4 ساعات' }, completed: 190,
    cars: ['symbol','sandero','express','dokker'],
  },
  {
    id: 'phoenix', fr: 'Phoenix Location', ar: 'فينيكس لكراء',
    verified: true, verifiedOn: '28 déc. 2025', rating: 4.5, reviews: 127,
    commune: { fr: 'Chéraga, Alger', ar: 'الشراقة، الجزائر' }, distanceKm: 11.2,
    responseTime: { fr: 'Répond < 3h', ar: 'يرد خلال أقل من 3 ساعات' }, completed: 540,
    cars: ['i10','clio','duster','sportage','passat'],
  },
];
const agencyById = (id) => AGENCIES.find(a => a.id === id);

// ---- KYC document types ----
const KYC_DOCS = [
  { id: 'cin', fr: 'Carte d\'identité (CIN)', ar: 'بطاقة التعريف الوطنية',
    why: { fr: 'Confirme votre identité légale auprès de l\'agence.', ar: 'تؤكد هويتك القانونية لدى الوكالة.' } },
  { id: 'permis', fr: 'Permis de conduire', ar: 'رخصة السياقة',
    why: { fr: 'Obligatoire pour conduire — l\'agence vérifie sa validité.', ar: 'إلزامية للقيادة — تتحقق الوكالة من صلاحيتها.' } },
  { id: 'selfie', fr: 'Selfie (vérification du visage)', ar: 'صورة شخصية (تحقق الوجه)',
    why: { fr: 'Empêche l\'usurpation : votre visage doit correspondre à la CIN.', ar: 'يمنع انتحال الهوية: يجب أن يطابق وجهك البطاقة.' } },
  { id: 'domicile', fr: 'Justificatif de domicile', ar: 'إثبات الإقامة',
    why: { fr: 'Facture ou attestation de moins de 3 mois.', ar: 'فاتورة أو شهادة أقل من 3 أشهر.' } },
];

// ---- Blacklist (inter-agency, shared) ----
const BLACKLIST_REASONS = [
  { id: 'non_return', fr: 'Non-retour du véhicule', ar: 'عدم إرجاع المركبة', sev: 'high' },
  { id: 'doc_fraud', fr: 'Fraude documentaire', ar: 'تزوير الوثائق', sev: 'high' },
  { id: 'payment', fr: 'Défaut de paiement', ar: 'تخلف عن الدفع', sev: 'mid' },
  { id: 'damage', fr: 'Dommages non déclarés', ar: 'أضرار غير مصرح بها', sev: 'mid' },
];

const SEED_BLACKLIST = [
  { id: 'bl1', initials: 'KB', name: 'K. Benali', phone: '+213 6•• •• •• 41', reason: 'non_return', addedBy: 'Atlas Cars', date: '02 juin 2026', wilaya: 'Oran' },
  { id: 'bl2', initials: 'MS', name: 'M. Saïdi', phone: '+213 5•• •• •• 09', reason: 'doc_fraud', addedBy: 'Medina Rent', date: '18 mai 2026', wilaya: 'Alger' },
  { id: 'bl3', initials: 'AT', name: 'A. Toumi', phone: '+213 7•• •• •• 77', reason: 'payment', addedBy: 'Phoenix Location', date: '29 avr. 2026', wilaya: 'Constantine' },
];

// ---- Pre-seeded agency-side requests (so the queue isn't empty) ----
const SEED_REQUESTS = [
  {
    id: 'req-seed-1', status: 'pending', createdAt: 'il y a 22 min',
    customer: { name: 'Yacine Cherif', phone: '+213 661 24 88 03', initials: 'YC', joined: 'avr. 2026', rentals: 3,
      kyc: { cin: 'approved', permis: 'approved', selfie: 'approved', domicile: 'pending' }, blacklisted: false, riskFlags: [] },
    car: 'tucson', agency: 'sahara', from: '28 juin', to: '02 juil.', days: 4, total: 44000, deposit: 60000,
  },
  {
    id: 'req-seed-2', status: 'pending', createdAt: 'il y a 1 h', flagged: true,
    customer: { name: 'Riad Mansouri', phone: '+213 770 11 52 19', initials: 'RM', joined: 'juin 2026', rentals: 0,
      kyc: { cin: 'approved', permis: 'pending', selfie: 'refused', domicile: 'none' }, blacklisted: false,
      riskFlags: [ { fr: 'Selfie ne correspond pas à la CIN', ar: 'الصورة لا تطابق البطاقة' }, { fr: 'Compte créé aujourd\'hui', ar: 'حساب أُنشئ اليوم' } ] },
    car: 'classec', agency: 'sahara', from: '27 juin', to: '30 juin', days: 3, total: 54000, deposit: 90000,
  },
  {
    id: 'req-seed-3', status: 'approved', createdAt: 'hier', 
    customer: { name: 'Lina Hadj', phone: '+213 555 90 14 76', initials: 'LH', joined: 'janv. 2026', rentals: 7,
      kyc: { cin: 'approved', permis: 'approved', selfie: 'approved', domicile: 'approved' }, blacklisted: false, riskFlags: [] },
    car: 'golf', agency: 'sahara', from: '25 juin', to: '28 juin', days: 3, total: 25500, deposit: 50000,
  },
];

Object.assign(window, {
  REGIONS, CATEGORIES, CARS, carById, FEATURES, AGENCIES, agencyById,
  KYC_DOCS, BLACKLIST_REASONS, SEED_BLACKLIST, SEED_REQUESTS,
});
