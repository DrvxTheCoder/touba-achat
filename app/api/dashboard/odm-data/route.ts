import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    include: { 
      employee: { 
        include: { 
          currentDepartment: true 
        } 
      } 
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
  }

  const { role } = user;
  const departmentId = user.employee?.currentDepartmentId;
  const isHRDirector = role === Role.DIRECTEUR && user.employee?.currentDepartment?.name === 'Direction Ressources Humaines';

  // Parse month and year from query parameters
  const url = new URL(req.url);
  const monthParam = url.searchParams.get('month');
  const yearParam = url.searchParams.get('year');

  const currentDate = new Date();
  const targetMonth = monthParam ? parseInt(monthParam) - 1 : currentDate.getMonth();
  const targetYear = yearParam ? parseInt(yearParam) : currentDate.getFullYear();

  const startOfMonth = new Date(targetYear, targetMonth, 1);
  const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

  // Determine department filter based on user role and department
  const departmentFilter = (role === Role.RESPONSABLE || (role === Role.DIRECTEUR && !isHRDirector))
    ? { departmentId }
    : {};

  let odmQuery = {
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
      ...departmentFilter,
    },
  };

  const odms = await prisma.ordreDeMission.findMany(odmQuery);

  // Calculate aggregated data
  const total = odms.length;
  const active = odms.filter(odm => odm.status !== 'COMPLETED' && odm.status !== 'REJECTED').length;
  const pending = odms.filter(odm => ['SUBMITTED', 'AWAITING_DIRECTOR_APPROVAL', 'AWAITING_RH_PROCESSING'].includes(odm.status)).length;
  const processedByRH = odms.filter(odm => odm.status === 'COMPLETED').length;

  // Calculate total cost sum
  const totalCostSum = odms.reduce((sum, odm) => sum + (odm.totalCost || 0), 0);

  // Calculate percentage change from previous month
  const previousMonthStart = new Date(targetYear, targetMonth - 1, 1);
  const previousMonthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

  const previousMonthOdms = await prisma.ordreDeMission.count({
    where: {
      createdAt: {
        gte: previousMonthStart,
        lte: previousMonthEnd,
      },
      ...departmentFilter,
    },
  });

  const percentageChange = previousMonthOdms > 0 
    ? (((total - previousMonthOdms) / previousMonthOdms) * 100).toFixed(1) 
    : '0';

  // Calculate weekly data
  const weeklyData = await prisma.ordreDeMission.groupBy({
    by: ['createdAt'],
    where: odmQuery.where,
    _count: {
      id: true,
    },
  });

  const startOfWeek = new Date(startOfMonth);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  
  const chartData = [];
  let currentWeekStart = new Date(startOfWeek);

  while (currentWeekStart <= endOfMonth) {
    const weekChartData = weekDays.map((day, index) => {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + index);
      const dataForDay = weeklyData.find(d => new Date(d.createdAt).toDateString() === date.toDateString());
      return {
        date: date.toISOString().split('T')[0],
        count: dataForDay ? dataForDay._count.id : 0,
      };
    });
    chartData.push(weekChartData);
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  return NextResponse.json({
    aggregatedData: {
      total,
      active,
      pending,
      processedByRH,
      totalCostSum,
      percentageChange,
    },
    chartData,
  });
}