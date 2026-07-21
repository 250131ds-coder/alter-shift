import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeIdParam = searchParams.get("storeId");

    if (!storeIdParam) {
      return NextResponse.json(
        { error: "storeIdは必須です" },
        { status: 400 }
      );
    }

    const storeId = Number(storeIdParam);

    if (!Number.isInteger(storeId) || storeId <= 0) {
      return NextResponse.json(
        { error: "不正なstoreIdです" },
        { status: 400 }
      );
    }

    const templates = await prisma.eventTemplate.findMany({
      where: { storeId },
      include: {
        requirements: {
          include: {
            skill: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    const formatted = templates.map((t) => ({
      id: t.id,
      name: t.name,
      requirements: t.requirements.map((r) => ({
        skillId: r.skillId,
        skillName: r.skill.name,
        count: r.count,
      })),
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error("イベントテンプレート取得エラー:", error);
    return NextResponse.json(
      { error: "イベントテンプレートの取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, name, requirements } = body;

    if (!storeId) {
      return NextResponse.json(
        { error: "storeIdは必須です" },
        { status: 400 }
      );
    }

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

    const numericStoreId = Number(storeId);

    const store = await prisma.store.findUnique({
      where: { id: numericStoreId },
    });

    if (!store) {
      return NextResponse.json(
        { error: "指定された店舗が存在しません" },
        { status: 400 }
      );
    }

    const template = await prisma.eventTemplate.create({
      data: {
        storeId: numericStoreId,
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
      include: {
        requirements: {
          include: {
            skill: true,
          },
        },
      },
    });

    const formatted = {
      id: template.id,
      name: template.name,
      requirements: template.requirements.map((r) => ({
        skillId: r.skillId,
        skillName: r.skill.name,
        count: r.count,
      })),
    };

    return NextResponse.json(formatted, { status: 201 });
  } catch (error) {
    console.error("イベントテンプレート登録エラー:", error);

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
      { error: "イベントテンプレートの登録に失敗しました" },
      { status: 500 }
    );
  }
}