import { Badge } from "@/components/ui/badge";
import { StockEDBStatus } from "@prisma/client";

interface StatusBadgeProps {
  status: StockEDBStatus;
}

const statusConfig: Record<StockEDBStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  DRAFT: { label: "Brouillon", variant: "outline" },
  SUBMITTED: { label: "Soumis", variant: "outline" },
  ORDERED: { label: "Commandé", variant: "secondary" },
  DELIVERED: { label: "Livré", variant: "default" },
  CONVERTED: { label: "Converti", variant: "secondary" },
  PARTIALLY_DELIVERED: { label: "Livré**", variant: "secondary" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} className="text-xs">
      <text className="text-xs">{config.label}</text>
    </Badge>
  );
}