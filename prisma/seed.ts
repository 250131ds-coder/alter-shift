import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 seed start');

  // =========================
  // 1. 店舗
  // =========================
  const store = await prisma.store.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: '希望ヶ丘店',
      areaName: '横浜エリア',
      managerName: '横浜 店長',
    },
  });

  // =========================
  // 2. スタッフ
  // =========================
  const staff1 = await prisma.staff.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      storeId: store.id,
      name: '横浜 旭',
      role: '社員',
      email: 'asahi@example.com',
    },
  });

  const staff2 = await prisma.staff.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      storeId: store.id,
      name: '山田 太郎',
      role: 'アルバイト',
      email: 'yamada@example.com',
    },
  });

  const staff3 = await prisma.staff.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      storeId: store.id,
      name: '佐藤 美咲',
      role: 'パート',
      email: 'sato@example.com',
    },
  });

  const staff4 = await prisma.staff.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      storeId: store.id,
      name: 'テスト太郎',
      role: 'アルバイト',
      email: 'test@example.com',
    },
  });

  // =========================
  // 3. スキル
  // =========================
  const skillCashier = await prisma.skill.upsert({
    where: { name: 'レジ' },
    update: {},
    create: { name: 'レジ' },
  });

  const skillInspection = await prisma.skill.upsert({
    where: { name: '検品' },
    update: {},
    create: { name: '検品' },
  });

  const skillStock = await prisma.skill.upsert({
    where: { name: '品出し' },
    update: {},
    create: { name: '品出し' },
  });

  // =========================
  // 4. スタッフ×スキル
  // =========================
  await prisma.staffSkill.upsert({
    where: {
      staffId_skillId: {
        staffId: staff1.id,
        skillId: skillCashier.id,
      },
    },
    update: {},
    create: {
      staffId: staff1.id,
      skillId: skillCashier.id,
    },
  });

  await prisma.staffSkill.upsert({
    where: {
      staffId_skillId: {
        staffId: staff1.id,
        skillId: skillInspection.id,
      },
    },
    update: {},
    create: {
      staffId: staff1.id,
      skillId: skillInspection.id,
    },
  });

  await prisma.staffSkill.upsert({
    where: {
      staffId_skillId: {
        staffId: staff2.id,
        skillId: skillCashier.id,
      },
    },
    update: {},
    create: {
      staffId: staff2.id,
      skillId: skillCashier.id,
    },
  });

  await prisma.staffSkill.upsert({
    where: {
      staffId_skillId: {
        staffId: staff3.id,
        skillId: skillStock.id,
      },
    },
    update: {},
    create: {
      staffId: staff3.id,
      skillId: skillStock.id,
    },
  });

  await prisma.staffSkill.upsert({
    where: {
      staffId_skillId: {
        staffId: staff4.id,
        skillId: skillInspection.id,
      },
    },
    update: {},
    create: {
      staffId: staff4.id,
      skillId: skillInspection.id,
    },
  });

  // =========================
  // 5. テスト用シフト
  // =========================
  await prisma.shift.upsert({
    where: {
      staffId_date: {
        staffId: staff4.id,
        date: new Date('2026-06-03'),
      },
    },
    update: {
      storeId: store.id,
      type: '通常',
      startTime: new Date('1970-01-01T19:00:00'),
      endTime: new Date('1970-01-01T04:00:00'),
      status: 'draft',
    },
    create: {
      storeId: store.id,
      staffId: staff4.id,
      date: new Date('2026-06-03'),
      type: '通常',
      startTime: new Date('1970-01-01T19:00:00'),
      endTime: new Date('1970-01-01T04:00:00'),
      status: 'draft',
    },
  });

  await prisma.shift.upsert({
    where: {
      staffId_date: {
        staffId: staff1.id,
        date: new Date('2026-06-04'),
      },
    },
    update: {
      storeId: store.id,
      type: '通常',
      startTime: new Date('1970-01-01T10:00:00'),
      endTime: new Date('1970-01-01T19:00:00'),
      status: 'draft',
    },
    create: {
      storeId: store.id,
      staffId: staff1.id,
      date: new Date('2026-06-04'),
      type: '通常',
      startTime: new Date('1970-01-01T10:00:00'),
      endTime: new Date('1970-01-01T19:00:00'),
      status: 'draft',
    },
  });

  await prisma.shift.upsert({
    where: {
      staffId_date: {
        staffId: staff2.id,
        date: new Date('2026-06-05'),
      },
    },
    update: {
      storeId: store.id,
      type: '通常',
      startTime: new Date('1970-01-01T10:00:00'),
      endTime: new Date('1970-01-01T15:00:00'),
      status: 'draft',
    },
    create: {
      storeId: store.id,
      staffId: staff2.id,
      date: new Date('2026-06-05'),
      type: '通常',
      startTime: new Date('1970-01-01T10:00:00'),
      endTime: new Date('1970-01-01T15:00:00'),
      status: 'draft',
    },
  });

  await prisma.shift.upsert({
    where: {
      staffId_date: {
        staffId: staff3.id,
        date: new Date('2026-06-06'),
      },
    },
    update: {
      storeId: store.id,
      type: '通常',
      startTime: new Date('1970-01-01T10:00:00'),
      endTime: new Date('1970-01-01T14:00:00'),
      status: 'draft',
    },
    create: {
      storeId: store.id,
      staffId: staff3.id,
      date: new Date('2026-06-06'),
      type: '通常',
      startTime: new Date('1970-01-01T10:00:00'),
      endTime: new Date('1970-01-01T14:00:00'),
      status: 'draft',
    },
  });

  await prisma.shift.upsert({
    where: {
      staffId_date: {
        staffId: staff1.id,
        date: new Date('2026-06-07'),
      },
    },
    update: {
      storeId: store.id,
      type: '通常',
      startTime: new Date('1970-01-01T09:00:00'),
      endTime: new Date('1970-01-01T18:00:00'),
      status: 'draft',
    },
    create: {
      storeId: store.id,
      staffId: staff1.id,
      date: new Date('2026-06-07'),
      type: '通常',
      startTime: new Date('1970-01-01T09:00:00'),
      endTime: new Date('1970-01-01T18:00:00'),
      status: 'draft',
    },
  });

  console.log('✅ seed completed');
}

main()
  .catch((e) => {
    console.error('❌ seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });