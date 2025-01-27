import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from 'sonner';

type DescriptionItem = {
  name: string;
  quantity: number;
};

type DeliveryHistoryItem = {
  items: Array<{ name: string; quantity: number }>;
  deliveredAt: string;
  deliveredBy: number;
};

type PartialDeliveryDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  id: number;
  stockEdbId: string;
  description: { items: DescriptionItem[] };
  deliveryHistory: DeliveryHistoryItem[];
  onSuccess?: () => void;
};

export const PartialDeliveryDialog = ({
  isOpen,
  onClose,
  id,
  stockEdbId,
  description,
  deliveryHistory,
  onSuccess
}: PartialDeliveryDialogProps) => {
  const [deliveryQuantities, setDeliveryQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDeliveryQuantities({});
      setError(null);
    }
  }, [isOpen]);

  // Calculate total delivered quantities for each item
  const totalDelivered = deliveryHistory.reduce((acc, delivery) => {
    delivery.items.forEach(item => {
      acc[item.name] = (acc[item.name] || 0) + item.quantity;
    });
    return acc;
  }, {} as Record<string, number>);

  const handleQuantityChange = (itemName: string, value: string) => {
    const quantity = parseInt(value) || 0;
    const item = description.items.find(i => i.name === itemName);
    
    if (item) {
      const deliveredQty = totalDelivered[itemName] || 0;
      const remainingQty = item.quantity - deliveredQty;
      
      if (quantity > remainingQty) {
        setError(`La quantité ne peut pas dépasser ${remainingQty} pour ${item.name}`);
        return;
      }
    }
    
    setDeliveryQuantities(prev => ({
      ...prev,
      [itemName]: quantity
    }));
    setError(null);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const deliveryItems = Object.entries(deliveryQuantities)
        .map(([name, quantity]) => ({
          name,
          quantity
        }))
        .filter(d => d.quantity > 0);

      if (deliveryItems.length === 0) {
        setError("Veuillez saisir au moins une quantité à livrer");
        return;
      }

      const response = await fetch(`/api/edb/stock/${id}/deliver-partial`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: deliveryItems })
      });

      if (!response.ok) {
        throw new Error('Failed to update delivery');
      }

      toast.success("Livraison enregistrée",{
        description: "La livraison partielle a été effectuée avec succès",
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Une erreur s'est produite lors de la livraison");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Livraison partielle - {stockEdbId}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {description.items.map(item => {
              const deliveredQty = totalDelivered[item.name] || 0;
              const remainingQty = item.quantity - deliveredQty;
              
              if (remainingQty <= 0) {
                return null; // Skip fully delivered items
              }
              
              return (
                <div key={item.name} className="grid grid-cols-2 gap-4 items-center">
                  <div>
                    <Label>{item.name}</Label>
                    <div className="text-sm text-muted-foreground">
                      {deliveredQty} / {item.quantity} livrés
                    </div>
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      max={remainingQty}
                      value={deliveryQuantities[item.name] || ''}
                      onChange={(e) => handleQuantityChange(item.name, e.target.value)}
                      placeholder={`Max: ${remainingQty}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !!error}
          >
            {isSubmitting ? 'Livraison en cours...' : 'Confirmer la livraison'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};