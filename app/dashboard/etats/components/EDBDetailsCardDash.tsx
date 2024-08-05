// // components/EDBDetailsCard.tsx
// import React from 'react';
// import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
// import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
// import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut } from "@/components/ui/dropdown-menu";
// import { AttachDocumentDialog } from './AttachDocumentDialog';
// import { ValidationDialog } from './ValidationDialog';
// import { RejectionDialog } from "./RejectionDialog";
// import { EDBTimelineDialog } from "@/components/EDBTimelineDialog";
// import { EDBStatus, EDB } from '@/app/(utilisateur)/etats-de-besoin/data/types';
// import { Copy, MoreVertical, Paperclip, Truck, FileCheck2, BadgeCheck, Ban } from "lucide-react";
// import { toast } from "@/components/ui/use-toast";

// type EDBDetailsCardProps = {
//     selectedEDB: EDB | null;
//     canValidate: boolean;
//     canReject: boolean;
//     handleOpenAttachDialog: () => void;
//     handleValidate: () => void;
//     handleReject: () => void;
//     confirmValidation: () => void;
//     confirmRejection: (reason: string) => void;
//     isValidationDialogOpen: boolean;
//     isRejectionDialogOpen: boolean;
//     isValidating: boolean;
//     isRejecting: boolean;
//     setIsValidationDialogOpen: (isOpen: boolean) => void;
//     setIsRejectionDialogOpen: (isOpen: boolean) => void;
//     setIsRejecting: (isRejecting: boolean) => void;
//     isAttachDocumentDialogOpen: boolean;
//     setIsAttachDocumentDialogOpen: (isOpen: boolean) => void;
//     handleUploadSuccess: (attachments: any[]) => void;
//   };
  
//   const getStatusBadge = (status: EDBStatus) => {
//     switch (status) {
//       case 'DRAFT':
//         return <Badge variant="secondary">Brouillon</Badge>;
//       case 'SUBMITTED':
//         return <Badge variant="outline">Soumis</Badge>;
//       case 'APPROVED_RESPONSABLE':
//         return <Badge variant="outline">Approuvé (Resp.)</Badge>;
//       case 'APPROVED_DIRECTEUR':
//         return <Badge variant="outline">Approuvé (Dir.)</Badge>;
//       case 'APPROVED_DG':
//         return <Badge variant="outline">Approuvé (DG)</Badge>;
//       case 'REJECTED':
//         return <Badge variant="destructive">Rejeté</Badge>;
//       case 'MAGASINIER_ATTACHED':
//         return <Badge variant="outline">Documents Attachés</Badge>;
//       case 'AWAITING_SUPPLIER_CHOICE':
//         return <Badge variant="secondary">En Attente Fournisseur</Badge>;
//       case 'SUPPLIER_CHOSEN':
//         return <Badge variant="outline">Fournisseur Choisi</Badge>;
//       case 'AWAITING_IT_APPROVAL':
//         return <Badge variant="secondary">En Attente IT</Badge>;
//       case 'IT_APPROVED':
//         return <Badge variant="outline">Approuvé IT</Badge>;
//       case 'COMPLETED':
//         return <Badge variant="default">Complété</Badge>;
//       default:
//         return <Badge variant="outline">{status}</Badge>;
//     }
//   };

//   export const EDBDetailsCard: React.FC<EDBDetailsCardProps> = ({
//     selectedEDB,
//     canValidate,
//     canReject,
//     handleOpenAttachDialog,
//     handleValidate,
//     handleReject,
//     confirmValidation,
//     confirmRejection,
//     isValidationDialogOpen,
//     isRejectionDialogOpen,
//     isValidating,
//     isRejecting,
//     setIsValidationDialogOpen,
//     setIsRejectionDialogOpen,
//     setIsRejecting,
//     isAttachDocumentDialogOpen,
//     setIsAttachDocumentDialogOpen,
//     handleUploadSuccess
//   }) => {
//     if (!selectedEDB) {
//       return (
//         <Card>
//           <CardContent className="p-6 text-sm text-center text-muted-foreground">
//             Sélectionnez un EDB pour voir les détails
//           </CardContent>
//         </Card>
//       );
//     }
  
//     return (
//       <Card className="overflow-hidden lg:block hidden mb-5">
//         <CardHeader className="flex flex-row items-start border-b">
//           <div className="grid gap-0.5">
//             <CardTitle className="group flex items-center gap-2 text-lg hover:underline underline-offset-2">
//               # {selectedEDB.edbId}
//               <Button
//                 size="icon"
//                 variant="outline"
//                 className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
//                 onClick={() => {
//                   navigator.clipboard.writeText(selectedEDB.edbId);
//                   toast({
//                     title: "Copie réussi",
//                     description: `L'ID a été copié dans le presse-papier.`,
//                   });
//                 }}
//               >
//                 <Copy className="h-3 w-3" />
//                 <span className="sr-only">Copier ID EDB</span>
//               </Button>
//             </CardTitle>
//             <CardDescription>Statut: {getStatusBadge(selectedEDB.status)}</CardDescription>
//           </div>
//           <div className="ml-auto flex items-center gap-1">
//             <EDBTimelineDialog             edb={{
//                 id: selectedEDB.id,
//                 edbId: selectedEDB.edbId,
//                 status: selectedEDB.status as EDBStatus, // Cast to EDBStatus if necessary
//                 auditLogs: selectedEDB.auditLogs
//             }} />
            
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <Button size="icon" variant="outline" className="h-8 w-8">
//                   <MoreVertical className="h-3.5 w-3.5" />
//                   <span className="sr-only">Plus</span>
//                 </Button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent align="end">
//                 <DropdownMenuItem>Modifier</DropdownMenuItem>
//                 <DropdownMenuItem onSelect={handleOpenAttachDialog}>
//                   Joindre document(s)
//                   <DropdownMenuShortcut><Paperclip className="ml-2 h-4 w-4" /></DropdownMenuShortcut>
//                 </DropdownMenuItem>
//                 <DropdownMenuItem disabled>
//                   Bon de Commande
//                   <DropdownMenuShortcut><FileCheck2 className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
//                 </DropdownMenuItem>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem
//                   className="text-primary"
//                   onClick={handleValidate}
//                   disabled={!canValidate}
//                 >
//                   Valider
//                   <DropdownMenuShortcut><BadgeCheck className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
//                 </DropdownMenuItem>
//                 <DropdownMenuItem
//                   className="text-destructive"
//                   onClick={handleReject}
//                   disabled={!canReject}
//                 >
//                   Rejeter
//                   <DropdownMenuShortcut><Ban className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </div>
//         </CardHeader>
//         <CardContent className="p-6 text-sm">
//         <div className="grid gap-3">
//           <small className="text-xs text-muted-foreground"><b>Titre:</b> {selectedEDB.title}</small>
//           <ul className="grid gap-3">
//             <li className="flex items-center justify-between px-3">
//               <span className="font-semibold">Désignation</span>
//               <span className="font-semibold">QTE</span>
//             </li>
//           </ul>
//           <ScrollArea className="w-full rounded-md h-14 p-2 border">
//             {selectedEDB.description?.items?.map((item, index) => (
//               <li className="flex items-center justify-between" key={index}>
//                 <span className="text-muted-foreground">{item.designation}</span>
//                 <span>x {item.quantity}</span>
//               </li>
//             )) || <li>Aucun élément trouvé</li>}
//           </ScrollArea>
//           <Separator className="my-2" />
//           <ul className="grid gap-3">
//             <li className="flex items-center justify-between font-semibold">
//               <span className="text-muted-foreground">Total - Estimé (XOF)</span>
//               <span>{selectedEDB.totalAmount?.toLocaleString() || 'N/A'}</span>
//             </li>
//           </ul>
//         </div>
//         <Separator className="my-4" />
//         <div className="grid gap-3">
//           <div className="font-semibold">Information Employé</div>
//           <dl className="grid gap-3">
//             <div className="flex items-center justify-between">
//               <dt className="text-muted-foreground">Nom et Prenom</dt>
//               <dd>{selectedEDB.employee?.name || 'N/A'}</dd>
//             </div>
//             <div className="flex items-center justify-between">
//               <dt className="text-muted-foreground">Departement</dt>
//               <dd>{selectedEDB.department || 'N/A'}</dd>
//             </div>
//           </dl>
//         </div>
//         <Separator className="my-4" />
//         <div className="font-semibold">Document Rattaché</div>
//         <ScrollArea className="w-full whitespace-nowrap rounded-md py-3">
//           <div className="flex w-max space-x-1 p-1 justify-start gap-1 ">
//             {selectedEDB.attachments?.map((attachment, index) => (
//               <Button key={index} variant="outline" className="text-xs">
//                 <Paperclip className="h-4 w-4 mr-1" />
//                 {attachment.fileName}
//               </Button>
//             )) || <span>Aucun document attaché</span>}
//           </div>
//           <ScrollBar orientation="horizontal" />
//         </ScrollArea>
//       </CardContent>
//         <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
//           <div className="text-xs text-muted-foreground">
//             Date: <time dateTime={selectedEDB.createdAt}>{new Date(selectedEDB.createdAt).toLocaleDateString('fr-FR')}</time>
//           </div>
//         </CardFooter>
  
//         <AttachDocumentDialog 
//           isOpen={isAttachDocumentDialogOpen}
//           onOpenChange={setIsAttachDocumentDialogOpen}
//           onUploadSuccess={handleUploadSuccess}
//         />
//         <ValidationDialog 
//           isOpen={isValidationDialogOpen}
//           onClose={() => setIsValidationDialogOpen(false)}
//           onConfirm={confirmValidation}
//           edbId={selectedEDB.id}
//           isLoading={isValidating}
//         />
//         <RejectionDialog 
//           isOpen={isRejectionDialogOpen}
//           onClose={() => {
//             setIsRejectionDialogOpen(false);
//             setIsRejecting(false);
//           }}
//           onConfirm={confirmRejection}
//           edbId={selectedEDB.id}
//           isLoading={isRejecting}
//         />
//       </Card>
//     );
//   };

