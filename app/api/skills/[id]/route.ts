import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "不正なスキルIDです" },
        { status: 400 }
      );
    }

    const existing = await prisma.skill.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "指定されたスキルが見つかりません" },
        { status: 404 }
      );
    }

    await prisma.skill.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("スキル削除エラー:", error);
    return NextResponse.json(
      { error: "スキルの削除に失敗しました" },
      { status: 500 }
    );
  }
}