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
        { error: "不正なテンプレートIDです" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, requirements } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { error: "イベント名は必須です" },
        { status: 400 }
      );
    }

    if (!Array.isArray(requirements) || requirements.length === 0) {
      return NextResponse.json(
        { error: "少なくとも1つのスキルに1名以上の人数を設定してください" },
        { status: 400 }
      );
    }

    const existing = await prisma.eventTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "指定されたテンプレートが見つかりません" },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.eventTemplateRequirement.deleteMany({
        where: { templateId: id },
      }),
      prisma.eventTemplate.update({
        where: { id },
        data: {
          name: String(name).trim(),
          requirements: {
            create: requirements.map(
              (r: { skillId: number; count: number }) => ({
                skillId: Number(r.skillId),
                count: Number(r.count),
              })
            ),
          },
        },
      }),
    ]);

    const updated = await prisma.eventTemplate.findUnique({
      where: { id },
      include: {
        requirements: {
          include: {
            skill: true,
          },
        },
      },
    });

    const formatted = {
      id: updated!.id,
      name: updated!.name,
      requirements: updated!.requirements.map((r) => ({
        skillId: r.skillId,
        skillName: r.skill.name,
        count: r.count,
      })),
    };

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error("イベントテンプレート更新エラー:", error);

    const errorCode =
      error instanceof Object && "code" in error
        ? (error as { code?: string }).code
        : undefined;

    if (errorCode === "P2002") {
      return NextResponse.json(
        { error: "同じ名前のイベントテンプレートが既に存在します" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "イベントテンプレートの更新に失敗しました" },
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
        { error: "不正なテンプレートIDです" },
        { status: 400 }
      );
    }

    const existing = await prisma.eventTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "指定されたテンプレートが見つかりません" },
        { status: 404 }
      );
    }

    await prisma.eventTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("イベントテンプレート削除エラー:", error);
    return NextResponse.json(
      { error: "イベントテンプレートの削除に失敗しました" },
      { status: 500 }
    );
  }
}