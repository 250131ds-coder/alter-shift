import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "不正なイベントIDです" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, templateId } = body;

    if (!title || !String(title).trim()) {
      return NextResponse.json(
        { error: "タイトルは必須です" },
        { status: 400 }
      );
    }

    const existing = await prisma.storeEvent.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "指定されたイベントが見つかりません" },
        { status: 404 }
      );
    }

    let numericTemplateId: number | null = null;

    if (templateId !== null && templateId !== undefined && templateId !== "") {
      numericTemplateId = Number(templateId);

      const template = await prisma.eventTemplate.findUnique({
        where: { id: numericTemplateId },
      });

      if (!template || template.storeId !== existing.storeId) {
        return NextResponse.json(
          { error: "指定されたテンプレートが見つかりません" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.storeEvent.update({
      where: { id },
      data: {
        title: String(title).trim(),
        templateId: numericTemplateId,
      },
      include: {
        template: {
          include: {
            requirements: {
              include: { skill: true },
            },
          },
        },
      },
    });

    const formatted = {
      id: updated.id,
      date: updated.date.toISOString().slice(0, 10),
      title: updated.title,
      templateId: updated.templateId,
      template: updated.template
        ? {
            id: updated.template.id,
            name: updated.template.name,
            requirements: updated.template.requirements.map((r) => ({
              skillId: r.skillId,
              skillName: r.skill.name,
              count: r.count,
            })),
          }
        : null,
    };

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error("店舗イベント更新エラー:", error);

    const errorCode =
      error instanceof Object && "code" in error
        ? (error as { code?: string }).code
        : undefined;

    if (errorCode === "P2002") {
      return NextResponse.json(
        { error: "その日には同じタイトルのイベントが既に登録されています" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "店舗イベントの更新に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "不正なイベントIDです" },
        { status: 400 }
      );
    }

    const existing = await prisma.storeEvent.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "指定されたイベントが見つかりません" },
        { status: 404 }
      );
    }

    await prisma.storeEvent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("店舗イベント削除エラー:", error);
    return NextResponse.json(
      { error: "店舗イベントの削除に失敗しました" },
      { status: 500 }
    );
  }
}