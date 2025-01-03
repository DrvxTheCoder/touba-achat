// app/api/stock-edbs/[id]/delivery/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Types for JSON fields
type DescriptionItem = {
  name: string;
  quantity: number;
};

type DeliveryHistoryItem = {
  items: Array<{ name: string; quantity: number }>;
  deliveredAt: string;
  deliveredBy: number;
};

// Validation schema
const deliverySchema = z.object({
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number().min(0),
  }))
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return new NextResponse('Non autorisé', { status: 401 });
    }

    // Get current user with email from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        role: true,
        access: true,
      }
    });

    if (!user || (user.role !== 'MAGASINIER' && user.role !== 'ADMIN')) {
      throw new Error('Non autorisé');
    }
    

    const body = await req.json();
    const validatedData = deliverySchema.parse(body);

    // Get current stock EDB
    const stockEdb = await prisma.stockEtatDeBesoin.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!stockEdb) {
      return new NextResponse('EDB non trouvé', { status: 404 });
    }

    const description = stockEdb.description as { items: DescriptionItem[] };
    const deliveryHistory = (stockEdb.deliveryHistory as DeliveryHistoryItem[]) || [];

    // Calculate total delivered quantities for each item
    const totalDelivered = deliveryHistory.reduce((acc, delivery) => {
      delivery.items.forEach(item => {
        acc[item.name] = (acc[item.name] || 0) + item.quantity;
      });
      return acc;
    }, {} as Record<string, number>);

    // Validate new delivery quantities
    for (const delivery of validatedData.items) {
      const requestedItem = description.items.find(item => item.name === delivery.name);
      if (!requestedItem) {
        return new NextResponse(
          `Article non trouvé: ${delivery.name}`,
          { status: 400 }
        );
      }

      const alreadyDelivered = totalDelivered[delivery.name] || 0;
      const remainingQty = requestedItem.quantity - alreadyDelivered;

      if (delivery.quantity > remainingQty) {
        return new NextResponse(
          `Quantité invalide pour ${delivery.name}. Maximum restant: ${remainingQty}`,
          { status: 400 }
        );
      }
    }

    // Create new delivery history entry
    const newDeliveryEntry: DeliveryHistoryItem = {
      items: validatedData.items,
      deliveredAt: new Date().toISOString(),
      deliveredBy: user.id
    };

    // Check if all items are fully delivered after this delivery
    const updatedTotalDelivered: Record<string, number> = {
      ...totalDelivered,
      ...validatedData.items.reduce<Record<string, number>>((acc, item) => ({
        ...acc,
        [item.name]: (totalDelivered[item.name] || 0) + item.quantity
      }), {})
    };

    const isFullyDelivered = description.items.every(item => 
      (updatedTotalDelivered[item.name] || 0) >= item.quantity
    );

    // Update the stock EDB
    const updatedStockEdb = await prisma.stockEtatDeBesoin.update({
      where: { id: parseInt(params.id) },
      data: {
        deliveryHistory: [...deliveryHistory, newDeliveryEntry],
        status: isFullyDelivered ? 'DELIVERED' : 'PARTIALLY_DELIVERED',
        isFullyDelivered,
        deliveredAt: isFullyDelivered ? new Date() : stockEdb.deliveredAt,
        deliveredById: isFullyDelivered ? user.id : stockEdb.deliveredById,
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        message: isFullyDelivered 
          ? `Stock EDB ${stockEdb.edbId} a été entièrement livré`
          : `Livraison partielle effectuée pour Stock EDB ${stockEdb.edbId}`,
        type: 'EDB_DELIVERED',
        recipients: {
          create: [
            {
              userId: stockEdb.employeeId || user.id,
            }
          ]
        }
      }
    });

    return NextResponse.json(updatedStockEdb);
  } catch (error) {
    console.error('Error in stock EDB delivery:', error);
    return new NextResponse(
      'Une erreur est survenue lors de la mise à jour de la livraison', 
      { status: 500 }
    );
  }
}