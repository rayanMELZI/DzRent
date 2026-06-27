import { SectionStub } from '@/components/SectionStub';

export default function BlacklistPage() {
  return (
    <SectionStub
      icon="blacklist"
      titleKey="bl_title"
      spec="Liste noire inter-agences partagée. Recherche, modal « Signaler un client » (nom, téléphone, motif avec sévérité). Lignes : avatar, nom + téléphone, pastille de motif (couleur de sévérité, jeton liste-noire distinct de « refusé »), « Signalé par {agence} · date · wilaya ». Ton sérieux/légal, non punitif."
    />
  );
}
