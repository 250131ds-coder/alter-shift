import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function calcWorkMinutes(startAt: Date, endAt: Date): number {
  const diffMs = endAt.getTime() - startAt.getTime();
  return Math.max(0, Math.round(diffMs / 60000));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      storeId,
      staffId,
      date,
      type,
      startTime,
      endTime,
      comment,
    } = body;

    if (!storeId || !staffId || !date || !type) {
      return NextResponse.json(
        {
          error: "必須項目が不足しています",
        },
        {
          status: 400,
        }
      );
    }

    const shiftDate = new Date(date + "T00:00:00.000Z");

    let startAt: Date | null = null;
    let endAt: Date | null = null;
    let workMinutes = 0;
    let isOvernight = false;

    if (type === "通常") {
      if (!startTime || !endTime) {
        return NextResponse.json(
          {
            error: "出勤の場合は出勤時間と退勤時間が必要です",
          },
          {
            status: 400,
          }
        );
      }

      const [startH, startM] = String(startTime).split(":").map(Number);
      const [endH, endM] = String(endTime).split(":").map(Number);

      startAt = new Date(`${date}T${startTime}:00`);

      const endDateBase = new Date(date + "T00:00:00");

      if (
        endH < startH ||
        (endH === startH && endM <= startM)
      ) {
        // 終了時刻が開始時刻以前 → 翌日にまたがる夜勤とみなす
        endDateBase.setDate(endDateBase.getDate() + 1);
        isOvernight = true;
      }

      const endYear = endDateBase.getFullYear();
      const endMonth = String(endDateBase.getMonth() + 1).padStart(2, "0");
      const endDay = String(endDateBase.getDate()).padStart(2, "0");

      endAt = new Date(`${endYear}-${endMonth}-${endDay}T${endTime}:00`);

      workMinutes = calcWorkMinutes(startAt, endAt);
    }

    // ★修正箇所: 手動のtoISOString比較をやめて、DBに直接その日付で問い合わせる
    const existingShift = await prisma.shift.findFirst({
      where: {
        staffId: Number(staffId),
        date: shiftDate,
      },
    });

    let shift;

    if (existingShift) {
      // 既に登録済みなら更新
      shift = await prisma.shift.update({
        where: {
          id: existingShift.id,
        },
        data: {
          storeId: Number(storeId),
          type,
          startAt,
          endAt,
          workMinutes,
          isOvernight,
          status: "request",
        },
      });
    } else {
      // 初回なら新規作成
      shift = await prisma.shift.create({
        data: {
          storeId: Number(storeId),
          staffId: Number(staffId),
          date: shiftDate,
          type,
          startAt,
          endAt,
          workMinutes,
          isOvernight,
          status: "request",
        },
      });
    }

    if (comment && String(comment).trim().length > 0) {
      const existingComment = await prisma.shiftComment.findFirst({
        where: {
          shiftId: shift.id,
          category: "request",
        },
      });

      if (existingComment) {
        await prisma.shiftComment.update({
          where: {
            id: existingComment.id,
          },
          data: {
            comment: String(comment),
          },
        });
      } else {
        await prisma.shiftComment.create({
          data: {
            shiftId: shift.id,
            category: "request",
            comment: String(comment),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      shift,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "希望休登録に失敗しました",
      },
      {
        status: 500,
      }
    );
  }
}