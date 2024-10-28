// app/etats/stock/components/StockEDBDetails.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StockEDBDetailsProps {
    stockEdb: {
      edbId: string;
      description: {
        items: Array<{ name: string; quantity: number }>;
        comment?: string;
      };
      category: {
        name: string;
      };
      employee?: {
        name: string;
      } | null;
      externalEmployeeName?: string | null;
      department: {  // This is directly on stockEdb, not under employee
        name: string;
      };
      createdAt: Date;
    };
  }
  
  export function StockEDBDetails({ stockEdb }: StockEDBDetailsProps) {
    const employeeName = stockEdb.employee?.name || stockEdb.externalEmployeeName || 'N/A';
    const departmentName = stockEdb.department.name; // Access department directly
  
    return (
      <Card>
        <CardHeader className="space-y-1 border-b mb-4">
          <CardTitle className="text-2xl">{stockEdb.edbId}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Informations générales</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Employé:</div>
              <div>{employeeName}</div>
              <div className="text-muted-foreground">Département:</div>
              <div className="text-xs">{departmentName}</div>
              <div className="text-muted-foreground">Catégorie:</div>
              <div>{stockEdb.category.name}</div>
              <div className="text-muted-foreground">Date:</div>
              <div>{format(new Date(stockEdb.createdAt), "Pp", { locale: fr })}</div>
            </div>
          </div>
  
          <div>
            <h3 className="font-semibold mb-2">Articles</h3>
            <ScrollArea className="h-[200px] rounded-md border border-dashed p-4">
              <div className="space-y-2">
                {stockEdb.description.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span>{item.name}</span>
                    <Badge variant="secondary">x {item.quantity}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
  
          {stockEdb.description.comment && (
            <div>
              <h3 className="font-semibold mb-2">Commentaire</h3>
              <p className="text-sm text-muted-foreground">
                {stockEdb.description.comment}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }