// app/api/dashboard/edb-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import prisma from '@/lib/prisma';
import { Role, EDBStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    include: { employee: { include: { currentDepartment: true } } },
  });

  if (!user) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
  }

  const { role } = user;
  const departmentId = user.employee?.currentDepartmentId;

  let edbsQuery = {};

  if (role === Role.RESPONSABLE || role === Role.DIRECTEUR) {
    if (!departmentId) {
      return NextResponse.json({ error: 'Département non trouvé pour l\'utilisateur' }, { status: 400 });
    }
    edbsQuery = { where: { departmentId: departmentId } };
  }

  const edbs = await prisma.etatDeBesoin.findMany({
    ...edbsQuery,
    include: {
      finalSupplier: true,
    },
  });

  const currentDate = new Date();
  const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
  const lastHour = new Date(currentDate.getTime() - 60 * 60 * 1000);

  // Calculate aggregated data
  const total = edbs.length;
  const active = edbs.filter(edb => 
    [
      'APPROVED_DIRECTEUR',
      'APPROVED_DG',
      'MAGASINIER_ATTACHED',
      'SUPPLIER_CHOSEN',
      'COMPLETED',
      'FINAL_APPROVAL'
    ].includes(edb.status)
  ).length;
  const pending = edbs.filter(edb => 
    [
      'SUBMITTED', 
      'ESCALATED', 
      'APPROVED_RESPONSABLE',
      'AWAITING_MAGASINIER',
      'AWAITING_SUPPLIER_CHOICE',
      'AWAITING_IT_APPROVAL',
      'AWAITING_FINAL_APPROVAL'
    ].includes(edb.status)
  ).length;
  const lastMonthTotal = edbs.filter(edb => new Date(edb.createdAt) >= lastMonth).length;
  const lastHourActive = edbs.filter(edb => 
    new Date(edb.updatedAt) >= lastHour && 
    edb.status !== EDBStatus.COMPLETED && 
    edb.status !== EDBStatus.REJECTED
  ).length;

  const percentageChange = total > 0 ? ((lastMonthTotal / total) * 100).toFixed(1) : '0';

  // Calculate total amount based on finalSupplier amounts
  const totalAmount = edbs.reduce((sum, edb) => sum + (edb.finalSupplier?.amount || 0), 0);

  // Calculate weekly data
  const today = new Date();
  const monday = new Date(today.setDate(today.getDate() - today.getDay() + 1));
  monday.setHours(0, 0, 0, 0);

  const weeklyData = await prisma.etatDeBesoin.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: {
        gte: monday,
      },
      ...(role === Role.RESPONSABLE || role === Role.DIRECTEUR ? { departmentId: departmentId } : {}),
    },
    _count: {
      id: true,
    },
  });

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const chartData = await Promise.all(weekDays.map(async (day, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const dataForDay = weeklyData.find(d => new Date(d.createdAt).toDateString() === date.toDateString());
    
    const dayEDBs = await prisma.etatDeBesoin.findMany({
      where: {
        createdAt: {
          gte: date,
          lt: new Date(date.getTime() + 24 * 60 * 60 * 1000), // Next day
        },
        ...(role === Role.RESPONSABLE || role === Role.DIRECTEUR ? { departmentId: departmentId } : {}),
      },
      include: {
        finalSupplier: true,
      },
    });
    
    const amount = dayEDBs.reduce((sum, edb) => sum + (edb.finalSupplier?.amount || 0), 0);

    return {
      name: day,
      date: date.toISOString().split('T')[0],
      count: dataForDay ? dataForDay._count.id : 0,
      amount: amount,
    };
  }));

  return NextResponse.json({
    aggregatedData: {
      total,
      active,
      pending,
      totalAmount,
      percentageChange,
      lastHourActive,
    },
    chartData,
  });
}