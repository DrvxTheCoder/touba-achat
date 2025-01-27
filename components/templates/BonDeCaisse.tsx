import React from 'react';
import { 
  Printer, 
  Text, 
  Line, 
  Row, 
  render,
  Image as PrinterImage
} from 'react-thermal-printer';

interface BonDeCaisseProps {
  edb: {
    edbId: string;
    amount: number;
    department: {
      name: string;
    };
    approvedBy: {
      name: string;
    };
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    logo?: string; // Base64 or URL of logo
  };
}

export const BonDeCaisse: React.FC<BonDeCaisseProps> = ({ edb }) => {
  return (
    <Printer type='epson' width={42}>
      <Text align='center' bold={true}>TOUBA OIL S.A.U</Text>
      {edb.logo && (
        <PrinterImage src={edb.logo} width={200} align="center" />
      )}
      <Text align='center'>BON DE CAISSE</Text>
      <Line />
      
      <Text>EDB N°: {edb.edbId}</Text>
      <Text>Date: {new Date().toLocaleDateString('fr-FR')}</Text>
      <Text>Département: {edb.department.name}</Text>
      <Line />
      
      {edb.items.map((item, index) => (
        <React.Fragment key={index}>
          <Text>{item.description}</Text>
            <Text>{item.quantity} x {item.unitPrice.toLocaleString('fr-FR')}</Text>
            <Text align='right'>{item.total.toLocaleString('fr-FR')} FCFA</Text>
        </React.Fragment>
      ))}
      
      <Line />
      <Text align='right' bold={true}>
        Total: {edb.amount.toLocaleString('fr-FR')} FCFA
      </Text>
      <Text>Approuvé par: {edb.approvedBy.name}</Text>
      <Line />
      <Text align='center'>Merci</Text>
      <Text></Text>
    </Printer>
  );
};