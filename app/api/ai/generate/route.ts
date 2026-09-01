import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function minutesToTimeStr(totalMinutes: number) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

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

    // ③ 既存シフト（希望休・公休・通常・応援 すべて含む）
    const existingShifts = await prisma.shift.findMany({
      where: {
        storeId: Number(storeId),
        date: { gte: rangeStart, lte: rangeEnd },
      },
    });

    // 「スタッフ×日付」単位で既に何らかのレコードがある組み合わせ（重複作成を避けるため）
    const existingStaffDateSet = new Set(
      existingShifts.map(
        (s) => `${s.staffId}_${s.date.toISOString().slice(0, 10)}`
      )
    );

    // 希望休・公休（＝出勤させてはいけない日）をスタッフごとに整理
    const unavailabilityByStaff = new Map<number, string[]>();

    for (const s of existingShifts) {
      if (s.type === "希望休" || s.type === "公休") {
        const dateStr = s.date.toISOString().slice(0, 10);
        const list = unavailabilityByStaff.get(s.staffId) ?? [];
        list.push(dateStr);
        unavailabilityByStaff.set(s.staffId, list);
      }
    }

    // ④ 曜日別営業時間
    const businessHours = await prisma.storeBusinessHour.findMany({
      where: { storeId: Number(storeId) },
    });
    const hoursByDow = new Map(businessHours.map((h) => [h.dayOfWeek, h]));

    // ⑤ 対象月の各日について、その曜日の営業時間から実際の出退勤時刻を計算
    const referenceHours = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const dateObj = new Date(year, month, d);
      const dow = dateObj.getDay();
      const dateStr = `${year}-${pad2(month + 1)}-${pad2(d)}`;

      const bh = hoursByDow.get(dow);

      if (!bh) {
        return { date: dateStr, startTime: "09:00", endTime: "18:00" };
      }

      const [oh, om] = bh.openTime.split(":").map(Number);
      const [ch, cm] = bh.closeTime.split(":").map(Number);

      const startTotal = oh * 60 + om - bh.prepMinutes;
      const endTotal = ch * 60 + cm + bh.cleanupMinutes;

      return {
        date: dateStr,
        startTime: minutesToTimeStr(startTotal),
        endTime: minutesToTimeStr(endTotal),
      };
    });

    // ⑥ Geminiに渡すデータを整形
    const staffData = staffs.map((s) => ({
      id: s.id,
      name: s.name,
      skills: s.skills.map((sk) => sk.skill.name),
      unavailableDates: unavailabilityByStaff.get(s.id) ?? [],
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

    const prompt = `
    あなたはシフト作成アシスタントです。以下の条件で${year}年${month + 1}月（1日〜${daysInMonth}日）のシフト案を作成してください。

    # スタッフ一覧（id, 名前, 保有スキル, 出勤させてはいけない日付一覧 unavailableDates）
    ${JSON.stringify(staffData, null, 2)}
    ※ unavailableDatesに記載された日付は、そのスタッフの希望休・公休が既に確定しています。そのスタッフをその日に絶対に配置しないでください。
    ※ ただし、他のスタッフはその日に配置して構いません。unavailableDatesはスタッフ単位の制約であり、日付全体を除外するものではありません。

    # 各日の基準となる出退勤時刻（referenceHours）
    ${JSON.stringify(referenceHours, null, 2)}
    ※ startTime・endTimeは、その日の曜日の店舗営業時間・開店準備時間・閉店後片付け時間から既に計算済みの値です。
    ※ 通常出勤のシフトを作成する際は、この日付に対応するstartTime・endTimeを必ずそのまま使用してください。自分で時間を計算したり、09:00〜18:00などの一般的な時間を推測で使わないでください。

    # イベント・必要人数（設定のある日のみ）
    ${JSON.stringify(eventData, null, 2)}
    ※ 記載のない日は「通常営業」とし、上記referenceHoursの時間で最低1名を配置してください（スキル指定なし。ただしunavailableDatesに該当するスタッフは除く）。
    ※ イベントが設定されている日も、時間帯は同じくreferenceHoursの値を基本として使用してください。

    # 【最重要】スキル条件について
    - イベントで特定スキルの必要人数が指定されている日は、必ずそのスキルを保有するスタッフのみを配置してください。
    - 例：「レジ2名」が必要な日は、staffDataのskills配列に "レジ" を含むスタッフを2名選んでください。skillsに"レジ"がないスタッフは絶対に選ばないでください。
    - 指定されたスキルを満たすスタッフが人数分いない場合（unavailableDatesによる不足も含む）は、無理に埋めず、不足分は配置しないでください（0名〜可能な人数のみ配置）。この場合、その日について「スキル不足のため○名しか配置できません」という情報を後述のnotesに含めてください。

    # 【最重要】公平な分配について
    - スキル条件・unavailableDatesの制約を満たした上で、スタッフ間の月間の出勤日数・出勤時間ができるだけ均等になるように配置してください。
    - 特定のスタッフだけに出勤が偏り、他のスタッフの出勤が極端に少なくなることは避けてください。
    - 同一スタッフの連続勤務は、原則5日以内に収めてください。それ以上連続させる場合は、他に選択肢がない(該当スキルを持つスタッフが他にいない等)場合のみにしてください。
    - スキルが指定されていない「通常営業」の日に誰を配置するかは特に、その時点までに出勤日数が少ないスタッフを優先的に選んでください。
    - 【厳守】unavailableDatesが月内の全日を占めていないスタッフを、出勤0日のまま出力することは禁止です。「均等配分」を理由にスタッフを丸ごと除外しないでください。全スタッフに最低1日以上は必ず配置してください。

    # 出力ルール
    - unavailableDatesに該当するスタッフ×日付の組み合わせは、shiftsに絶対に含めないこと
    - 出力は以下のJSON形式のみ。説明文・Markdown記法(\`\`\`など)は一切含めないこと

    {
    "shifts": [
        { "date": "YYYY-MM-DD", "staffId": 数値, "startTime": "09:00", "endTime": "18:00" }
    ],
    "notes": ["スキル不足などの補足情報があれば記載"]
    }
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    async function generateWithRetry(maxRetries = 3) {
      let lastError: unknown;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          return await model.generateContent(prompt);
        } catch (err) {
          lastError = err;

          const status =
            err instanceof Object && "status" in err
              ? (err as { status?: number }).status
              : undefined;

          // 503(混雑)の場合のみ待ってリトライ。それ以外のエラーは即座に投げる
          if (status !== 503 || attempt === maxRetries - 1) {
            throw err;
          }

          const waitMs = 2000 * (attempt + 1); // 2秒, 4秒, 6秒...
          console.log(`Gemini 503エラー、${waitMs}ms後にリトライします (試行 ${attempt + 1}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
        }
      }

      throw lastError;
    }

    const result = await generateWithRetry();
    const rawText = result.response.text();

    console.log("=== Gemini raw response ===", rawText);

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

    // ⑦ DBに反映（スタッフ×日付単位で既存があればスキップ、不正データもスキップ）
    const validStaffIds = new Set(staffs.map((s) => s.id));
    let created = 0;
    let skippedUnavailable = 0;

    for (const item of shiftPlan) {
      const key = `${item.staffId}_${item.date}`;

      if (existingStaffDateSet.has(key)) {
        skippedUnavailable++;
        continue;
      }

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
        existingStaffDateSet.add(key);
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
        message: `${created}件のシフトをAIが作成しました${
          skippedUnavailable > 0
            ? `（希望休等との重複により${skippedUnavailable}件はスキップ）`
            : ""
        }`,
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