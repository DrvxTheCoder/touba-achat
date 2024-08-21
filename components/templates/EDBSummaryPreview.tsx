// import React, { useState, useEffect } from 'react';
// import { pdf } from '@react-pdf/renderer';
// import EDBSummaryPDF from './EDBSummaryPDF';
// import { Button } from '@/components/ui/button';

// // Fake data
// const fakeEDB = {
//   edbId: 'EDB20240001',
//   createdAt: '2024-07-15T10:30:00Z',
//   status: 'Founisseur Choisi',
//   employee: {
//     name: 'Cheikhou Bodiang',
//     email: 'cheikhou.bodiang@touba-oil.com'
//   },
//   department: {
//     name: 'Direction Commerciale Marketing'
//   },
//   description: [
//     item: {
//       { designation: 'Ordinateur Portable', quantity: 2 },
//       { designation: 'Chaise Ergonomique', quantity: 2 },
//       { designation: 'Souris sans fil', quantity: 10 }
//     }

//   ]
// };

// const fakeTimelineEvents = [
//   { eventAt: '2024-07-15T10:30:00Z', status: 'Créé', user: { name: 'Cheikhou Bodiang' } },
//   { eventAt: '2024-07-16T09:15:00Z', status: 'Approbation du Service', user: { name: 'Mamadou Diouf' } },
//   { eventAt: '2024-07-17T14:45:00Z', status: 'Approbation de la Direction', user: { name: 'Caty Coulibaly' } },
//   { eventAt: '2024-07-17T15:40:00Z', status: 'Facture rattaché', user: { name: 'Keba Gnabaly' } },
//   { eventAt: '2024-07-18T11:00:00Z', status: 'Choix du fournisseur effectué', user: { name: 'Alboury Ndao' } }
// ];

// const EDBSummaryPDFPreview: React.FC = () => {
//   const [pdfUrl, setPdfUrl] = useState<string | null>(null);

//   useEffect(() => {
//     const generatePDF = async () => {
//       const pdfBlob = await pdf(<EDBSummaryPDF edb={fakeEDB} timelineEvents={fakeTimelineEvents} />).toBlob();
//       const url = URL.createObjectURL(pdfBlob);
//       setPdfUrl(url);
//     };

//     generatePDF();

//     // Cleanup function to revoke the URL when the component unmounts
//     return () => {
//       if (pdfUrl) {
//         URL.revokeObjectURL(pdfUrl);
//       }
//     };
//   }, []);

//   const handleDownload = () => {
//     if (pdfUrl) {
//       const link = document.createElement('a');
//       link.href = pdfUrl;
//       link.download = `EDB_Summary_${fakeEDB.edbId}.pdf`;
//       link.click();
//     }
//   };

//   return (
//     <div className="flex flex-col items-center space-y-4">
//       <h2 className="text-2xl font-bold">EDB Summary PDF Preview</h2>
//       {pdfUrl ? (
//         <>
//           <iframe
//             src={pdfUrl}
//             className="w-full h-[600px] border border-gray-300 rounded"
//             title="EDB Summary PDF Preview"
//           />
//           <Button onClick={handleDownload}>Download PDF</Button>
//         </>
//       ) : (
//         <p>Loading PDF...</p>
//       )}
//     </div>
//   );
// };

// export default EDBSummaryPDFPreview;