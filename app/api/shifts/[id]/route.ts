import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * HH:mm → Date
 */
function buildDateTime(baseDate: Date, time: string) {
  const [h, m] = time.split(":").map(Number);

  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    h,
    m,
    0,
    0
  );
}

/**
 * PUT
 * シフト更新
 */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const body = await req.json();

    const {
      date,
      type,
      startTime,
      endTime,
      status,
      staffId,
    } = body;

    const shiftDate = new Date(date);

    let startAt: Date | null = null;
    let endAt: Date | null = null;
    let workMinutes = 0;
    let isOvernight = false;

    if (
      (type === "通常" || type === "応援") &&
      startTime &&
      endTime
    ) {
      startAt = buildDateTime(shiftDate, startTime);
      endAt = buildDateTime(shiftDate, endTime);

      // 夜勤
      if (endAt <= startAt) {
        endAt.setDate(endAt.getDate() + 1);
        isOvernight = true;
      }

      workMinutes =
        Math.floor(
          (endAt.getTime() - startAt.getTime()) / 60000
        );
    }

    const updated = await prisma.shift.update({
      where: {
        id: Number(id),
      },
      data: {
        date: shiftDate,
        staffId,
        type,
        startAt,
        endAt,
        workMinutes,
        isOvernight,
        status,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "シフト更新に失敗しました",
      },
      {
        status: 500,
      }
    );
  }
}