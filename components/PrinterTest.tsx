// components/PrinterTest.tsx
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export const PrinterTest = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handlePrint = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3001/print-test', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }

      toast({
        title: "Succès",
        description: "Test d'impression réussi",
      });
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur d'impression",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handlePrint}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? "Impression..." : "Tester TM-T20III"}
    </Button>
  );
};