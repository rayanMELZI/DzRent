import PDFDocument from 'pdfkit';

/**
 * Renders the rental contract PDF.
 *
 * ── Arabic limitation (honest) ────────────────────────────────────────────────
 * pdfkit's built-in fonts do NOT shape Arabic (no RTL, no ligatures). Proper
 * bilingual output needs an embedded Arabic font (e.g. Amiri) AND a shaping pass
 * (arabic-reshaper + bidi). To keep the build dependency-light, this renderer
 * emits the FRENCH clause text by default and includes Arabic titles only if an
 * Amiri TTF is present at assets/fonts/Amiri-Regular.ttf. See PROJECT_STATUS.md.
 */
interface Args {
  contractRef: string;
  booking: any;
  clauses: { clauseCode: string; titleFr: string; titleAr: string; contentFr: string; contentAr: string; isMandatory: boolean }[];
}

export async function buildContractPdf(args: Args): Promise<Buffer> {
  const { booking, clauses, contractRef } = args;
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks: Buffer[] = [];
  doc.on('data', (c) => chunks.push(c as Buffer));

  const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

  doc.fontSize(18).text('CONTRAT DE LOCATION DE VÉHICULE', { align: 'center' });
  doc.moveDown(0.3).fontSize(10).fillColor('#666')
     .text(`Référence: ${contractRef}`, { align: 'center' })
     .text('DzRent — Plateforme de location de véhicules', { align: 'center' });
  doc.moveDown().fillColor('#000');

  const line = (label: string, value: string) => doc.fontSize(10).text(`${label}: `, { continued: true }).font('Helvetica-Bold').text(value).font('Helvetica');

  doc.fontSize(13).text('Agence', { underline: true }).moveDown(0.3);
  line('Nom', booking.agency.name);
  if (booking.agency.registrationNo) line('RC', booking.agency.registrationNo);
  if (booking.agency.taxId) line('NIF', booking.agency.taxId);

  doc.moveDown(0.6).fontSize(13).text('Locataire', { underline: true }).moveDown(0.3);
  line('Nom', `${booking.client.firstName} ${booking.client.lastName}`);
  line('Téléphone', booking.client.phone);
  if (booking.client.nationalIdNumber) line('CIN', booking.client.nationalIdNumber);

  doc.moveDown(0.6).fontSize(13).text('Véhicule & Période', { underline: true }).moveDown(0.3);
  line('Véhicule', `${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.licensePlate})`);
  line('Du', new Date(booking.confirmedFrom ?? booking.requestedFrom).toISOString().slice(0, 10));
  line('Au', new Date(booking.confirmedUntil ?? booking.requestedUntil).toISOString().slice(0, 10));
  line('Total', `${booking.totalAmountDA} DA`);
  line('Caution', `${booking.depositAmountDA} DA`);

  doc.moveDown(0.8).fontSize(13).text('Clauses contractuelles', { underline: true }).moveDown(0.4);
  clauses.forEach((c, i) => {
    doc.fontSize(11).font('Helvetica-Bold').text(`${i + 1}. ${c.titleFr}${c.isMandatory ? '' : ' (optionnelle)'}`);
    doc.fontSize(9).font('Helvetica').fillColor('#333').text(c.contentFr, { align: 'justify' }).fillColor('#000');
    doc.moveDown(0.5);
  });

  doc.moveDown(1).fontSize(10)
     .text('Signature du locataire: ______________________     Date: __________', { continued: false })
     .moveDown(0.5)
     .text('Signature de l\'agence: ______________________     Date: __________');

  doc.end();
  return done;
}
