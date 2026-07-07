import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * YYYY-MM-DD 文字列を「ローカル日付の 00:00:00 / 23:59:59」で扱うための補助
 * DB の date カラムが @db.Date のため、範囲検索のズレを避ける
 */
const parseDateOnly = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);

  if (!y || !m || !d) return null;

  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return null;

  return date;
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

const endOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

/**
 * DBの日付を YYYY-MM-DD に変換
 * toISOString() だとタイムゾーンで日付ズレする可能性があるのでローカル基準で組み立てる
 */
const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Prisma の DateTime(@db.Time) を HH:mm に変換
 */
const formatTime = (value: Date | null) => {
  if (!value) return null;

  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * "19:00" -> Date
 * Shift.startTime / endTime は Prisma 上 DateTime(@db.Time) なので、
 * 保存時は適当な基準日を使って時刻だけ保持する
 */
const parseTimeToDate = (time: string | null | undefined) => {
  if (!time) return null;

  const [hours, minutes] = time.split(':').map(Number);

  if (
    hours == null ||
    minutes == null ||
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return new Date(1970, 0, 1, hours, minutes, 0, 0);
};

const normalizeShift = (shift: {
  id: number;
  date: Date;
  type: string;
  startTime: Date | null;
  endTime: Date | null;
  status: string;
  staffId: number;
  storeId: number;
  staff: {
    id: number;
    name: string;
    role: string;
  };
  store: {
    id: number;
    name: string;
  };
}) => ({
  id: shift.id,
  date: formatDate(shift.date),
  type: shift.type,
  startTime: formatTime(shift.startTime),
  endTime: formatTime(shift.endTime),
  status: shift.status,
  staffId: shift.staffId,
  staffName: shift.staff.name,
  role: shift.staff.role,
  storeId: shift.storeId,
  storeName: shift.store.name,
});

/**
 * GET /api/shifts?storeId=1&startDate=2026-06-01&endDate=2026-06-07
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const storeId = searchParams.get('storeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const staffId = searchParams.get('staffId');
    const status = searchParams.get('status');

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId は必須です' },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate と endDate は必須です' },
        { status: 400 }
      );
    }

    const numericStoreId = Number(storeId);
    if (!Number.isInteger(numericStoreId) || numericStoreId <= 0) {
      return NextResponse.json(
        { error: 'storeId が不正です' },
        { status: 400 }
      );
    }

    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);

    if (!start || !end) {
      return NextResponse.json(
        { error: '日付形式が不正です。YYYY-MM-DD を指定してください。' },
        { status: 400 }
      );
    }

    const numericStaffId =
      staffId && staffId.trim() !== '' ? Number(staffId) : undefined;

    if (
      numericStaffId !== undefined &&
      (!Number.isInteger(numericStaffId) || numericStaffId <= 0)
    ) {
      return NextResponse.json(
        { error: 'staffId が不正です' },
        { status: 400 }
      );
    }

    const shifts = await prisma.shift.findMany({
      where: {
        storeId: numericStoreId,
        date: {
          gte: startOfDay(start),
          lte: endOfDay(end),
        },
        ...(numericStaffId ? { staffId: numericStaffId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { staffId: 'asc' },
      ],
    });

    console.log('GET /api/shifts params:', {
      storeId: numericStoreId,
      startDate,
      endDate,
      staffId: numericStaffId ?? null,
      status: status ?? null,
    });

    console.log('GET /api/shifts result count:', shifts.length);

    return NextResponse.json(shifts.map(normalizeShift), { status: 200 });
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

/**
 * POST /api/shifts
 * body:
 * {
 *   "storeId": 1,
 *   "staffId": 2,
 *   "date": "2026-06-03",
 *   "type": "通常",
 *   "startTime": "19:00",
 *   "endTime": "04:00",
 *   "status": "draft"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      storeId,
      staffId,
      date,
      type,
      startTime = null,
      endTime = null,
      status = 'draft',
    } = body ?? {};

    const numericStoreId = Number(storeId);
    const numericStaffId = Number(staffId);

    if (!Number.isInteger(numericStoreId) || numericStoreId <= 0) {
      return NextResponse.json(
        { error: 'storeId が不正です' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(numericStaffId) || numericStaffId <= 0) {
      return NextResponse.json(
        { error: 'staffId が不正です' },
        { status: 400 }
      );
    }

    if (!date || typeof date !== 'string') {
      return NextResponse.json(
        { error: 'date は必須です（YYYY-MM-DD）' },
        { status: 400 }
      );
    }

    const parsedDate = parseDateOnly(date);
    if (!parsedDate) {
      return NextResponse.json(
        { error: 'date の形式が不正です（YYYY-MM-DD）' },
        { status: 400 }
      );
    }

    if (!type || typeof type !== 'string') {
      return NextResponse.json(
        { error: 'type は必須です' },
        { status: 400 }
      );
    }

    const parsedStartTime = parseTimeToDate(startTime);
    const parsedEndTime = parseTimeToDate(endTime);

    if (startTime && !parsedStartTime) {
      return NextResponse.json(
        { error: 'startTime の形式が不正です（HH:mm）' },
        { status: 400 }
      );
    }

    if (endTime && !parsedEndTime) {
      return NextResponse.json(
        { error: 'endTime の形式が不正です（HH:mm）' },
        { status: 400 }
      );
    }

    // staff が store に所属しているか確認
    const staff = await prisma.staff.findUnique({
      where: { id: numericStaffId },
      select: {
        id: true,
        name: true,
        role: true,
        storeId: true,
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: '指定された staff が存在しません' },
        { status: 404 }
      );
    }

    if (staff.storeId !== numericStoreId) {
      return NextResponse.json(
        { error: '指定された staff はこの店舗に所属していません' },
        { status: 400 }
      );
    }

    const store = await prisma.store.findUnique({
      where: { id: numericStoreId },
      select: { id: true, name: true },
    });

    if (!store) {
      return NextResponse.json(
        { error: '指定された store が存在しません' },
        { status: 404 }
      );
    }

    // 既存シフト確認（schema 側で staffId + date unique）
    const existing = await prisma.shift.findFirst({
      where: {
        staffId: numericStaffId,
        date: parsedDate,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: 'このスタッフの同日シフトは既に存在します',
          existingShiftId: existing.id,
        },
        { status: 409 }
      );
    }

    const created = await prisma.shift.create({
      data: {
        storeId: numericStoreId,
        staffId: numericStaffId,
        date: parsedDate,
        type,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        status,
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(normalizeShift(created), { status: 201 });
  } catch (error) {
    console.error('シフト作成エラー:', error);

    return NextResponse.json(
      {
        error: 'シフト作成に失敗しました',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}