import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const staffs = await prisma.staff.findMany({
      include: {
        store: true,
        skills: {
          include: {
            skill: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    // フロントで使いやすい形に整形
    const formatted = staffs.map((staff) => ({
      id: staff.id,
      name: staff.name,
      role: staff.role,
      email: staff.email,
      phone: staff.phone,
      storeId: staff.storeId,
      storeName: staff.store?.name ?? null,
      skills: staff.skills.map((s) => s.skill.name),
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error('スタッフ一覧取得エラー:', error);
    return NextResponse.json(
      { error: 'スタッフ一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, role, email, phone, storeId, skills = [] } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: '氏名は必須です' }, { status: 400 });
    }

    if (!storeId) {
      return NextResponse.json({ error: '所属店舗は必須です' }, { status: 400 });
    }

    const numericStoreId = Number(storeId);
    if (!Number.isInteger(numericStoreId) || numericStoreId <= 0) {
      return NextResponse.json({ error: '所属店舗IDが不正です' }, { status: 400 });
    }

    const existingStore = await prisma.store.findUnique({
      where: { id: numericStoreId },
    });

    if (!existingStore) {
      return NextResponse.json({ error: '指定された店舗が存在しません' }, { status: 400 });
    }

    // 選択されたスキル名から skill レコードを取得
    const skillRecords = Array.isArray(skills) && skills.length > 0
      ? await prisma.skill.findMany({
          where: {
            name: {
              in: skills,
            },
          },
        })
      : [];

    const createdStaff = await prisma.staff.create({
      data: {
        name: String(name).trim(),
        role: role ? String(role) : 'アルバイト',
        email: email && String(email).trim() !== '' ? String(email).trim() : null,
        phone: phone && String(phone).trim() !== '' ? String(phone).trim() : null,
        storeId: numericStoreId,
        skills: {
          create: skillRecords.map((skill) => ({
            skillId: skill.id,
          })),
        },
      },
      include: {
        store: true,
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        id: createdStaff.id,
        name: createdStaff.name,
        role: createdStaff.role,
        email: createdStaff.email,
        phone: createdStaff.phone,
        storeId: createdStaff.storeId,
        storeName: createdStaff.store?.name ?? null,
        skills: createdStaff.skills.map((s) => s.skill.name),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('スタッフ登録エラー:', error);
    return NextResponse.json(
      { error: 'スタッフ登録に失敗しました' },
      { status: 500 }
    );
  }
}