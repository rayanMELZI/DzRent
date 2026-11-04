'use client';

/**
 * "Ajouter un véhicule" — live create against `POST /vehicles`.
 * New vehicles start in PENDING_INSPECTION: the compliance gate (insurance +
 * visite + GPS) must pass before they can be set AVAILABLE.
 */
import { useState } from 'react';
import { useLang } from '@/lib/i18n';
import { useCreateVehicle } from '@/lib/vehicles';
import { CATEGORIES } from '@/lib/seed';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/Button';
import { Field, inputClass } from '@/components/Field';
import { Icon } from '@/components/Icon';

const FUELS = [
  { id: 'ESSENCE', fr: 'Essence', ar: 'بنزين' },
  { id: 'DIESEL', fr: 'Diesel', ar: 'مازوت' },
  { id: 'GPL', fr: 'GPL', ar: 'غاز' },
  { id: 'HYBRID', fr: 'Hybride', ar: 'هجين' },
] as const;

const TRANSMISSIONS = [
  { id: 'MANUAL', fr: 'Manuelle', ar: 'يدوي' },
  { id: 'AUTOMATIC', fr: 'Automatique', ar: 'أوتوماتيك' },
] as const;

export function AddVehicleModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const { t, lang } = useLang();
  const create = useCreateVehicle();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    make: '',
    model: '',
    year: String(new Date().getFullYear()),
    color: '',
    licensePlate: '',
    chassisNumber: '',
    categorySlug: 'berline',
    fuelType: 'ESSENCE',
    transmission: 'MANUAL',
    dailyRateDA: '',
    depositAmountDA: '',
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const canSubmit =
    form.make.trim() &&
    form.model.trim() &&
    form.color.trim() &&
    /^\d{6}-\d{2}$/.test(form.licensePlate.trim()) &&
    form.chassisNumber.trim().length >= 5;

  const submit = () => {
    setError(null);
    create.mutate(
      {
        make: form.make.trim(),
        model: form.model.trim(),
        year: Number(form.year) || new Date().getFullYear(),
        color: form.color.trim(),
        licensePlate: form.licensePlate.trim(),
        chassisNumber: form.chassisNumber.trim(),
        categorySlug: form.categorySlug,
        fuelType: form.fuelType,
        transmission: form.transmission,
        ...(form.dailyRateDA && { dailyRateDA: Number(form.dailyRateDA) }),
        ...(form.depositAmountDA && { depositAmountDA: Number(form.depositAmountDA) }),
      },
      {
        onSuccess: onAdded,
        onError: (err) => setError(err instanceof ApiError ? err.message : t('common_save_error')),
      },
    );
  };

  const seg = (
    options: readonly { id: string; fr: string; ar: string }[],
    value: string,
    onPick: (v: string) => void,
  ) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onPick(o.id)}
          className={`rounded-r2 px-3 py-2 text-[13px] font-semibold ${
            value === o.id ? 'bg-primary text-white' : 'bg-sand text-ink-2 hover:text-ink'
          }`}
        >
          {o[lang]}
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[300] grid place-items-center">
      <div className="dz-pop absolute inset-0 bg-[rgba(20,24,22,.5)]" onClick={onClose} />
      <div className="dz-pop relative max-h-[90vh] w-[520px] overflow-y-auto rounded-r3 bg-paper p-6 shadow-card">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-r2 bg-primary-soft">
            <Icon name="fleet" size={20} stroke="#0B3F38" />
          </div>
          <h3 className="dz-h2 text-ink">{t('fleet_add')}</h3>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <Field label={lang === 'ar' ? 'الماركة' : 'Marque'}>
              <input
                value={form.make}
                onChange={(e) => set('make')(e.target.value)}
                className={inputClass}
                placeholder="Hyundai"
                autoFocus
              />
            </Field>
            <Field label={lang === 'ar' ? 'الطراز' : 'Modèle'}>
              <input
                value={form.model}
                onChange={(e) => set('model')(e.target.value)}
                className={inputClass}
                placeholder="Tucson"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={lang === 'ar' ? 'السنة' : 'Année'}>
              <input
                value={form.year}
                onChange={(e) => set('year')(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className={`${inputClass} dz-mono`}
                inputMode="numeric"
              />
            </Field>
            <Field label={lang === 'ar' ? 'اللون' : 'Couleur'}>
              <input
                value={form.color}
                onChange={(e) => set('color')(e.target.value)}
                className={inputClass}
                placeholder={lang === 'ar' ? 'أبيض' : 'Blanc'}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('fleet_plate')} hint="NNNNNN-WW">
              <input
                value={form.licensePlate}
                onChange={(e) => set('licensePlate')(e.target.value)}
                className={`${inputClass} dz-mono`}
                placeholder="123456-16"
                dir="ltr"
              />
            </Field>
            <Field label={lang === 'ar' ? 'رقم الهيكل (VIN)' : 'N° de châssis (VIN)'}>
              <input
                value={form.chassisNumber}
                onChange={(e) => set('chassisNumber')(e.target.value)}
                className={`${inputClass} dz-mono`}
                dir="ltr"
              />
            </Field>
          </div>

          <Field label={lang === 'ar' ? 'الفئة' : 'Catégorie'}>
            {seg(CATEGORIES, form.categorySlug, set('categorySlug'))}
          </Field>
          <Field label={lang === 'ar' ? 'الوقود' : 'Carburant'}>
            {seg(FUELS, form.fuelType, set('fuelType'))}
          </Field>
          <Field label={lang === 'ar' ? 'ناقل الحركة' : 'Boîte'}>
            {seg(TRANSMISSIONS, form.transmission, set('transmission'))}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={lang === 'ar' ? 'السعر اليومي (دج)' : 'Tarif/jour (DZD)'}>
              <input
                value={form.dailyRateDA}
                onChange={(e) => set('dailyRateDA')(e.target.value.replace(/\D/g, ''))}
                className={`${inputClass} dz-mono`}
                inputMode="numeric"
                placeholder="8000"
              />
            </Field>
            <Field label={lang === 'ar' ? 'الضمان (دج)' : 'Caution (DZD)'}>
              <input
                value={form.depositAmountDA}
                onChange={(e) => set('depositAmountDA')(e.target.value.replace(/\D/g, ''))}
                className={`${inputClass} dz-mono`}
                inputMode="numeric"
                placeholder="45000"
              />
            </Field>
          </div>

          <p className="dz-xs m-0 text-ink-4">
            {lang === 'ar'
              ? 'يُضاف المركبة بحالة "فحص" حتى استكمال وثائق المطابقة (تأمين + فحص تقني + GPS).'
              : 'Le véhicule est créé en statut « Inspection » jusqu’à la conformité (assurance + visite + GPS).'}
          </p>

          {error && <p className="dz-sm m-0 text-status-refused-ink">{error}</p>}
        </div>

        <div className="mt-5 flex gap-2.5">
          <Button
            variant="ghost"
            full
            onClick={onClose}
            className="shadow-[inset_0_0_0_1px_#DDD7CA]"
          >
            {t('common_cancel')}
          </Button>
          <Button
            variant="primary"
            full
            icon="plus"
            onClick={submit}
            disabled={!canSubmit || create.isPending}
          >
            {t('fleet_add')}
          </Button>
        </div>
      </div>
    </div>
  );
}
