// components/PrintTest.tsx
import { useState } from 'react';
import { 
  Printer, 
  Text, 
  Line, 
  Row, 
  render, 
  Cut,
  Br 
} from 'react-thermal-printer';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

// Exact USB IDs for your POS-80 printer
const PRINTER_FILTERS = [
  { 
    usbVendorId: 0x0483,  // Your printer's vendor ID
    usbProductId: 0x5743  // Your printer's product ID
  }
];

export const PrintTest = () => {
  const { toast } = useToast();
  const [isPrinting, setIsPrinting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  const handlePrint = async () => {
    if (!navigator.serial) {
      toast({
        title: "Erreur",
        description: "Web Serial API n'est pas supportée par votre navigateur",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsPrinting(true);
      setDebugInfo([]);

      addDebugInfo('Recherche de l\'imprimante avec VID: 0x0483, PID: 0x5743...');

      const port = await navigator.serial.requestPort({
        filters: PRINTER_FILTERS
      });

      addDebugInfo('Imprimante trouvée. Tentative de connexion...');

      // Try to connect with these specific settings for POS-80
      await port.open({ 
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      });

      addDebugInfo('Connecté avec succès');

      // Create test receipt
      const receipt = (
        <Printer type="epson" width={42} characterSet="pc850_multilingual">
          <Text align="center" size={{ width: 2, height: 2 }}>TOUBA OIL</Text>
          <Br />
          <Text align="center" bold={true}>Test d&apos;Impression</Text>
          <Line />
          <Row 
            left="Date" 
            right={new Date().toLocaleDateString('fr-FR')} 
          />
          <Row 
            left="Heure" 
            right={new Date().toLocaleTimeString('fr-FR')} 
          />
          <Line />
          <Text>Test des caractères spéciaux:</Text>
          <Text>éèêëàâäôöûüùïîç</Text>
          <Br />
          <Text>Test des styles:</Text>
          <Text bold={true}>Texte en gras</Text>
          <Text size={{ width: 2, height: 1 }}>Texte large</Text>
          <Text underline="1dot-thick">Texte souligné</Text>
          <Line />
          <Text align="center">*** Fin du test ***</Text>
          <Br />
          <Cut />
        </Printer>
      );

      addDebugInfo('Génération des commandes ESC/POS...');
      const data = await render(receipt);
      
      addDebugInfo('Envoi à l\'imprimante...');
      const writer = port.writable?.getWriter();
      if (!writer) {
        throw new Error("Impossible d'accéder à l'imprimante");
      }

      await writer.write(data);
      writer.releaseLock();
      
      await port.close();
      addDebugInfo('Impression terminée avec succès');

      toast({
        title: "Succès",
        description: "Test d'impression réussi",
      });
    } catch (error) {
      console.error('Print error:', error);
      addDebugInfo(`ERREUR: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'impression",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handlePrint}
        disabled={isPrinting}
        className="gap-2"
      >
        {isPrinting ? "Impression..." : "Tester l'imprimante"}
      </Button>
      
      {!navigator.serial && (
        <p className="text-sm text-destructive">
          Votre navigateur ne supporte pas l&apos;lAPI Web Serial. 
          Veuillez utiliser Chrome ou Edge.
        </p>
      )}

      {/* Debug information */}
      {debugInfo.length > 0 && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">Journal de débogage:</h3>
          <div className="space-y-1">
            {debugInfo.map((info, index) => (
              <div key={index} className="text-sm font-mono">
                {info}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};