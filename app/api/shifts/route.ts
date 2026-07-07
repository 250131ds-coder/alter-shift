import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const formatDateOnly = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatTimeOnly = (date: Date | null) => {
  if (!date) return null;
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const storeIdParam = searchParams.get('storeId');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (!storeIdParam || !startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: 'storeId, startDate, endDate は必須です' },
        { status: 400 }
      );
    }

    const storeId = Number(storeIdParam);

    if (!Number.isInteger(storeId) || storeId <= 0) {
      return NextResponse.json(
        { error: 'storeId が不正です' },
        { status: 400 }
      );
    }

    const startDate = new Date(`${startDateParam}T00:00:00`);
    const endDate = new Date(`${endDateParam}T23:59:59`);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: '日付形式が不正です' },
        { status: 400 }
      );
    }

    const shifts = await prisma.shift.findMany({
      where: {
        storeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        staff: true,
        store: true,
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    const result = shifts.map((shift) => ({
      id: shift.id,
      date: formatDateOnly(shift.date),
      type: shift.type,
      startTime: formatTimeOnly(shift.startTime),
      endTime: formatTimeOnly(shift.endTime),
      status: shift.status,
      staffId: shift.staffId,
      staffName: shift.staff.name,
      role: shift.staff.role,
      storeId: shift.storeId,
      storeName: shift.store.name,
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('シフト一覧取得エラー:', error);
    return NextResponse.json(
      {
        error: 'シフト一覧の取得に失敗しました',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}