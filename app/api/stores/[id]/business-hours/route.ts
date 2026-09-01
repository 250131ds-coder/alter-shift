import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const storeId = Number(idParam);

    if (!Number.isInteger(storeId) || storeId <= 0) {
      return NextResponse.json(
        { error: "不正な店舗IDです" },
        { status: 400 }
      );
    }

    const rows = await prisma.storeBusinessHour.findMany({
      where: { storeId },
    });

    const byDow = new Map(rows.map((r) => [r.dayOfWeek, r]));

    const result = Array.from({ length: 7 }, (_, dayOfWeek) => {
      const row = byDow.get(dayOfWeek);

      return {
        dayOfWeek,
        openTime: row?.openTime ?? "",
        closeTime: row?.closeTime ?? "",
        prepMinutes: row?.prepMinutes ?? 0,
        cleanupMinutes: row?.cleanupMinutes ?? 0,
        configured: Boolean(row),
      };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("営業時間取得エラー:", error);
    return NextResponse.json(
      { error: "営業時間の取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const storeId = Number(idParam);

    if (!Number.isInteger(storeId) || storeId <= 0) {
      return NextResponse.json(
        { error: "不正な店舗IDです" },
        { status: 400 }
      );
    }

    const store = await prisma.store.findUnique({ where: { id: storeId } });

    if (!store) {
      return NextResponse.json(
        { error: "指定された店舗が見つかりません" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { hours } = body;

    if (!Array.isArray(hours)) {
      return NextResponse.json(
        { error: "hoursは配列で送ってください" },
        { status: 400 }
      );
    }

    type HourInput = {
      dayOfWeek: number;
      openTime: string;
      closeTime: string;
      prepMinutes: number;
      cleanupMinutes: number;
    };

    const results = [];

    for (const h of hours as HourInput[]) {
      const dayOfWeek = Number(h.dayOfWeek);

      if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        continue;
      }

      // 開店・閉店どちらも未入力の場合は「その曜日は設定なし」として扱い、既存行があれば削除
      if (!h.openTime && !h.closeTime) {
        await prisma.storeBusinessHour.deleteMany({
          where: { storeId, dayOfWeek },
        });
        continue;
      }

      if (!h.openTime || !h.closeTime) {
        return NextResponse.json(
          { error: `曜日${dayOfWeek}: 開店時刻・閉店時刻は両方入力してください` },
          { status: 400 }
        );
      }

      const updated = await prisma.storeBusinessHour.upsert({
        where: {
          storeId_dayOfWeek: { storeId, dayOfWeek },
        },
        update: {
          openTime: h.openTime,
          closeTime: h.closeTime,
          prepMinutes: Number(h.prepMinutes) || 0,
          cleanupMinutes: Number(h.cleanupMinutes) || 0,
        },
        create: {
          storeId,
          dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
          prepMinutes: Number(h.prepMinutes) || 0,
          cleanupMinutes: Number(h.cleanupMinutes) || 0,
        },
      });

      results.push(updated);
    }

    return NextResponse.json({ success: true, hours: results }, { status: 200 });
  } catch (error) {
    console.error("営業時間更新エラー:", error);
    return NextResponse.json(
      { error: "営業時間の更新に失敗しました" },
      { status: 500 }
    );
  }
}