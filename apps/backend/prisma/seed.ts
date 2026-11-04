/**
 * DzRent – Prisma Seed Script
 *
 * Run with:  npx prisma db seed
 *            (or: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts)
 *
 * ── package.json integration ──────────────────────────────────────────────────
 * Add the following to your package.json so `pnpm db:seed` works as a shortcut,
 * and so `prisma migrate reset` triggers the seed automatically:
 *
 *   "scripts": {
 *     "db:seed": "prisma db seed"
 *   },
 *   "prisma": {
 *     "seed": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts"
 *   }
 *
 * With this in place:
 *   pnpm db:seed                — runs the seed directly
 *   npx prisma migrate reset    — applies migrations then auto-runs the seed
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Idempotent: uses upsert throughout — safe to re-run at any time.
 *
 * Seeding order (respects FK constraints):
 *   1. Wilayas             (no FKs)
 *   2. VehicleCategories   (no FKs)
 *   3. LegalClauses        (no FKs)
 *   4. PlatformConfig      (no FKs)
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

// ─────────────────────────────────────────────────────────────
// 1. WILAYAS — All 58 Algerian administrative wilayas
//    Source: Décret exécutif n° 19-204 (nouvelle carte administrative)
//    Coordinates: approximate wilaya capital centroids (WGS84)
// ─────────────────────────────────────────────────────────────

type WilayaSeed = {
  id: number;
  code: string;
  nameFr: string;
  nameAr: string;
  regionCode: string;
  latitude: number;
  longitude: number;
};

const WILAYAS: WilayaSeed[] = [
  // ── GRAND SUD ────────────────────────────────────────────────
  {
    id: 1,
    code: '01',
    nameFr: 'Adrar',
    nameAr: 'أدرار',
    regionCode: 'GRAND_SUD',
    latitude: 27.8741,
    longitude: -0.2844,
  },
  {
    id: 8,
    code: '08',
    nameFr: 'Béchar',
    nameAr: 'بشار',
    regionCode: 'GRAND_SUD',
    latitude: 31.6167,
    longitude: -2.2167,
  },
  {
    id: 11,
    code: '11',
    nameFr: 'Tamanrasset',
    nameAr: 'تمنراست',
    regionCode: 'GRAND_SUD',
    latitude: 22.7851,
    longitude: 5.5228,
  },
  {
    id: 30,
    code: '30',
    nameFr: 'Ouargla',
    nameAr: 'ورقلة',
    regionCode: 'GRAND_SUD',
    latitude: 31.9505,
    longitude: 5.3242,
  },
  {
    id: 33,
    code: '33',
    nameFr: 'Illizi',
    nameAr: 'إليزي',
    regionCode: 'GRAND_SUD',
    latitude: 26.5081,
    longitude: 8.4728,
  },
  {
    id: 37,
    code: '37',
    nameFr: 'Tindouf',
    nameAr: 'تندوف',
    regionCode: 'GRAND_SUD',
    latitude: 27.6728,
    longitude: -8.1381,
  },
  {
    id: 39,
    code: '39',
    nameFr: 'El Oued',
    nameAr: 'الوادي',
    regionCode: 'GRAND_SUD',
    latitude: 33.3683,
    longitude: 6.8631,
  },
  {
    id: 47,
    code: '47',
    nameFr: 'Ghardaïa',
    nameAr: 'غرداية',
    regionCode: 'GRAND_SUD',
    latitude: 32.4905,
    longitude: 3.6747,
  },
  {
    id: 49,
    code: '49',
    nameFr: 'Timimoun',
    nameAr: 'تيميمون',
    regionCode: 'GRAND_SUD',
    latitude: 29.2639,
    longitude: 0.2303,
  },
  {
    id: 50,
    code: '50',
    nameFr: 'Bordj Badji Mokhtar',
    nameAr: 'برج باجي مختار',
    regionCode: 'GRAND_SUD',
    latitude: 21.3294,
    longitude: 0.9522,
  },
  {
    id: 52,
    code: '52',
    nameFr: 'Béni Abbès',
    nameAr: 'بني عباس',
    regionCode: 'GRAND_SUD',
    latitude: 30.1319,
    longitude: -2.1661,
  },
  {
    id: 53,
    code: '53',
    nameFr: 'In Salah',
    nameAr: 'عين صالح',
    regionCode: 'GRAND_SUD',
    latitude: 27.1961,
    longitude: 2.4622,
  },
  {
    id: 54,
    code: '54',
    nameFr: 'In Guezzam',
    nameAr: 'عين قزام',
    regionCode: 'GRAND_SUD',
    latitude: 19.5694,
    longitude: 5.7728,
  },
  {
    id: 55,
    code: '55',
    nameFr: 'Touggourt',
    nameAr: 'تقرت',
    regionCode: 'GRAND_SUD',
    latitude: 33.0994,
    longitude: 6.0603,
  },
  {
    id: 56,
    code: '56',
    nameFr: 'Djanet',
    nameAr: 'جانت',
    regionCode: 'GRAND_SUD',
    latitude: 24.5531,
    longitude: 9.4853,
  },
  {
    id: 57,
    code: '57',
    nameFr: "El M'Ghair",
    nameAr: 'المغير',
    regionCode: 'GRAND_SUD',
    latitude: 33.9514,
    longitude: 5.9228,
  },
  {
    id: 58,
    code: '58',
    nameFr: 'El Meniaa',
    nameAr: 'المنيعة',
    regionCode: 'GRAND_SUD',
    latitude: 30.5872,
    longitude: 2.8817,
  },

  // ── HAUTS PLATEAUX ───────────────────────────────────────────
  {
    id: 3,
    code: '03',
    nameFr: 'Laghouat',
    nameAr: 'الأغواط',
    regionCode: 'HAUTS_PLATEAUX',
    latitude: 33.8,
    longitude: 2.865,
  },
  {
    id: 7,
    code: '07',
    nameFr: 'Biskra',
    nameAr: 'بسكرة',
    regionCode: 'HAUTS_PLATEAUX',
    latitude: 34.8497,
    longitude: 5.7281,
  },
  {
    id: 14,
    code: '14',
    nameFr: 'Tiaret',
    nameAr: 'تيارت',
    regionCode: 'HAUTS_PLATEAUX',
    latitude: 35.3706,
    longitude: 1.3217,
  },
  {
    id: 17,
    code: '17',
    nameFr: 'Djelfa',
    nameAr: 'الجلفة',
    regionCode: 'HAUTS_PLATEAUX',
    latitude: 34.675,
    longitude: 3.2631,
  },
  {
    id: 20,
    code: '20',
    nameFr: 'Saïda',
    nameAr: 'سعيدة',
    regionCode: 'HAUTS_PLATEAUX',
    latitude: 34.8333,
    longitude: 0.15,
  },
  {
    id: 28,
    code: '28',
    nameFr: "M'Sila",
    nameAr: 'المسيلة',
    regionCode: 'HAUTS_PLATEAUX',
    latitude: 35.7056,
    longitude: 4.5378,
  },
  {
    id: 32,
    code: '32',
    nameFr: 'El Bayadh',
    nameAr: 'البيض',
    regionCode: 'HAUTS_PLATEAUX',
    latitude: 33.6831,
    longitude: 1.0083,
  },
  {
    id: 38,
    code: '38',
    nameFr: 'Tissemsilt',
    nameAr: 'تيسمسيلت',
    regionCode: 'HAUTS_PLATEAUX',
    latitude: 35.6078,
    longitude: 1.8128,
  },
  {
    id: 45,
    code: '45',
    nameFr: 'Naâma',
    nameAr: 'النعامة',
    regionCode: 'HAUTS_PLATEAUX',
    latitude: 33.2669,
    longitude: -0.3086,
  },
  {
    id: 51,
    code: '51',
    nameFr: 'Ouled Djellal',
    nameAr: 'أولاد جلال',
    regionCode: 'HAUTS_PLATEAUX',
    latitude: 34.4167,
    longitude: 5.0667,
  },

  // ── NORD CENTRE ──────────────────────────────────────────────
  {
    id: 9,
    code: '09',
    nameFr: 'Blida',
    nameAr: 'البليدة',
    regionCode: 'NORD_CENTRE',
    latitude: 36.4694,
    longitude: 2.8278,
  },
  {
    id: 10,
    code: '10',
    nameFr: 'Bouira',
    nameAr: 'البويرة',
    regionCode: 'NORD_CENTRE',
    latitude: 36.3742,
    longitude: 3.9006,
  },
  {
    id: 15,
    code: '15',
    nameFr: 'Tizi Ouzou',
    nameAr: 'تيزي وزو',
    regionCode: 'NORD_CENTRE',
    latitude: 36.7169,
    longitude: 4.0497,
  },
  {
    id: 16,
    code: '16',
    nameFr: 'Alger',
    nameAr: 'الجزائر',
    regionCode: 'NORD_CENTRE',
    latitude: 36.7372,
    longitude: 3.0865,
  },
  {
    id: 26,
    code: '26',
    nameFr: 'Médéa',
    nameAr: 'المدية',
    regionCode: 'NORD_CENTRE',
    latitude: 36.2636,
    longitude: 2.7506,
  },
  {
    id: 35,
    code: '35',
    nameFr: 'Boumerdès',
    nameAr: 'بومرداس',
    regionCode: 'NORD_CENTRE',
    latitude: 36.765,
    longitude: 3.4769,
  },
  {
    id: 42,
    code: '42',
    nameFr: 'Tipaza',
    nameAr: 'تيبازة',
    regionCode: 'NORD_CENTRE',
    latitude: 36.5911,
    longitude: 2.4469,
  },
  {
    id: 44,
    code: '44',
    nameFr: 'Aïn Defla',
    nameAr: 'عين الدفلى',
    regionCode: 'NORD_CENTRE',
    latitude: 36.2639,
    longitude: 1.9669,
  },

  // ── NORD EST ─────────────────────────────────────────────────
  {
    id: 4,
    code: '04',
    nameFr: 'Oum El Bouaghi',
    nameAr: 'أم البواقي',
    regionCode: 'NORD_EST',
    latitude: 35.8758,
    longitude: 7.1131,
  },
  {
    id: 5,
    code: '05',
    nameFr: 'Batna',
    nameAr: 'باتنة',
    regionCode: 'NORD_EST',
    latitude: 35.5558,
    longitude: 6.1742,
  },
  {
    id: 6,
    code: '06',
    nameFr: 'Béjaïa',
    nameAr: 'بجاية',
    regionCode: 'NORD_EST',
    latitude: 36.7508,
    longitude: 5.0567,
  },
  {
    id: 12,
    code: '12',
    nameFr: 'Tébessa',
    nameAr: 'تبسة',
    regionCode: 'NORD_EST',
    latitude: 35.4,
    longitude: 8.1167,
  },
  {
    id: 18,
    code: '18',
    nameFr: 'Jijel',
    nameAr: 'جيجل',
    regionCode: 'NORD_EST',
    latitude: 36.8197,
    longitude: 5.7664,
  },
  {
    id: 19,
    code: '19',
    nameFr: 'Sétif',
    nameAr: 'سطيف',
    regionCode: 'NORD_EST',
    latitude: 36.1908,
    longitude: 5.4103,
  },
  {
    id: 21,
    code: '21',
    nameFr: 'Skikda',
    nameAr: 'سكيكدة',
    regionCode: 'NORD_EST',
    latitude: 36.8764,
    longitude: 6.9067,
  },
  {
    id: 23,
    code: '23',
    nameFr: 'Annaba',
    nameAr: 'عنابة',
    regionCode: 'NORD_EST',
    latitude: 36.9,
    longitude: 7.7667,
  },
  {
    id: 24,
    code: '24',
    nameFr: 'Guelma',
    nameAr: 'قالمة',
    regionCode: 'NORD_EST',
    latitude: 36.4633,
    longitude: 7.4331,
  },
  {
    id: 25,
    code: '25',
    nameFr: 'Constantine',
    nameAr: 'قسنطينة',
    regionCode: 'NORD_EST',
    latitude: 36.365,
    longitude: 6.6147,
  },
  {
    id: 34,
    code: '34',
    nameFr: 'Bordj Bou Arreridj',
    nameAr: 'برج بوعريريج',
    regionCode: 'NORD_EST',
    latitude: 36.0731,
    longitude: 4.7631,
  },
  {
    id: 36,
    code: '36',
    nameFr: 'El Tarf',
    nameAr: 'الطارف',
    regionCode: 'NORD_EST',
    latitude: 36.7672,
    longitude: 8.3131,
  },
  {
    id: 40,
    code: '40',
    nameFr: 'Khenchela',
    nameAr: 'خنشلة',
    regionCode: 'NORD_EST',
    latitude: 35.435,
    longitude: 7.1436,
  },
  {
    id: 41,
    code: '41',
    nameFr: 'Souk Ahras',
    nameAr: 'سوق أهراس',
    regionCode: 'NORD_EST',
    latitude: 36.2864,
    longitude: 7.9508,
  },
  {
    id: 43,
    code: '43',
    nameFr: 'Mila',
    nameAr: 'ميلة',
    regionCode: 'NORD_EST',
    latitude: 36.4489,
    longitude: 6.2636,
  },

  // ── NORD OUEST ───────────────────────────────────────────────
  {
    id: 2,
    code: '02',
    nameFr: 'Chlef',
    nameAr: 'الشلف',
    regionCode: 'NORD_OUEST',
    latitude: 36.1647,
    longitude: 1.3317,
  },
  {
    id: 13,
    code: '13',
    nameFr: 'Tlemcen',
    nameAr: 'تلمسان',
    regionCode: 'NORD_OUEST',
    latitude: 34.8825,
    longitude: -1.3161,
  },
  {
    id: 22,
    code: '22',
    nameFr: 'Sidi Bel Abbès',
    nameAr: 'سيدي بلعباس',
    regionCode: 'NORD_OUEST',
    latitude: 35.1897,
    longitude: -0.6306,
  },
  {
    id: 27,
    code: '27',
    nameFr: 'Mostaganem',
    nameAr: 'مستغانم',
    regionCode: 'NORD_OUEST',
    latitude: 35.9319,
    longitude: 0.0886,
  },
  {
    id: 29,
    code: '29',
    nameFr: 'Mascara',
    nameAr: 'معسكر',
    regionCode: 'NORD_OUEST',
    latitude: 35.3972,
    longitude: 0.1406,
  },
  {
    id: 31,
    code: '31',
    nameFr: 'Oran',
    nameAr: 'وهران',
    regionCode: 'NORD_OUEST',
    latitude: 35.6969,
    longitude: -0.6331,
  },
  {
    id: 46,
    code: '46',
    nameFr: 'Aïn Témouchent',
    nameAr: 'عين تموشنت',
    regionCode: 'NORD_OUEST',
    latitude: 35.2983,
    longitude: -1.1406,
  },
  {
    id: 48,
    code: '48',
    nameFr: 'Relizane',
    nameAr: 'غليزان',
    regionCode: 'NORD_OUEST',
    latitude: 35.7378,
    longitude: 0.5564,
  },
];

// ─────────────────────────────────────────────────────────────
// 2. VEHICLE CATEGORIES
// ─────────────────────────────────────────────────────────────

const VEHICLE_CATEGORIES = [
  {
    slug: 'citadine',
    nameFr: 'Citadine',
    nameAr: 'سيارة المدينة',
    description:
      'Petite voiture idéale pour les déplacements urbains. Économique et facile à garer.',
    iconKey: 'car-city',
    sortOrder: 1,
  },
  {
    slug: 'berline',
    nameFr: 'Berline',
    nameAr: 'سيدان',
    description: 'Berline familiale confortable pour les longs trajets interwilayas.',
    iconKey: 'car-sedan',
    sortOrder: 2,
  },
  {
    slug: 'break',
    nameFr: 'Break / Familiale',
    nameAr: 'سيارة عائلية',
    description: 'Véhicule spacieux avec grand coffre, idéal pour les familles et les voyages.',
    iconKey: 'car-estate',
    sortOrder: 3,
  },
  {
    slug: 'suv',
    nameFr: 'SUV / 4x4',
    nameAr: 'دفع رباعي',
    description: 'Véhicule tout-terrain adapté aux routes du Grand Sud et aux zones rurales.',
    iconKey: 'car-suv',
    sortOrder: 4,
  },
  {
    slug: 'suv-luxe',
    nameFr: 'SUV Luxe',
    nameAr: 'دفع رباعي فاخر',
    description: 'SUV haut de gamme avec équipements premium pour les déplacements professionnels.',
    iconKey: 'car-suv-luxury',
    sortOrder: 5,
  },
  {
    slug: 'utilitaire',
    nameFr: 'Utilitaire',
    nameAr: 'مركبة نفعية',
    description: 'Fourgon ou pick-up pour le transport de marchandises et matériaux.',
    iconKey: 'car-van',
    sortOrder: 6,
  },
  {
    slug: 'minivan',
    nameFr: 'Minivan / Monospace',
    nameAr: 'ميني فان',
    description: 'Grand véhicule pouvant accueillir 7 à 9 passagers, idéal pour les groupes.',
    iconKey: 'car-minivan',
    sortOrder: 7,
  },
  {
    slug: 'prestige',
    nameFr: 'Prestige',
    nameAr: 'سيارة فاخرة',
    description: 'Véhicule de luxe pour événements, mariages, et déplacements VIP.',
    iconKey: 'car-luxury',
    sortOrder: 8,
  },
];

// ─────────────────────────────────────────────────────────────
// 3. LEGAL CLAUSES
//    Algerian car rental contract mandatory and optional clauses.
//    References: Code Civil Algérien, Ordonnance 95-07 (assurances),
//    Loi 04-08 (pratiques commerciales), Décret 85-232 (transport).
// ─────────────────────────────────────────────────────────────

const LEGAL_CLAUSES = [
  // ── MANDATORY CLAUSES ──────────────────────────────────────
  {
    clauseCode: 'dz_late_return_penalty_v1',
    version: '1.0.0',
    isMandatory: true,
    applicableWilayaIds: [] as number[],
    titleFr: 'Pénalités de retard de restitution',
    titleAr: 'غرامات التأخير في إعادة المركبة',
    contentFr: `Le locataire s'engage à restituer le véhicule à la date et à l'heure convenues dans le contrat.
Tout retard de restitution non autorisé préalablement par l'agence sera facturé comme suit :
- Retard inférieur ou égal à 2 heures : facturation d'une demi-journée supplémentaire.
- Retard supérieur à 2 heures et inférieur à 24 heures : facturation d'une journée supplémentaire au tarif journalier en vigueur.
- Retard supérieur à 24 heures : l'agence se réserve le droit de déclarer le véhicule non restitué et de saisir les autorités compétentes.
En cas de retard prévisible, le locataire doit impérativement contacter l'agence au moins 4 heures avant l'heure prévue de restitution.`,
    contentAr: `يلتزم المستأجر بإعادة المركبة في التاريخ والوقت المتفق عليهما في العقد.
يُحتسب كل تأخير في الإعادة لم يُرخَّص به مسبقاً من قِبل الوكالة على النحو التالي:
- تأخير لا يتجاوز ساعتين: فوترة نصف يوم إضافي.
- تأخير يتجاوز ساعتين وأقل من 24 ساعة: فوترة يوم كامل بالتعريفة اليومية المعمول بها.
- تأخير يتجاوز 24 ساعة: يحق للوكالة إعلان المركبة غير مُعادة وإخطار السلطات المختصة.
في حالة التأخير المتوقع، يجب على المستأجر الاتصال بالوكالة قبل 4 ساعات على الأقل من وقت الإعادة المحدد.`,
  },
  {
    clauseCode: 'dz_damage_liability_v1',
    version: '1.0.0',
    isMandatory: true,
    applicableWilayaIds: [] as number[],
    titleFr: 'Responsabilité en cas de dommages',
    titleAr: 'المسؤولية عن الأضرار',
    contentFr: `Le locataire est responsable de tout dommage causé au véhicule pendant la durée de la location, qu'il en soit l'auteur direct ou indirect.
L'état du véhicule est constaté contradictoirement à la prise en charge et à la restitution par un procès-verbal signé des deux parties.
En cas de dommage :
1. Le locataire est tenu de signaler tout incident à l'agence dans les 24 heures.
2. En cas d'accident impliquant un tiers, un constat amiable ou un PV de police est obligatoire.
3. La franchise restant à la charge du locataire est prélevée sur le dépôt de garantie.
4. Si les réparations excèdent le montant du dépôt, le locataire s'engage à régler le solde dans un délai de 15 jours.
Les dommages résultant d'une utilisation non conforme (conduite hors-piste non autorisée, surcharge, conduite sous influence) sont exclus de toute prise en charge par l'assurance.`,
    contentAr: `يكون المستأجر مسؤولاً عن أي ضرر يلحق بالمركبة خلال فترة الإيجار، سواء كان مباشراً أو غير مباشر.
يُثبَّت حالة المركبة باتفاق الطرفين عند التسليم والإعادة بموجب محضر موقَّع من الطرفين.
في حالة وقوع ضرر:
1. يُلزَم المستأجر بإخطار الوكالة بأي حادث خلال 24 ساعة.
2. في حالة الحوادث المتعلقة بطرف ثالث، يُشترط وجود تقرير مشترك للحادث أو محضر شرطة.
3. يُستقطع مبلغ التحمّل الذي يتحمله المستأجر من وديعة الضمان.
4. إذا تجاوزت تكاليف الإصلاح مبلغ الوديعة، يلتزم المستأجر بتسديد الرصيد خلال 15 يوماً.
الأضرار الناجمة عن الاستخدام غير المطابق للعقد مستثناة من أي تغطية تأمينية.`,
  },
  {
    clauseCode: 'dz_security_deposit_v1',
    version: '1.0.0',
    isMandatory: true,
    applicableWilayaIds: [] as number[],
    titleFr: 'Dépôt de garantie (Caution)',
    titleAr: 'وديعة الضمان (الكفالة)',
    contentFr: `Un dépôt de garantie est obligatoirement perçu lors de la prise en charge du véhicule.
Le dépôt est restitué intégralement dans les 5 jours ouvrables suivant la restitution du véhicule en bon état, déduction faite de toute somme due au titre de :
- Carburant manquant
- Pénalités de retard
- Franchises d'assurance
- Dommages non couverts
Le dépôt ne constitue pas un plafond de responsabilité du locataire.`,
    contentAr: `يُستوفى دفع وديعة الضمان إلزامياً عند استلام المركبة.
تُرَدّ الوديعة كاملة في غضون 5 أيام عمل من إعادة المركبة بحالة جيدة، بعد خصم أي مبلغ مستحق بسبب:
- الوقود الناقص
- غرامات التأخير
- التحمّلات التأمينية
- الأضرار غير المشمولة بالتأمين
لا تُعدّ الوديعة حداً أقصى لمسؤولية المستأجر.`,
  },
  {
    clauseCode: 'dz_driver_requirements_v1',
    version: '1.0.0',
    isMandatory: true,
    applicableWilayaIds: [] as number[],
    titleFr: 'Conditions requises pour le conducteur',
    titleAr: 'شروط السائق',
    contentFr: `Pour être autorisé à conduire le véhicule loué, tout conducteur principal ou additionnel doit obligatoirement :
1. Être titulaire d'un permis de conduire valide de catégorie B (minimum), délivré depuis au moins 2 ans.
2. Être âgé d'au moins 21 ans (25 ans pour les catégories SUV Luxe et Prestige).
3. Présenter une Carte Nationale d'Identité (CIN) en cours de validité.
4. Être expressément mentionné dans le contrat de location.
Toute personne non mentionnée au contrat ne peut conduire le véhicule. En cas d'accident impliquant un conducteur non autorisé, les garanties d'assurance sont automatiquement suspendues.`,
    contentAr: `للحصول على إذن قيادة المركبة المستأجرة، يجب على كل سائق رئيسي أو إضافي استيفاء الشروط الإلزامية التالية:
1. حمل رخصة قيادة سارية من الفئة (ب) على الأقل، صادرة منذ سنتين على الأقل.
2. بلوغ 21 سنة على الأقل (25 سنة لفئتي الدفع الرباعي الفاخر والسيارات الفاخرة).
3. تقديم بطاقة التعريف الوطنية (CIN) سارية المفعول.
4. أن يكون مذكوراً صراحةً في عقد الإيجار.
لا يحق لأي شخص غير مذكور في العقد قيادة المركبة.`,
  },
  {
    clauseCode: 'dz_theft_protocol_v1',
    version: '1.0.0',
    isMandatory: true,
    applicableWilayaIds: [] as number[],
    titleFr: 'Protocole en cas de vol du véhicule',
    titleAr: 'إجراءات سرقة المركبة',
    contentFr: `En cas de vol du véhicule, le locataire est tenu de :
1. Déposer immédiatement une plainte auprès de la police ou de la gendarmerie et obtenir une copie du PV.
2. Informer l'agence dans un délai maximum de 4 heures suivant la constatation du vol.
3. Remettre à l'agence l'original du PV de police et les clés du véhicule.
Le non-respect de ces obligations peut entraîner la mise en cause de la responsabilité pleine du locataire pour la valeur totale du véhicule.
Le système de localisation GPS constitue un moyen de preuve contractuellement reconnu.`,
    contentAr: `في حالة سرقة المركبة، يُلزَم المستأجر بما يلي:
1. تقديم بلاغ فوري لدى مصالح الشرطة أو الدرك الوطني والحصول على نسخة من المحضر.
2. إخطار الوكالة في غضون 4 ساعات كحد أقصى من اكتشاف السرقة.
3. تسليم الوكالة أصل محضر الشرطة ومفاتيح المركبة.
عدم الامتثال لهذه الالتزامات قد يُفضي إلى تحميل المستأجر المسؤولية الكاملة.
يُعدّ نظام تحديد المواقع GPS وسيلة إثبات معترفاً بها تعاقدياً.`,
  },

  // ── OPTIONAL CLAUSES ────────────────────────────────────────
  {
    clauseCode: 'dz_cancellation_policy_v1',
    version: '1.0.0',
    isMandatory: false,
    applicableWilayaIds: [] as number[],
    titleFr: "Politique d'annulation",
    titleAr: 'سياسة الإلغاء',
    contentFr: `Les conditions d'annulation sont les suivantes :
- Annulation plus de 48h avant la prise en charge : remboursement intégral, sans frais.
- Annulation entre 24h et 48h : retenue de 25% du montant total.
- Annulation entre 6h et 24h : retenue de 50% du montant total.
- Annulation moins de 6h ou non-présentation (No Show) : aucun remboursement.
Toute annulation doit être notifiée par écrit via l'application DzRent.`,
    contentAr: `شروط الإلغاء كالتالي:
- الإلغاء قبل أكثر من 48 ساعة: استرداد كامل بدون رسوم.
- الإلغاء بين 24 و48 ساعة: خصم 25% من المبلغ الإجمالي.
- الإلغاء بين 6 و24 ساعة: خصم 50% من المبلغ الإجمالي.
- الإلغاء أقل من 6 ساعات أو عدم الحضور: لا يُسترد أي مبلغ.
يجب إشعار الوكالة بأي إلغاء كتابياً عبر تطبيق DzRent.`,
  },
  {
    clauseCode: 'dz_fuel_policy_v1',
    version: '1.0.0',
    isMandatory: false,
    applicableWilayaIds: [] as number[],
    titleFr: 'Politique carburant',
    titleAr: 'سياسة الوقود',
    contentFr: `Le véhicule est remis avec un niveau de carburant indiqué sur le PV de prise en charge.
Le locataire s'engage à restituer le véhicule avec le même niveau de carburant.
Tout carburant manquant sera facturé au tarif Naftal en vigueur, majoré d'un forfait de 500 DA.
ATTENTION : Les véhicules Diesel ne doivent jamais être ravitaillés avec du Sans Plomb.
Une erreur de carburant engage la pleine responsabilité financière du locataire pour les réparations moteur.`,
    contentAr: `تُسلَّم المركبة بمستوى وقود مُحدَّد في محضر الاستلام.
يلتزم المستأجر بإعادة المركبة بنفس مستوى الوقود.
يُفوتَر أي نقص في الوقود بالسعر المعمول به في أقرب محطة نفطال مضافاً إليه رسم خدمة ثابت 500 دج.
تحذير: لا يجوز بأي حال تزويد مركبات الديزل بالبنزين العادي.
يُحمَّل المستأجر المسؤولية المالية الكاملة عن إصلاح المحرك في حالة الخطأ في الوقود.`,
  },
  {
    clauseCode: 'dz_geographic_restriction_v1',
    version: '1.0.0',
    isMandatory: false,
    applicableWilayaIds: [] as number[],
    titleFr: 'Restrictions géographiques',
    titleAr: 'القيود الجغرافية',
    contentFr: `Le véhicule est autorisé à circuler sur le territoire algérien uniquement.
Toute sortie du territoire national est strictement interdite sans autorisation écrite préalable de l'agence.
Pour le Grand Sud (wilayas 1, 8, 11, 30, 33, 37, 47 et wilayas 49-58), un véhicule 4x4 homologué est obligatoire et un dépôt majoré peut être exigé.
Le GPS équipant le véhicule permet de vérifier le respect de ces restrictions. Toute violation entraîne la résiliation immédiate du contrat.`,
    contentAr: `يُرخَّص للمركبة التنقل داخل الأراضي الجزائرية فقط.
يُحظر مطلقاً مغادرة الأراضي الوطنية دون إذن كتابي مسبق من الوكالة.
للجنوب الكبير (ولايات 1، 8، 11، 30، 33، 37، 47 والولايات 49-58) يُشترط استخدام مركبة رباعية الدفع وقد تُطلَب وديعة أعلى.
يُمكّن نظام GPS الوكالةَ من التحقق من الالتزام بهذه القيود. أي مخالفة تستوجب الفسخ الفوري للعقد.`,
  },
  {
    clauseCode: 'dz_insurance_waiver_v1',
    version: '1.0.0',
    isMandatory: false,
    applicableWilayaIds: [] as number[],
    titleFr: "Rachat de franchise d'assurance",
    titleAr: 'التنازل عن التحمّل التأميني',
    contentFr: `Le locataire peut souscrire, moyennant un supplément journalier, à une option de rachat de franchise permettant de réduire sa participation financière en cas de sinistre couvert.
Sont systématiquement exclus du rachat de franchise :
- Les dommages résultant d'une faute intentionnelle ou de négligence grave.
- La conduite sous l'emprise de l'alcool ou de stupéfiants.
- Le non-respect des restrictions géographiques.
- Les dommages aux pneumatiques, jantes et vitres (sauf option spécifique souscrite).`,
    contentAr: `يحق للمستأجر الاشتراك، مقابل رسم يومي إضافي، في خيار التنازل عن التحمّل التأميني.
يُستثنى بصفة منهجية من التنازل عن التحمّل:
- الأضرار الناجمة عن الخطأ المتعمد أو الإهمال الجسيم.
- القيادة تحت تأثير الكحول أو المخدرات.
- مخالفة القيود الجغرافية التعاقدية.
- أضرار الإطارات والجنوط والزجاج (إلا بموجب خيار خاص).`,
  },
  {
    clauseCode: 'dz_additional_driver_v1',
    version: '1.0.0',
    isMandatory: false,
    applicableWilayaIds: [] as number[],
    titleFr: 'Conducteur additionnel',
    titleAr: 'السائق الإضافي',
    contentFr: `Il est possible d'ajouter un ou plusieurs conducteurs additionnels au contrat, moyennant un supplément par conducteur et par jour.
Chaque conducteur additionnel doit satisfaire aux mêmes conditions d'éligibilité que le conducteur principal et être présent lors de la signature du contrat ou avoir validé son identité via l'application DzRent.
Tout conducteur non déclaré est considéré comme non autorisé. En cas d'accident avec un conducteur non déclaré, la totalité des dommages est à la charge du locataire principal sans recours possible à l'assurance.`,
    contentAr: `يمكن إضافة سائق أو أكثر إلى العقد مقابل رسم إضافي لكل سائق ولكل يوم إيجار.
يجب أن يستوفي كل سائق إضافي نفس شروط الأهلية المطلوبة من السائق الرئيسي وأن يكون حاضراً عند توقيع العقد أو قد أكد هويته عبر تطبيق DzRent.
يُعتبر كل سائق غير مصرَّح به سائقاً غير مرخَّص. في حالة حادث مع سائق غير مصرح به، يتحمل المستأجر الرئيسي كامل قيمة الأضرار دون إمكانية الرجوع على التأمين.`,
  },
];

// ─────────────────────────────────────────────────────────────
// 4. PLATFORM CONFIG
// ─────────────────────────────────────────────────────────────

type ConfigEntry = {
  key: string;
  value: Prisma.InputJsonValue;
  description: string;
};

const PLATFORM_CONFIG: ConfigEntry[] = [
  // Commission
  {
    key: 'default_commission_pct',
    value: 8.5,
    description: 'Default DzRent platform commission % on agency revenue. Override per agency.',
  },
  {
    key: 'min_commission_pct',
    value: 5.0,
    description: 'Floor commission % (minimum allowed in any agency override).',
  },
  {
    key: 'max_commission_pct',
    value: 15.0,
    description: 'Ceiling commission % (maximum allowed in any agency override).',
  },

  // OTP / Authentication
  {
    key: 'max_otp_attempts',
    value: 5,
    description: 'Failed OTP attempts before temporary account lockout.',
  },
  {
    key: 'otp_validity_minutes',
    value: 10,
    description: 'Minutes an OTP code remains valid after issuance.',
  },
  {
    key: 'otp_lockout_minutes',
    value: 30,
    description: 'Account lockout duration in minutes after max_otp_attempts is exceeded.',
  },
  {
    key: 'otp_resend_cooldown_seconds',
    value: 60,
    description: 'Minimum seconds between OTP resend requests (rate limiting).',
  },

  // Fraud detection
  {
    key: 'fraud_score_review_threshold',
    value: 50,
    description: 'Risk score flagging user for manual review. Bookings still allowed.',
  },
  {
    key: 'fraud_score_block_threshold',
    value: 75,
    description: 'Risk score at which new booking creation is blocked pending admin review.',
  },
  {
    key: 'fraud_score_ban_threshold',
    value: 90,
    description: 'Risk score at which account is auto-suspended.',
  },
  {
    key: 'max_concurrent_bookings_per_client',
    value: 2,
    description: 'Max ACTIVE bookings per client. Exceeding triggers a fraud signal.',
  },
  {
    key: 'suspicious_booking_window_hours',
    value: 1,
    description: 'Time window (hours) for velocity fraud signal detection.',
  },

  // KYC
  {
    key: 'kyc_expiry_warning_days',
    value: 30,
    description: 'Days before KYC document expiry to send warning notification to client.',
  },
  {
    key: 'kyc_review_sla_hours',
    value: 24,
    description: 'Max hours for admin to review submitted KYC document before escalation.',
  },

  // Deposits & Payments
  {
    key: 'deposit_hold_days',
    value: 7,
    description: 'Max days to hold deposit pre-auth after return before auto-release.',
  },
  {
    key: 'invoice_sequential_start',
    value: 1000,
    description: 'Starting number for per-agency invoice sequential references.',
  },
  {
    key: 'payment_gateway_timeout_seconds',
    value: 30,
    description: 'Max wait in seconds for CIB/Edahabia gateway response.',
  },
  {
    key: 'cash_payment_max_amount_da',
    value: 200000,
    description: 'Max rental amount (DA) settleable in cash. AML policy compliance.',
  },

  // Cancellation policy
  {
    key: 'cancellation_free_hours',
    value: 48,
    description: 'Hours before pickup for free cancellation (full refund).',
  },
  {
    key: 'cancellation_partial_refund_hours',
    value: 24,
    description: 'Cancellation window start for partial refund (hours before pickup).',
  },
  {
    key: 'cancellation_partial_refund_pct',
    value: 75,
    description: 'Refund % in partial-refund window.',
  },
  {
    key: 'cancellation_late_refund_hours',
    value: 6,
    description: 'Cancellation window start for reduced refund (hours before pickup).',
  },
  {
    key: 'cancellation_late_refund_pct',
    value: 50,
    description: 'Refund % in late cancellation window.',
  },
  {
    key: 'cancellation_no_refund_hours',
    value: 6,
    description: 'Cancellations within this many hours before pickup receive zero refund.',
  },

  // GPS & tracking
  {
    key: 'gps_ping_interval_seconds',
    value: 30,
    description: 'Expected GPS tracker ping frequency (seconds) during active rental.',
  },
  {
    key: 'gps_offline_alert_minutes',
    value: 15,
    description: 'Minutes without GPS ping during active rental before dispatcher alert.',
  },
  {
    key: 'gps_speed_threshold_kmh',
    value: 160,
    description: 'Speed (km/h) above which isSpeeding=true and alert is generated.',
  },
  {
    key: 'gps_geofence_radius_km',
    value: 50,
    description:
      'Default geofence radius (km) from rental wilaya centroid. Overridable per booking.',
  },
  {
    key: 'gps_data_retention_months',
    value: 24,
    description: 'GPS log retention months before archival. Enforced by pg_partman in production.',
  },

  // Vehicle compliance alerts
  {
    key: 'insurance_expiry_warning_days',
    value: 30,
    description: 'Days before vehicle insurance expiry to alert agency staff.',
  },
  {
    key: 'visite_technique_warning_days',
    value: 45,
    description: 'Days before visite technique expiry to alert agency staff.',
  },
  {
    key: 'maintenance_overdue_warning_km',
    value: 500,
    description: 'km overdue beyond nextServiceKm before a maintenance overdue alert fires.',
  },

  // Agency onboarding
  {
    key: 'agency_verification_sla_days',
    value: 3,
    description: 'Business days for DzRent admin to review agency onboarding documents.',
  },
  {
    key: 'min_vehicles_for_activation',
    value: 1,
    description: 'Minimum compliant vehicles required before an agency goes live.',
  },

  // Notifications
  {
    key: 'sms_primary_provider',
    value: 'twilio',
    description: 'Primary SMS provider. Options: twilio | ooredoo | mobilis_api.',
  },
  {
    key: 'notification_retry_attempts',
    value: 3,
    description: 'Retry attempts for failed notifications before marking permanently failed.',
  },
  {
    key: 'notification_retry_delay_seconds',
    value: 60,
    description: 'Seconds between notification retries (exponential backoff applied).',
  },

  // Platform
  {
    key: 'maintenance_mode',
    value: false,
    description: 'When true, client-facing endpoints return 503. Admin panel stays accessible.',
  },
  {
    key: 'platform_timezone',
    value: 'Africa/Algiers',
    description: 'Canonical display timezone. All DB storage remains UTC.',
  },
  {
    key: 'supported_locales',
    value: ['fr', 'ar'],
    description: 'Supported UI locales. fr=Français (default), ar=العربية (RTL).',
  },
];

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🔄 Running seed...');
  console.log('\n🌱 DzRent seed started\n');

  // 1. Wilayas
  console.log('⏳ Seeding wilayas…');
  const t1 = Date.now();
  for (const w of WILAYAS) {
    await prisma.wilaya.upsert({
      where: { id: w.id },
      update: {
        code: w.code,
        nameFr: w.nameFr,
        nameAr: w.nameAr,
        regionCode: w.regionCode,
        latitude: w.latitude,
        longitude: w.longitude,
      },
      create: {
        id: w.id,
        code: w.code,
        nameFr: w.nameFr,
        nameAr: w.nameAr,
        regionCode: w.regionCode,
        latitude: w.latitude,
        longitude: w.longitude,
        isActive: true,
      },
    });
  }
  const wilayaCount = await prisma.wilaya.count();
  console.log(`✅ ${wilayaCount} wilayas seeded (${Date.now() - t1}ms)\n`);

  // 2. Vehicle categories
  console.log('⏳ Seeding vehicle categories…');
  const t2 = Date.now();
  for (const c of VEHICLE_CATEGORIES) {
    await prisma.vehicleCategory.upsert({
      where: { slug: c.slug },
      update: {
        nameFr: c.nameFr,
        nameAr: c.nameAr,
        description: c.description,
        iconKey: c.iconKey,
        sortOrder: c.sortOrder,
        isActive: true,
      },
      create: {
        slug: c.slug,
        nameFr: c.nameFr,
        nameAr: c.nameAr,
        description: c.description,
        iconKey: c.iconKey,
        sortOrder: c.sortOrder,
        isActive: true,
      },
    });
  }
  const catCount = await prisma.vehicleCategory.count();
  console.log(`✅ ${catCount} vehicle categories seeded (${Date.now() - t2}ms)\n`);

  // 3. Legal clauses
  console.log('⏳ Seeding legal clauses…');
  const t3 = Date.now();
  for (const cl of LEGAL_CLAUSES) {
    await prisma.legalClause.upsert({
      where: { clauseCode: cl.clauseCode },
      update: {
        version: cl.version,
        isMandatory: cl.isMandatory,
        applicableWilayaIds: cl.applicableWilayaIds,
        titleFr: cl.titleFr,
        titleAr: cl.titleAr,
        contentFr: cl.contentFr,
        contentAr: cl.contentAr,
        isActive: true,
      },
      create: {
        clauseCode: cl.clauseCode,
        version: cl.version,
        isMandatory: cl.isMandatory,
        applicableWilayaIds: cl.applicableWilayaIds,
        titleFr: cl.titleFr,
        titleAr: cl.titleAr,
        contentFr: cl.contentFr,
        contentAr: cl.contentAr,
        isActive: true,
      },
    });
  }
  const clauseCount = await prisma.legalClause.count();
  console.log(`✅ ${clauseCount} legal clauses seeded (${Date.now() - t3}ms)\n`);

  // 4. Platform config
  console.log('⏳ Seeding platform config…');
  const t4 = Date.now();
  for (const cfg of PLATFORM_CONFIG) {
    await prisma.platformConfig.upsert({
      where: { key: cfg.key },
      update: { value: cfg.value, description: cfg.description },
      create: { key: cfg.key, value: cfg.value, description: cfg.description },
    });
  }
  const cfgCount = await prisma.platformConfig.count();
  console.log(`✅ ${cfgCount} platform config keys seeded (${Date.now() - t4}ms)\n`);

  // Summary
  console.log('─────────────────────────────────────────');
  console.log('🎉 DzRent seed completed successfully');
  console.log('─────────────────────────────────────────');
  console.log(`  Wilayas            : ${wilayaCount}`);
  console.log(`  Vehicle categories : ${catCount}`);
  console.log(`  Legal clauses      : ${clauseCount}`);
  console.log(`  Platform config    : ${cfgCount}`);
  console.log('─────────────────────────────────────────\n');
}

main()
  .catch((err: unknown) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
