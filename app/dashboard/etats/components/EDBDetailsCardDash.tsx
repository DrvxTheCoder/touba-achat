// // components/EDBDetailsCard.tsx
// import React from 'react';
// import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
// import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
// import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
// import { EDBTimelineDialog } from "@/components/EDBTimelineDialog";
// import { EDBStatus, EDB } from '@/app/(utilisateur)/etats-de-besoin/data/types';
// import { Copy, MoreVertical, Paperclip } from "lucide-react";

// type EDBDetailsCardProps = {
//     edb: EDB;
//   };
//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case 'DRAFT':
//         return <Badge variant="secondary"><text className="text-xs">Brouillon</text></Badge>;
//       case 'SUBMITTED':
//         return <Badge variant="outline"><text className="text-xs">Soumis</text></Badge>;
//       case 'APPROVED_RESPONSABLE':
//         return <Badge variant="secondary"><text className="text-xs">Approuvé (Resp.)</text></Badge>;
//       case 'APPROVED_DIRECTEUR':
//         return <Badge variant="secondary"><text className="text-xs">Approuvé (Dir.)</text></Badge>;
//       case 'APPROVED_DG':
//         return <Badge variant="secondary"><text className="text-xs">Approuvé (DG)</text></Badge>;
//       case 'REJECTED':
//         return <Badge variant="destructive"><text className="text-xs">Rejeté</text></Badge>;
//       default:
//         return <Badge variant="default"><text className="text-xs">{status}</text></Badge>;
//     }
//   };

// export const EDBDetailsCardDash: React.FC<EDBDetailsCardProps> = ({ edb }) => {
//   return (
//     <Card className="overflow-hidden">
//       <CardHeader className="flex flex-row items-start border-b">
//         <div className="grid gap-0.5">
//           <CardTitle className="group flex items-center gap-2 text-lg hover:underline underline-offset-2">
//             # {edb.edbId}
//             <Button
//               size="icon"
//               variant="outline"
//               className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
//               onClick={() => navigator.clipboard.writeText(edb.edbId)}
//             >
//               <Copy className="h-3 w-3" />
//               <span className="sr-only">Copier ID EDB</span>
//             </Button>
//           </CardTitle>
//           <CardDescription>Statut: {getStatusBadge(edb.status)}</CardDescription>
//         </div>
//         <div className="ml-auto flex items-center gap-1">
//         <EDBTimelineDialog 
//             edb={{
//                 id: edb.id,
//                 edbId: edb.edbId,
//                 status: edb.status as EDBStatus, // Cast to EDBStatus if necessary
//                 auditLogs: edb.auditLogs
//             }} 
//           />
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button size="icon" variant="outline" className="h-8 w-8">
//                 <MoreVertical className="h-3.5 w-3.5" />
//                 <span className="sr-only">Plus</span>
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end">
//               <DropdownMenuItem>Modifier</DropdownMenuItem>
//               <DropdownMenuItem>Exporter</DropdownMenuItem>
//               <DropdownMenuSeparator />
//               <DropdownMenuItem disabled>Supprimer</DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>
//       </CardHeader>
//       <CardContent className="p-6 text-sm">
//         <div className="grid gap-3">
//           <ul className="grid gap-3">
//             <li className="flex items-center justify-between">
//               <span className="font-semibold">Désignation</span>
//               <span className="font-semibold">QTE</span>
//             </li>
//           </ul>
//           <ul className="grid gap-1">
//           <ScrollArea className="w-full rounded-md h-16 p-2 border">
//             {edb.description.items.map((item, index) => (
//                 <li key={index} className="flex items-center justify-between">
//                     <span className="text-muted-foreground">
//                     {item.designation}
//                     </span>
//                     <span>x {item.quantity}</span>
//                 </li>
//             ))}
//           </ScrollArea>
//           </ul>
//           <Separator className="my-2" />
//           <ul className="grid">
//             <li className="flex items-center justify-between font-semibold">
//               <span className="text-muted-foreground">Total - Estimé (XOF)</span>
//               <span>{edb.totalAmount.toLocaleString()}</span>
//             </li>
//           </ul>
//         </div>
//         <Separator className="my-4" />
//         <div className="font-semibold">Document Rattaché</div>
//         <ScrollArea className="w-full whitespace-nowrap rounded-md py-3">
//           <div className="flex w-max space-x-1 p-1 justify-start gap-1">
//             {edb.attachments.map((attachment) => (
//               <Button key={attachment.id} variant="outline" className="text-xs">
//                 <Paperclip className="h-4 w-4 mr-1"/> {attachment.fileName}
//               </Button>
//             ))}
//           </div>
//           <ScrollBar orientation="horizontal" />
//         </ScrollArea>
//       </CardContent>
//       <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
//         <div className="text-xs text-muted-foreground">
//           Date: <time dateTime={edb.createdAt}>{new Date(edb.createdAt).toLocaleDateString('fr-FR')}</time>
//         </div>
//       </CardFooter>
//     </Card>
//   );
// };

// <Card className="overflow-hidden lg:block hidden mb-5">
// <CardHeader className="flex flex-row items-start border-b">
//     <div className="grid gap-0.5">
//       <CardTitle className="group flex items-center gap-2 text-lg hover:underline underline-offset-2">
//         # {selectedEDB.id}
//         <Button
//           size="icon"
//           variant="outline"
//           className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
//         >
//           <Copy className="h-3 w-3" onClick={() => {
//           const textToCopy = `${selectedEDB.id}`;
//           navigator.clipboard.writeText(textToCopy);
//           toast({
//             title: "Copie réussi",
//             description: `L\'ID a été copié dans le presse-papier.`,
//           })
//         }} />
//           <span className="sr-only">Copier ID EDB</span>
//         </Button>
//       </CardTitle>
//       <CardDescription>Statut: 
//         <StatusBadge status={selectedEDB.status} />
//       </CardDescription>
//     </div>
//     <div className="ml-auto flex items-center gap-1">
//       <Button size="sm" variant="outline" className="h-8 gap-1">
//         <Truck className="h-3.5 w-3.5" />
//         <span className="lg:sr-only xl:not-sr-only xl:whitespace-nowrap">
//           Tracker
//         </span>
//       </Button>
//       <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//           <Button size="icon" variant="outline" className="h-8 w-8">
//             <MoreVertical className="h-3.5 w-3.5" />
//             <span className="sr-only">Plus</span>
//           </Button>
//         </DropdownMenuTrigger>
//         <DropdownMenuContent align="end">
//           <DropdownMenuItem>Modifier</DropdownMenuItem>
          
//           <DropdownMenuItem onSelect={handleOpenAttachDialog}>
//             Joindre document(s)
//             <Paperclip className="ml-2 h-4 w-4" />
//           </DropdownMenuItem>
//           <DropdownMenuItem disabled>Bon de Commande
//           <DropdownMenuShortcut><FileCheck2 className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
//           </DropdownMenuItem>
//           <DropdownMenuSeparator />
//           <DropdownMenuItem 
//             className="text-primary"
//             onClick={handleValidate}
//             disabled={!canValidate}
//           >
//             Valider
//             <DropdownMenuShortcut><BadgeCheck className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
//           </DropdownMenuItem>
//           <DropdownMenuItem 
//             className="text-destructive"
//             onClick={handleReject}
//             disabled={!canReject}
//           >
//             Rejeter
//             <DropdownMenuShortcut><Ban className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
//           </DropdownMenuItem>

//         </DropdownMenuContent>
//       </DropdownMenu>
//       <AttachDocumentDialog 
//         isOpen={isAttachDocumentDialogOpen}
//         onOpenChange={setIsAttachDocumentDialogOpen}
//         onUploadSuccess={handleUploadSuccess}
//       />
//       {selectedEDB && (
//         <>
//           <ValidationDialog 
//             isOpen={isValidationDialogOpen}
//             onClose={() => setIsValidationDialogOpen(false)}
//             onConfirm={confirmValidation}
//             edbId={selectedEDB.queryId}
//             isLoading={isValidating}
//           />
//           <RejectionDialog 
//             isOpen={isRejectionDialogOpen}
//             onClose={() => {
//               setIsRejectionDialogOpen(false);
//               setIsRejecting(false);
//             }}
//             onConfirm={confirmRejection}
//             edbId={selectedEDB.queryId}
//             isLoading={isRejecting}
//           />
//         </>
//       )}
//     </div>
//   </CardHeader>
//   <CardContent className="p-6 text-sm">
  
//     <div className="grid gap-3">
//       <small className="text-xs text-muted-foreground"><b>Titre:</b> {selectedEDB.title}</small>
//       <ul className="grid gap-3">
//       <li className="flex items-center justify-between px-3">
//         <span className="font-semibold">Désignation</span>
//         <span className="font-semibold">QTE</span>
//       </li>
//       </ul>
//       <ul className="grid gap-3">
//       <ScrollArea className="w-full rounded-md h-14 p-2 border">
//         {selectedEDB.items.map((item, index) => (
//           <li className="flex items-center justify-between" key={index}>
//             <span className="text-muted-foreground">{item.designation}</span>
//             <span>x {item.quantity}</span>
//           </li>
//         ))}
//       </ScrollArea>
//       </ul>
//       <span className="font-semibold">Références Techniques</span>
//       <span className="text-muted-foreground">Non-renseigné</span>
//       <Separator className="my-2" />
//       <ul className="grid gap-3">
//         <li className="flex items-center justify-between font-semibold">
//           <span className="text-muted-foreground">Total - Estimé (XOF)</span>
//           <span>{selectedEDB.amount}</span>
//         </li>
//       </ul>
//     </div>
//     <Separator className="my-4" />
//     <div className="grid gap-3">
//       <div className="font-semibold">Information Employé</div>
//       <dl className="grid gap-3">
//         <div className="flex items-center justify-between">
//           <dt className="text-muted-foreground">Nom et Prenom</dt>
//           <dd>{selectedEDB.employee.name}</dd>
//         </div>
//         <div className="flex items-center justify-between">
//           <dt className="text-muted-foreground">Departement</dt>
//           <dd>
//             <dd>{selectedEDB.department}</dd>
//           </dd>
//         </div>
//         <div className="flex items-center justify-between">
//           <dt className="text-muted-foreground">Email</dt>
//           <dd>
//             <a href="mailto:djamilla.sylla@touba-oil.com">{selectedEDB.email}</a>
//           </dd>
//         </div>
//       </dl>
//     </div>
//     <Separator className="my-4" />
//       <div className="font-semibold">Document Rattaché (Service ACHAT)</div>
//       <ScrollArea className="w-full whitespace-nowrap rounded-md py-3">
//         <div className="flex w-max space-x-1 p-1 justify-start gap-1 ">
//         {selectedEDB.documents.map((document, index) => (
//           <>
//            <Button variant="outline" className="text-xs"> <Paperclip className="h-4 w-4 mr-1" key={index}/>{document}</Button>
//            </>
//         ))}
//         </div>
      
//         <ScrollBar orientation="horizontal" />
//       </ScrollArea>
//   </CardContent>
//   <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
//     <div className="text-xs text-muted-foreground">
//       Date: <time dateTime={selectedEDB.date}>{selectedEDB.date}</time>
//     </div>
//   </CardFooter>
// </Card>