import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * DBの Date カラム用（UTC固定）
 * 例: 2026-06-01 -> 2026-06-01T00:00:00.000Z
 */
function makeUtcDateOnly(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * DBの DateTime カラム用（UTC固定）
 * 日本時間のつもりで入れたい値を、そのまま UTC の時刻として保存する。
 *
 * 例:
 * makeUtcDateTime(2026, 6, 1, 18, 0)
 * -> 2026-06-01T18:00:00.000Z
 *
 * route.ts 側で UTC の時刻部をそのまま "HH:mm" として返せば、
 * 18:00 / 03:00 のようにズレずに扱える。
 */
function makeUtcDateTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0
) {
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
}

async function main() {
  console.log('🌱 seed start');

  /**
   * 1. 既存データ削除
   * 外部キーの子から消す
   */
  await prisma.shiftComment.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.helpChat.deleteMany();
  await prisma.aiGenerationLog.deleteMany();
  await prisma.storeEvent.deleteMany();
  await prisma.eventTemplateRequirement.deleteMany();
  await prisma.eventTemplate.deleteMany();
  await prisma.staffSkill.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.store.deleteMany();

  console.log('🧹 existing data cleared');

  /**
   * 2. 店舗作成
   */
  const store = await prisma.store.create({
    data: {
      name: '希望ヶ丘店',
      areaName: '横浜市旭区',
      managerName: '横浜 旭',
    },
  });

  console.log('🏪 store created:', {
    id: store.id,
    name: store.name,
  });

  /**
   * 3. スタッフ作成
   */
  const staffYokohama = await prisma.staff.create({
    data: {
      storeId: store.id,
      name: '横浜 旭',
      role: '社員',
      email: 'yokohama@example.com',
      phone: '090-1111-1111',
    },
  });

  const staffYamada = await prisma.staff.create({
    data: {
      storeId: store.id,
      name: '山田 太郎',
      role: 'アルバイト',
      email: 'yamada@example.com',
      phone: '090-2222-2222',
    },
  });

  const staffSato = await prisma.staff.create({
    data: {
      storeId: store.id,
      name: '佐藤 美咲',
      role: 'パート',
      email: 'sato@example.com',
      phone: '090-3333-3333',
    },
  });

  const staffTest = await prisma.staff.create({
    data: {
      storeId: store.id,
      name: 'テスト太郎',
      role: 'アルバイト',
      email: 'test@example.com',
      phone: '090-4444-4444',
    },
  });

  console.log('👥 staffs created:', [
    { id: staffYokohama.id, name: staffYokohama.name },
    { id: staffYamada.id, name: staffYamada.name },
    { id: staffSato.id, name: staffSato.name },
    { id: staffTest.id, name: staffTest.name },
  ]);

  /**
   * 4. スキル作成
   */
  const skillRegister = await prisma.skill.create({
    data: { name: 'レジ' },
  });

  const skillInspection = await prisma.skill.create({
    data: { name: '検品' },
  });

  const skillStocking = await prisma.skill.create({
    data: { name: '品出し' },
  });

  console.log('🛠 skills created:', [
    { id: skillRegister.id, name: skillRegister.name },
    { id: skillInspection.id, name: skillInspection.name },
    { id: skillStocking.id, name: skillStocking.name },
  ]);

  /**
   * 5. スタッフにスキル紐付け
   */
  await prisma.staffSkill.createMany({
    data: [
      { staffId: staffYokohama.id, skillId: skillRegister.id },
      { staffId: staffYokohama.id, skillId: skillInspection.id },
      { staffId: staffYokohama.id, skillId: skillStocking.id },

      { staffId: staffYamada.id, skillId: skillRegister.id },
      { staffId: staffYamada.id, skillId: skillStocking.id },

      { staffId: staffSato.id, skillId: skillInspection.id },

      { staffId: staffTest.id, skillId: skillRegister.id },
    ],
  });

  console.log('🔗 staff skills created');

  /**
   * 6. シフト作成（UTC固定版）
   *
   * date:
   *   「この勤務をどの日のシフトとして扱うか」の基準日
   *
   * startAt / endAt:
   *   実際の勤務開始日時・終了日時
   *
   * ここでは "画面で見せたい時刻" をそのままUTC時刻として保存する。
   * route.ts 側で UTC の時刻部を読むようにすればズレない。
   */
  const shiftData = [
    // 2026-06-01 テスト太郎 18:00〜03:00（夜勤）
    {
      storeId: store.id,
      staffId: staffTest.id,
      date: makeUtcDateOnly(2026, 6, 1),
      type: '通常',
      startAt: makeUtcDateTime(2026, 6, 1, 18, 0),
      endAt: makeUtcDateTime(2026, 6, 2, 3, 0),
      status: 'draft',
    },

    // 2026-06-02 横浜 旭 18:00〜03:00（夜勤）
    {
      storeId: store.id,
      staffId: staffYokohama.id,
      date: makeUtcDateOnly(2026, 6, 2),
      type: '通常',
      startAt: makeUtcDateTime(2026, 6, 2, 18, 0),
      endAt: makeUtcDateTime(2026, 6, 3, 3, 0),
      status: 'draft',
    },

    // 2026-06-03 山田 太郎 21:00〜05:00（夜勤）
    {
      storeId: store.id,
      staffId: staffYamada.id,
      date: makeUtcDateOnly(2026, 6, 3),
      type: '通常',
      startAt: makeUtcDateTime(2026, 6, 3, 21, 0),
      endAt: makeUtcDateTime(2026, 6, 4, 5, 0),
      status: 'draft',
    },

    // 2026-06-04 佐藤 美咲 19:00〜01:00（夜勤）
    {
      storeId: store.id,
      staffId: staffSato.id,
      date: makeUtcDateOnly(2026, 6, 4),
      type: '通常',
      startAt: makeUtcDateTime(2026, 6, 4, 19, 0),
      endAt: makeUtcDateTime(2026, 6, 5, 1, 0),
      status: 'draft',
    },

    // 2026-06-05 横浜 旭 19:00〜04:00（夜勤）
    {
      storeId: store.id,
      staffId: staffYokohama.id,
      date: makeUtcDateOnly(2026, 6, 5),
      type: '通常',
      startAt: makeUtcDateTime(2026, 6, 5, 19, 0),
      endAt: makeUtcDateTime(2026, 6, 6, 4, 0),
      status: 'draft',
    },

    // 2026-06-06 山田 太郎 希望休
    {
      storeId: store.id,
      staffId: staffYamada.id,
      date: makeUtcDateOnly(2026, 6, 6),
      type: '希望休',
      startAt: null,
      endAt: null,
      status: 'draft',
    },

    // 2026-06-07 佐藤 美咲 公休
    {
      storeId: store.id,
      staffId: staffSato.id,
      date: makeUtcDateOnly(2026, 6, 7),
      type: '公休',
      startAt: null,
      endAt: null,
      status: 'draft',
    },
  ];

  await prisma.shift.createMany({
    data: shiftData,
  });

  console.log('🗓 shifts created:', shiftData.length);

  /**
   * 7. コメントサンプル
   */
  const firstShift = await prisma.shift.findFirst({
    where: {
      storeId: store.id,
      date: makeUtcDateOnly(2026, 6, 1),
    },
    orderBy: {
      id: 'asc',
    },
  });

  if (firstShift) {
    await prisma.shiftComment.create({
      data: {
        shiftId: firstShift.id,
        category: 'memo',
        comment: 'テスト用コメントです。夜勤シフトの確認用。',
      },
    });

    console.log('💬 shift comment created:', {
      shiftId: firstShift.id,
    });
  }

  /**
   * 8. 最終確認ログ
   */
  const finalStores = await prisma.store.count();
  const finalStaffs = await prisma.staff.count();
  const finalSkills = await prisma.skill.count();
  const finalShifts = await prisma.shift.count();
  const finalShiftComments = await prisma.shiftComment.count();

  console.log('📊 final counts:', {
    stores: finalStores,
    staffs: finalStaffs,
    skills: finalSkills,
    shifts: finalShifts,
    shiftComments: finalShiftComments,
  });

  console.log('✅ seed completed');
}

main()
  .catch((e) => {
    console.error('❌ seed failed');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });