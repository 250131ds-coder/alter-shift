import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { storeId } = await req.json();

    if (!storeId) {
      return NextResponse.json(
        { error: "storeIdは必須です" },
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

    const now = new Date();
    const rangeStart = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    );
    const rangeEnd = new Date(rangeStart);
    rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 60);

    const storeEvents = await prisma.storeEvent.findMany({
      where: {
        storeId: numericStoreId,
        date: { gte: rangeStart, lte: rangeEnd },
        templateId: { not: null },
      },
      include: {
        template: {
          include: {
            requirements: { include: { skill: true } },
          },
        },
      },
      orderBy: { date: "asc" },
    });

    if (storeEvents.length === 0) {
      return NextResponse.json({ hasShortage: false });
    }

    const shifts = await prisma.shift.findMany({
      where: {
        storeId: numericStoreId,
        date: { gte: rangeStart, lte: rangeEnd },
        type: { notIn: ["希望休", "公休"] },
      },
      include: {
        staff: { include: { skills: { include: { skill: true } } } },
      },
    });

    type Shortage = {
      date: string;
      title: string;
      skillName: string;
      required: number;
      assigned: number;
      shortage: number;
    };

    let found: Shortage | null = null;

    for (const event of storeEvents) {
      if (!event.template) continue;

      const dateStr = event.date.toISOString().slice(0, 10);
      const shiftsOnDate = shifts.filter(
        (s) => s.date.toISOString().slice(0, 10) === dateStr
      );

      for (const req of event.template.requirements) {
        const assigned = shiftsOnDate.filter((s) =>
          s.staff.skills.some((sk) => sk.skillId === req.skillId)
        ).length;

        const shortageCount = req.count - assigned;

        if (shortageCount > 0) {
          found = {
            date: dateStr,
            title: event.title,
            skillName: req.skill.name,
            required: req.count,
            assigned,
            shortage: shortageCount,
          };
          break;
        }
      }

      if (found) break;
    }

    if (!found) {
      return NextResponse.json({ hasShortage: false });
    }

    const analysisText = `${found.date}の「${found.title}」で${found.skillName}保有者が${found.shortage}名不足しています。他店舗へ応援要請を行いますか？`;

    const prompt = `
あなたは小売店の店長アシスタントです。以下の情報をもとに、他店舗の店長へ人員応援を依頼する丁寧なチャットメッセージを1つ作成してください。

# 依頼元店舗
${store.name}

# 不足状況
日付: ${found.date}
イベント: ${found.title}
必要スキル: ${found.skillName}
不足人数: ${found.shortage}名

# 出力ルール
- 敬語を使い、簡潔で自然な日本語のチャットメッセージにすること
- 挨拶・要件・依頼を1〜3文程度でまとめること
- 説明文やMarkdown記法は一切含めず、メッセージ本文のみを出力すること
`;

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const result = await model.generateContent(prompt);
    const draftMessage = result.response.text().replace(/```/g, "").trim();

    return NextResponse.json({
      hasShortage: true,
      analysisText,
      draftMessage,
      eventDate: found.date,
      eventTitle: found.title,
      skillName: found.skillName,
      shortage: found.shortage,
    });
  } catch (error) {
    console.error("ヘルプ提案生成エラー:", error);
    return NextResponse.json(
      { error: "AI提案の生成に失敗しました" },
      { status: 500 }
    );
  }
}