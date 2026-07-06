import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const staffId = Number(id);

    if (!Number.isInteger(staffId) || staffId <= 0) {
      return NextResponse.json(
        { error: 'スタッフIDが不正です' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log(`PUT /api/staffs/${staffId} body:`, body);

    const {
      name,
      role,
      email,
      phone,
      storeId,
      skills = [],
    } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { error: '氏名は必須です' },
        { status: 400 }
      );
    }

    if (!storeId) {
      return NextResponse.json(
        { error: '所属店舗は必須です' },
        { status: 400 }
      );
    }

    const numericStoreId = Number(storeId);

    if (!Number.isInteger(numericStoreId) || numericStoreId <= 0) {
      return NextResponse.json(
        { error: '所属店舗IDが不正です' },
        { status: 400 }
      );
    }

    const existingStaff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!existingStaff) {
      return NextResponse.json(
        { error: '対象のスタッフが見つかりません' },
        { status: 404 }
      );
    }

    const existingStore = await prisma.store.findUnique({
      where: { id: numericStoreId },
    });

    if (!existingStore) {
      return NextResponse.json(
        { error: '指定された店舗が存在しません' },
        { status: 400 }
      );
    }

    // 1. スタッフ本体を更新
    await prisma.staff.update({
      where: { id: staffId },
      data: {
        name: String(name).trim(),
        role: role ? String(role) : 'アルバイト',
        email: email ? String(email).trim() || null : null,
        phone: phone ? String(phone).trim() || null : null,
        storeId: numericStoreId,
      },
    });

    // 2. 既存スキルを一旦削除
    await prisma.staffSkill.deleteMany({
      where: { staffId },
    });

    // 3. 新しいスキルを再登録
    if (Array.isArray(skills) && skills.length > 0) {
      const skillRecords = await prisma.skill.findMany({
        where: {
          name: {
            in: skills,
          },
        },
      });

      console.log('PUT selected skills:', skills);
      console.log('PUT matched skillRecords:', skillRecords);

      if (skillRecords.length > 0) {
        await prisma.staffSkill.createMany({
          data: skillRecords.map((skill) => ({
            staffId,
            skillId: skill.id,
          })),
          skipDuplicates: true,
        });
      }
    }

    // 4. 更新後データを返す
    const updatedStaff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        store: true,
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!updatedStaff) {
      return NextResponse.json(
        { error: '更新後のスタッフ取得に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        id: updatedStaff.id,
        name: updatedStaff.name,
        role: updatedStaff.role,
        email: updatedStaff.email,
        phone: updatedStaff.phone,
        storeId: updatedStaff.storeId,
        storeName: updatedStaff.store?.name ?? null,
        skills: updatedStaff.skills.map((staffSkill) => staffSkill.skill.name),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('スタッフ更新エラー:', error);
    return NextResponse.json(
      {
        error: 'スタッフ更新に失敗しました',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const staffId = Number(id);

    if (!Number.isInteger(staffId) || staffId <= 0) {
      return NextResponse.json(
        { error: 'スタッフIDが不正です' },
        { status: 400 }
      );
    }

    const existingStaff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!existingStaff) {
      return NextResponse.json(
        { error: '対象のスタッフが見つかりません' },
        { status: 404 }
      );
    }

    await prisma.staffSkill.deleteMany({
      where: { staffId },
    });

    await prisma.staff.delete({
      where: { id: staffId },
    });

    return NextResponse.json(
      { message: 'スタッフを削除しました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('スタッフ削除エラー:', error);
    return NextResponse.json(
      {
        error: 'スタッフ削除に失敗しました',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}