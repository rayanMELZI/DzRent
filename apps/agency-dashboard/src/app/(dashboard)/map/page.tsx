import { SectionStub } from '@/components/SectionStub';

export default function MapPage() {
  return (
    <SectionStub
      icon="map"
      titleKey="dash_nav_map"
      spec="Le seul écran de type outil de dispatch/ops : fond de carte sombre, lignes de routes, geofence en pointillés, pins de véhicules (plaque) colorés par état (ok / excès de vitesse / hors geofence) avec halos pulsés sur violation. Panneau latéral : compteurs actifs/alertes + liste par véhicule avec vitesse en direct."
    />
  );
}
