import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type ShiftType = '通常' | '希望休' | '公休' | '応援';

interface CreateShiftBody {
  storeId: number;
  staffId: number;
  date: string; // '2026-06-03'
  type: ShiftType | string;
  startTime?: string | null; // '19:00'
  endTime?: string | null;   // '04:00'
  status?: string;
}

/**
 * YYYY-MM-DD を「その日の基準日(Date)」として扱う
 * dateカラム（@db.Date）用
 */
const parseDateOnly = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day,
    12, // 正午にする
    0,
    0,
    0
  );
};

// ↓↓↓ ここに新しい2つの関数を追加 ↓↓↓
/**
 * 範囲検索用：開始日の 00:00:00 を返す
 */
const parseRangeStart = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

/**
 * 範囲検索用：終了日の「翌日 00:00:00」を返す（lt で使う）
 */
const parseRangeEndExclusive = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day + 1, 0, 0, 0, 0);
};
// ↑↑↑ ここまで追加 ↑↑↑

/**
 * YYYY-MM-DD / HH:mm から Date を作る
 * これは「ローカル時間として組み立ててDBに保存するため」の値
 */
const parseDateTime = (dateStr: string, timeStr: string) => {
  return new Date(`${dateStr}T${timeStr}:00`);
};

/**
 * YYYY-MM-DD 文字列化
 * dateカラム表示用
 */
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Date から HH:mm を取り出す
 *
 * 重要:
 * startAt / endAt は DateTime として保存されるため、
 * toISOString() などと混ぜると UTC / JST のズレが起きやすい。
 *
 * 今回は「DBに保存したローカル時刻そのものを画面表示したい」ので、
 * UTCではなくローカルの getHours/getMinutes を使う。
 */
const formatTime = (date: Date | null) => {
  if (!date) return null;

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * 夜勤判定
 * endAt が startAt 以下なら翌日勤務扱い
 */
const isOvernightShift = (startAt: Date | null, endAt: Date | null) => {
  if (!startAt || !endAt) return false;
  return endAt.getTime() <= startAt.getTime() || formatDate(startAt) !== formatDate(endAt);
};

/**
 * 勤務分数
 */
const calcWorkMinutes = (startAt: Date | null, endAt: Date | null) => {
  if (!startAt || !endAt) return 0;
  const diffMs = endAt.getTime() - startAt.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60)));
};

/**
 * 休み系シフトかどうか
 */
const isNoTimeShiftType = (type: string) => {
  return type === '希望休' || type === '公休';
};

/**
 * date + startTime/endTime から startAt/endAt を作る
 * 夜勤の場合は endAt を翌日にずらす
 */
const buildShiftDateTimes = (
  date: string,
  type: string,
  startTime?: string | null,
  endTime?: string | null
) => {
  if (isNoTimeShiftType(type)) {
    return {
      startAt: null,
      endAt: null,
    };
  }

  if (!startTime || !endTime) {
    throw new Error('通常シフトには startTime / endTime が必要です');
  }

  const startAt = parseDateTime(date, startTime);
  const endAt = parseDateTime(date, endTime);

  // 例: 19:00 → 04:00 は翌日扱い
  if (endAt.getTime() <= startAt.getTime()) {
    endAt.setDate(endAt.getDate() + 1);
  }

  return { startAt, endAt };
};

/**
 * Prismaから返る Shift の型
 * schema.prisma の startAt / endAt に合わせる
 */
type ShiftWithRelations = {
  id: number;
  date: Date;
  type: string;
  startAt: Date | null;
  endAt: Date | null;
  status: string;
  staffId: number;
  storeId: number;
  staff: {
    name: string;
    role: string;
  };
  store: {
    name: string;
  };
};

/**
 * API返却用に整形
 */
const toShiftResponse = (shift: ShiftWithRelations) => {
  const overnight = isOvernightShift(shift.startAt, shift.endAt);

  return {
    id: shift.id,
    date: formatDate(shift.date),
    type: shift.type,

    // デバッグや将来の詳細表示用に残す
    startAt: shift.startAt ? shift.startAt.toISOString() : null,
    endAt: shift.endAt ? shift.endAt.toISOString() : null,

    // 画面で使う表示向け
    startTime: formatTime(shift.startAt),
    endTime: formatTime(shift.endAt),

    isOvernight: overnight,
    workMinutes: calcWorkMinutes(shift.startAt, shift.endAt),

    status: shift.status,
    staffId: shift.staffId,
    staffName: shift.staff.name,
    role: shift.staff.role,
    storeId: shift.storeId,
    storeName: shift.store.name,
  };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const storeId = searchParams.get('storeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
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

    const start = parseRangeStart(startDate);
    const end = parseRangeEndExclusive(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return NextResponse.json(
        { error: '日付形式が不正です' },
        { status: 400 }
      );
    }

    // endDate 当日まで含めたいので date列（@db.Date）に対しては lte でOK
    const shifts = await prisma.shift.findMany({
      where: {
        storeId: numericStoreId,
        date: {
          gte: start,
          lt: end,
        },
        ...(status ? { status } : {}),
      },
      include: {
        staff: {
          select: {
            name: true,
            role: true,
          },
        },
        store: {
          select: {
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
      status,
    });

    console.log('GET /api/shifts result count:', shifts.length);

    console.log(
      'GET /api/shifts raw shifts:',
      shifts.map((shift) => ({
        id: shift.id,
        storeId: shift.storeId,
        staffId: shift.staffId,
        date: shift.date,
        type: shift.type,
        startAt: shift.startAt,
        endAt: shift.endAt,
      }))
    );

    const formatted = shifts.map((shift) =>
      toShiftResponse(shift as ShiftWithRelations)
    );

    return NextResponse.json(formatted, { status: 200 });
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateShiftBody;

    const {
      storeId,
      staffId,
      date,
      type,
      startTime = null,
      endTime = null,
      status = 'draft',
    } = body;

    if (!storeId || !Number.isInteger(Number(storeId))) {
      return NextResponse.json(
        { error: 'storeId は必須です' },
        { status: 400 }
      );
    }

    if (!staffId || !Number.isInteger(Number(staffId))) {
      return NextResponse.json(
        { error: 'staffId は必須です' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: 'date は必須です' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'type は必須です' },
        { status: 400 }
      );
    }

    const shiftDate = parseDateOnly(date);
    if (Number.isNaN(shiftDate.getTime())) {
      return NextResponse.json(
        { error: 'date の形式が不正です。YYYY-MM-DD 形式で指定してください。' },
        { status: 400 }
      );
    }

    const store = await prisma.store.findUnique({
      where: { id: Number(storeId) },
    });

    if (!store) {
      return NextResponse.json(
        { error: '指定された店舗が存在しません' },
        { status: 404 }
      );
    }

    const staff = await prisma.staff.findUnique({
      where: { id: Number(staffId) },
    });

    if (!staff) {
      return NextResponse.json(
        { error: '指定されたスタッフが存在しません' },
        { status: 404 }
      );
    }

    if (staff.storeId !== Number(storeId)) {
      return NextResponse.json(
        { error: 'このスタッフは指定店舗に所属していません' },
        { status: 400 }
      );
    }

    let startAt: Date | null = null;
    let endAt: Date | null = null;

    try {
      const built = buildShiftDateTimes(date, type, startTime, endTime);
      startAt = built.startAt;
      endAt = built.endAt;
    } catch (e) {
      return NextResponse.json(
        {
          error: e instanceof Error ? e.message : 'シフト日時の組み立てに失敗しました',
        },
        { status: 400 }
      );
    }

    // staffId + date の重複チェック
    const existing = await prisma.shift.findUnique({
      where: {
        staffId_date: {
          staffId: Number(staffId),
          date: shiftDate,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'このスタッフの同日シフトは既に存在します' },
        { status: 409 }
      );
    }

    const created = await prisma.shift.create({
      data: {
        storeId: Number(storeId),
        staffId: Number(staffId),
        date: shiftDate,
        type,
        startAt,
        endAt,
        status,
      },
      include: {
        staff: {
          select: {
            name: true,
            role: true,
          },
        },
        store: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      toShiftResponse(created as ShiftWithRelations),
      { status: 201 }
    );
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