import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * 【Update】店舗情報の編集、および有効/無効の切り替え
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "不正な店舗IDです" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, areaName, managerName, isActive } = body;

    const existing = await prisma.store.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: "指定された店舗が見つかりません" },
        { status: 404 }
      );
    }

    if (name !== undefined && !String(name).trim()) {
      return NextResponse.json(
        { error: "店舗名は必須です" },
        { status: 400 }
      );
    }

    const updated = await prisma.store.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(areaName !== undefined ? { areaName: areaName || null } : {}),
        ...(managerName !== undefined ? { managerName: managerName || null } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("店舗更新エラー:", error);
    return NextResponse.json(
      { error: "店舗の更新に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * 【Delete】論理削除（isActiveをfalseにするだけ。実データは消さない）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "不正な店舗IDです" },
        { status: 400 }
      );
    }

    const existing = await prisma.store.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: "指定された店舗が見つかりません" },
        { status: 404 }
      );
    }

    const updated = await prisma.store.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(
      { success: true, store: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("店舗の無効化エラー:", error);
    return NextResponse.json(
      { error: "店舗の無効化に失敗しました" },
      { status: 500 }
    );
  }
}