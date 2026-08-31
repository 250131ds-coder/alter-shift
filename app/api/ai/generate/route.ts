import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { storeId, targetMonth } = await req.json();

    const base = new Date(targetMonth);
    const year = base.getFullYear();
    const month = base.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 対象月の範囲（UTC基準で統一）
    const rangeStart = new Date(Date.UTC(year, month, 1));
    const rangeEnd = new Date(Date.UTC(year, month, daysInMonth));

    // ① スタッフ＋保有スキル
    const staffs = await prisma.staff.findMany({
      where: { storeId: Number(storeId) },
      include: { skills: { include: { skill: true } } },
      orderBy: { id: "asc" },
    });

    if (staffs.length === 0) {
      return NextResponse.json(
        { error: "スタッフが存在しません" },
        { status: 400 }
      );
    }

    // ② 対象月のイベント＋必要スキル人数
    const storeEvents = await prisma.storeEvent.findMany({
      where: {
        storeId: Number(storeId),
        date: { gte: rangeStart, lte: rangeEnd },
      },
      include: {
        template: { include: { requirements: { include: { skill: true } } } },
      },
    });

    // ③ 既存シフト（埋まっている日を把握）
    const existingShifts = await prisma.shift.findMany({
      where: {
        storeId: Number(storeId),
        date: { gte: rangeStart, lte: rangeEnd },
      },
    });
    const existingDates = new Set(
      existingShifts.map((s) => s.date.toISOString().slice(0, 10))
    );

    // ④ Geminiに渡すデータを整形
    const staffData = staffs.map((s) => ({
      id: s.id,
      name: s.name,
      skills: s.skills.map((sk) => sk.skill.name),
    }));

    const eventData = storeEvents.map((e) => ({
      date: e.date.toISOString().slice(0, 10),
      title: e.title,
      requirements:
        e.template?.requirements.map((r) => ({
          skill: r.skill.name,
          count: r.count,
        })) ?? [],
    }));

    const skippedDates = Array.from(existingDates);

    const prompt = `
    あなたはシフト作成アシスタントです。以下の条件で${year}年${month + 1}月（1日〜${daysInMonth}日）のシフト案を作成してください。

    # スタッフ一覧（id, 名前, 保有スキル）
    ${JSON.stringify(staffData, null, 2)}

    # イベント・必要人数（設定のある日のみ）
    ${JSON.stringify(eventData, null, 2)}
    ※ 記載のない日は「通常営業」とし、最低1名を配置してください（スキル指定なし）。

    # 既にシフトが確定していてスキップすべき日
    ${JSON.stringify(skippedDates)}

    # 【最重要】スキル条件について
    - イベントで特定スキルの必要人数が指定されている日は、必ずそのスキルを保有するスタッフのみを配置してください。
    - 例：「レジ2名」が必要な日は、staffDataのskills配列に "レジ" を含むスタッフを2名選んでください。skillsに"レジ"がないスタッフは絶対に選ばないでください。
    - 指定されたスキルを満たすスタッフが人数分いない場合は、無理に埋めず、不足分は配置しないでください（0名〜可能な人数のみ配置）。この場合、その日について「スキル不足のため○名しか配置できません」という情報を後述のnotesに含めてください。

    # 出力ルール
    - 上記のスキップ対象日は絶対に含めないこと
    - 出力は以下のJSON形式のみ。説明文・Markdown記法(\`\`\`など)は一切含めないこと

    {
    "shifts": [
        { "date": "YYYY-MM-DD", "staffId": 数値, "startTime": "09:00", "endTime": "18:00" }
    ],
    "notes": ["スキル不足などの補足情報があれば記載"]
    }
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    console.log("=== Gemini raw response ===", rawText);

    // Markdownのコードフェンスが混ざった場合の保険
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let parsedResponse: {
      shifts: {
        date: string;
        staffId: number;
        startTime: string;
        endTime: string;
      }[];
      notes?: string[];
    };

    try {
      parsedResponse = JSON.parse(cleaned);
    } catch (parseError) {
      await prisma.aiGenerationLog.create({
        data: {
          storeId: Number(storeId),
          targetDate: rangeStart,
          status: "error",
          errorMessage: `JSON parse失敗: ${String(parseError)}`,
        },
      });
      return NextResponse.json(
        { error: "AIの応答を解析できませんでした" },
        { status: 500 }
      );
    }

    const shiftPlan = parsedResponse.shifts;

    if (parsedResponse.notes && parsedResponse.notes.length > 0) {
      console.log("=== Gemini notes ===", parsedResponse.notes);
    }

    // ⑤ DBに反映（既存日・不正データはスキップ）
    const validStaffIds = new Set(staffs.map((s) => s.id));
    let created = 0;

    for (const item of shiftPlan) {
      if (existingDates.has(item.date)) continue;
      if (!validStaffIds.has(item.staffId)) continue;

      const [y, m, d] = item.date.split("-").map(Number);
      const [startH, startM] = item.startTime.split(":").map(Number);
      const [endH, endM] = item.endTime.split(":").map(Number);

      const date = new Date(Date.UTC(y, m - 1, d));
      const startAt = new Date(y, m - 1, d, startH, startM);
      const endAt = new Date(y, m - 1, d, endH, endM);

      try {
        await prisma.shift.create({
          data: {
            storeId: Number(storeId),
            staffId: item.staffId,
            date,
            type: "通常",
            startAt,
            endAt,
            status: "draft",
          },
        });
        created++;
      } catch {
        // unique制約違反（同時実行等）はスキップ
      }
    }

    await prisma.aiGenerationLog.create({
      data: {
        storeId: Number(storeId),
        targetDate: rangeStart,
        status: "success",
      },
    });

    return NextResponse.json({
        success: true,
        message: `${created}件のシフトをAIが作成しました`,
        notes: parsedResponse.notes ?? [],
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "AIシフト作成に失敗しました" },
      { status: 500 }
    );
  }
}