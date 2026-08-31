import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const aStoreIdParam = searchParams.get("fromStoreId");
    const bStoreIdParam = searchParams.get("toStoreId");

    if (!aStoreIdParam || !bStoreIdParam) {
      return NextResponse.json(
        { error: "fromStoreId・toStoreIdは必須です" },
        { status: 400 }
      );
    }

    const aStoreId = Number(aStoreIdParam);
    const bStoreId = Number(bStoreIdParam);

    const messages = await prisma.helpChat.findMany({
      where: {
        OR: [
          { fromStoreId: aStoreId, toStoreId: bStoreId },
          { fromStoreId: bStoreId, toStoreId: aStoreId },
        ],
      },
      include: {
        fromStore: true,
        toStore: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const formatted = messages.map((m) => ({
      id: m.id,
      fromStoreId: m.fromStoreId,
      toStoreId: m.toStoreId,
      fromStoreName: m.fromStore.name,
      toStoreName: m.toStore?.name ?? null,
      message: m.message,
      isAi: m.isAi,
      sentAt: m.sentAt,
      createdAt: m.createdAt,
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error("ヘルプチャット取得エラー:", error);
    return NextResponse.json(
      { error: "チャット履歴の取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromStoreId, toStoreId, message, isAi } = body;

    if (!fromStoreId || !toStoreId || !message || !String(message).trim()) {
      return NextResponse.json(
        { error: "fromStoreId・toStoreId・messageは必須です" },
        { status: 400 }
      );
    }

    const numericFromStoreId = Number(fromStoreId);
    const numericToStoreId = Number(toStoreId);

    if (numericFromStoreId === numericToStoreId) {
      return NextResponse.json(
        { error: "自店舗と宛先店舗が同じです" },
        { status: 400 }
      );
    }

    const [fromStore, toStore] = await Promise.all([
      prisma.store.findUnique({ where: { id: numericFromStoreId } }),
      prisma.store.findUnique({ where: { id: numericToStoreId } }),
    ]);

    if (!fromStore || !toStore) {
      return NextResponse.json(
        { error: "指定された店舗が存在しません" },
        { status: 400 }
      );
    }

    const created = await prisma.helpChat.create({
      data: {
        fromStoreId: numericFromStoreId,
        toStoreId: numericToStoreId,
        message: String(message).trim(),
        isAi: Boolean(isAi),
        status: "sent",
        sentAt: new Date(),
      },
      include: {
        fromStore: true,
        toStore: true,
      },
    });

    const formatted = {
      id: created.id,
      fromStoreId: created.fromStoreId,
      toStoreId: created.toStoreId,
      fromStoreName: created.fromStore.name,
      toStoreName: created.toStore?.name ?? null,
      message: created.message,
      isAi: created.isAi,
      sentAt: created.sentAt,
      createdAt: created.createdAt,
    };

    return NextResponse.json(formatted, { status: 201 });
  } catch (error) {
    console.error("ヘルプチャット送信エラー:", error);
    return NextResponse.json(
      { error: "メッセージの送信に失敗しました" },
      { status: 500 }
    );
  }
}