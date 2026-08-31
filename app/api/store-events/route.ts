import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeIdParam = searchParams.get("storeId");
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");

    if (!storeIdParam || !yearParam || !monthParam) {
      return NextResponse.json(
        { error: "storeId・year・monthは必須です" },
        { status: 400 }
      );
    }

    const storeId = Number(storeIdParam);
    const year = Number(yearParam);
    const month = Number(monthParam);

    if (
      !Number.isInteger(storeId) ||
      storeId <= 0 ||
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return NextResponse.json(
        { error: "不正なパラメータです" },
        { status: 400 }
      );
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const rangeStart = new Date(Date.UTC(year, month - 1, 1));
    const rangeEnd = new Date(Date.UTC(year, month - 1, daysInMonth));

    const events = await prisma.storeEvent.findMany({
      where: {
        storeId,
        date: { gte: rangeStart, lte: rangeEnd },
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
      orderBy: { date: "asc" },
    });

    const formatted = events.map((e) => ({
      id: e.id,
      date: e.date.toISOString().slice(0, 10),
      title: e.title,
      templateId: e.templateId,
      template: e.template
        ? {
            id: e.template.id,
            name: e.template.name,
            requirements: e.template.requirements.map((r) => ({
              skillId: r.skillId,
              skillName: r.skill.name,
              count: r.count,
            })),
          }
        : null,
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error("店舗イベント取得エラー:", error);
    return NextResponse.json(
      { error: "店舗イベントの取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, date, title, templateId } = body;

    if (!storeId || !date || !title || !String(title).trim()) {
      return NextResponse.json(
        { error: "storeId・date・titleは必須です" },
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

    let numericTemplateId: number | null = null;

    if (templateId !== null && templateId !== undefined && templateId !== "") {
      numericTemplateId = Number(templateId);

      const template = await prisma.eventTemplate.findUnique({
        where: { id: numericTemplateId },
      });

      if (!template || template.storeId !== numericStoreId) {
        return NextResponse.json(
          { error: "指定されたテンプレートが見つかりません" },
          { status: 400 }
        );
      }
    }

    const eventDate = new Date(date + "T00:00:00.000Z");

    const created = await prisma.storeEvent.create({
      data: {
        storeId: numericStoreId,
        date: eventDate,
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
      id: created.id,
      date: created.date.toISOString().slice(0, 10),
      title: created.title,
      templateId: created.templateId,
      template: created.template
        ? {
            id: created.template.id,
            name: created.template.name,
            requirements: created.template.requirements.map((r) => ({
              skillId: r.skillId,
              skillName: r.skill.name,
              count: r.count,
            })),
          }
        : null,
    };

    return NextResponse.json(formatted, { status: 201 });
  } catch (error) {
    console.error("店舗イベント登録エラー:", error);

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
      { error: "店舗イベントの登録に失敗しました" },
      { status: 500 }
    );
  }
}