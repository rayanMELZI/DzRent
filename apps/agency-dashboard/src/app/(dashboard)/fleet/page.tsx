import { SectionStub } from '@/components/SectionStub';

export default function FleetPage() {
  return (
    <SectionStub
      icon="fleet"
      titleKey="fleet_title"
      spec="Filtres de statut avec compteurs (Disponible / Louée / Maintenance / Hors service / Inspection), bascule grille/liste, ajout de véhicule. Chaque véhicule affiche sa plaque (mono) et deux pastilles de conformité (assurance, visite) colorées selon l'échéance."
    />
  );
}
