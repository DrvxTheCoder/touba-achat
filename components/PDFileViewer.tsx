// components/PDFileViewer.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BadgeCheck, Ban, Check, Loader2 } from "lucide-react";
import { SpinnerCircularFixed } from 'spinners-react';
import { InfoCircledIcon } from '@radix-ui/react-icons';

interface PDFViewerProps {
    fileUrl: string;
    fileName: string;
    canSelectSupplier: boolean;
    onSelectSupplier: () => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    supplierName: string;
    isITCategory: boolean | null;
    isSupplierChosen: boolean;  // New prop
    isCurrentAttachmentChosen: boolean;  // Rename from isChosen
  }
export const PDFViewer: React.FC<PDFViewerProps> = ({ 
  fileUrl, 
  fileName,
  canSelectSupplier, 
  onSelectSupplier,
  open,
  onOpenChange,
  isITCategory,
  supplierName,
  isSupplierChosen,
  isCurrentAttachmentChosen
}) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const SelectSupplierButton = () => {
    if (isCurrentAttachmentChosen) {
      return (
        <Button disabled variant="outline">
          <BadgeCheck className="mr-2 h-4 w-4" /> Fournisseur sélectionné
        </Button>
      );
    } else if (isSupplierChosen) {
      return (
        <Button disabled variant="outline">
          <Ban className="mr-2 h-4 w-4" /> Fournisseur déja sélectionné
        </Button>
      );
    } else if (canSelectSupplier) {
      return (
        <Button onClick={onSelectSupplier}>
          Sélectionner ce fournisseur
        </Button>
      );
    } else if (isITCategory) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block">
                <Button 
                  disabled 
                  aria-label="Ce choix est reservé au Service Informatique."
                >
                  Sélectionner ce fournisseur
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className='flex flex-row justify-between gap-1 text-sm'>Ce choix est reservé au Service Informatique.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block">
                <Button disabled>Sélectionner ce fournisseur</Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className='flex flex-row justify-between gap-1 text-sm'>Fournisseur déjà sélectionné</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{fileName} - <text className="text-muted-foreground text-sm">par {supplierName}</text></DialogTitle>
        </DialogHeader>
        <div className="pdf-viewer relative" style={{ height: '500px' }}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <SpinnerCircularFixed size={90} thickness={100} speed={100} color="#36ad47" secondaryColor="rgba(73, 172, 57, 0.23)" />
            </div>
          )}
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
            width="100%"
            height="100%"
            title="PDF Viewer"
            onLoad={handleIframeLoad}
            style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.3s ease-in-out' }}
            className='rounded'
          />
        </div>
        <DialogFooter>
          <SelectSupplierButton />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};