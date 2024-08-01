import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDropzone } from "@uploadthing/react";
import { generateClientDropzoneAccept } from "uploadthing/client";
import { useUploadThing } from "@/lib/uploadthing";
import { X, FileText, UploadCloud } from 'lucide-react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";

type AttachmentMetadata = {
  file: File;
  invoiceName: string;
  supplierName: string;
  totalAmount: number;
};

interface AttachDocumentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess: (attachments: AttachmentMetadata[]) => void;
}

export const AttachDocumentDialog: React.FC<AttachDocumentDialogProps> = ({ isOpen, onOpenChange, onUploadSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState<AttachmentMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { startUpload, permittedFileInfo } = useUploadThing("generalMedia", {
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
    onClientUploadComplete: (res) => {
      console.log("Upload completed successfully:", res);
      if (res && res.length > 0) {
        const updatedAttachments = selectedFiles.map((attachment, index) => ({
          ...attachment,
          url: res[index]?.url
        }));
        onUploadSuccess(updatedAttachments);
        toast({ title: "Succès", description: "Les fichiers ont été téléchargés avec succès." });
        setIsUploading(false);
        setUploadProgress(0);
        onOpenChange(false);
      } else {
        console.error("Upload completed but no response received");
        toast({ title: "Attention", description: "Le téléchargement semble avoir réussi, mais aucune donnée n'a été reçue. Veuillez vérifier et réessayer si nécessaire.", variant: "destructive" });
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    onUploadError: (error: Error) => {
      console.error("Upload error:", error);
      toast({ title: "Erreur", description: `Une erreur est survenue lors du sauvegarde des fichiers: ${error.message}`, variant: "destructive" });
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newAttachments = acceptedFiles.map(file => ({
      file,
      invoiceName: '',
      supplierName: '',
      totalAmount: 0
    }));
    setSelectedFiles(prev => {
      const updated = [...prev, ...newAttachments].slice(0, 3);
      if (updated.length > 3) {
        toast({ title: "Attention", description: "Vous ne pouvez sélectionner que 3 fichiers maximum.", variant: "destructive" });
      }
      return updated;
    });
  }, []);

  const fileTypes = permittedFileInfo?.config ? Object.keys(permittedFileInfo?.config) : [];

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined,
    maxFiles: 3,
  });

  const handleMetadataChange = (index: number, field: keyof AttachmentMetadata, value: string | number) => {
    setSelectedFiles(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeAttachment = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const isFormValid = useCallback(() => {
    return selectedFiles.length > 0 && selectedFiles.every(file => 
      file.invoiceName.trim() !== '' && 
      file.supplierName.trim() !== '' && 
      file.totalAmount > 0
    );
  }, [selectedFiles]);

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs pour chaque fichier.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const result = await startUpload(selectedFiles.map(attachment => attachment.file));
      console.log("Upload result:", result);
      if (!result || result.length === 0) {
        throw new Error("Aucun fichier n'a été téléchargé");
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast({ title: "Erreur", description: "Une erreur inattendue s'est produite lors du téléchargement.", variant: "destructive" });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[60rem]">
        <DialogHeader>
          <DialogTitle>Joindre des documents</DialogTitle>
        </DialogHeader>
        {isUploading && (
                    <Progress value={uploadProgress} className="w-full h-1" />
                )}
        <div className="space-y-4">
          <div {...getRootProps()} className="flex flex-col justify-items-center border-2 border-dashed rounded-lg p-6 text-center cursor-pointer">
            <Button className='bg-transparent hover:bg-transparent mb-2' variant="ghost"><UploadCloud className="h-10 w-10" /> </Button>
            <div className="text-sm">Faites glisser des fichiers ici, ou cliquez pour sélectionner.</div>
            <div className="text-xs text-muted-foreground">3 documents maximum (Taille: 2 Mo)</div>
            <input {...getInputProps()} />
          </div>
          {selectedFiles.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fichier</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Montant XOF</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedFiles.map((attachment, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center text-xs">
                        <FileText className="mr-2 h-4 w-4" />
                        {attachment.file.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={attachment.invoiceName}
                        onChange={(e) => handleMetadataChange(index, 'invoiceName', e.target.value)}
                        placeholder="Nom de la facture"
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={attachment.supplierName}
                        onChange={(e) => handleMetadataChange(index, 'supplierName', e.target.value)}
                        placeholder="Nom du fournisseur"
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={attachment.totalAmount || ''}
                        onChange={(e) => handleMetadataChange(index, 'totalAmount', parseFloat(e.target.value) || 0)}
                        placeholder="Montant total"
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" onClick={() => removeAttachment(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={!isFormValid() || isUploading} className="flex flex-col">
              {isUploading ? 'Téléchargement en cours...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};