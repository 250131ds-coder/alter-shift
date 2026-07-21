import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: { id: "asc" },
    });

    return NextResponse.json(skills, { status: 200 });
  } catch (error) {
    console.error("スキル一覧取得エラー:", error);
    return NextResponse.json(
      { error: "スキル一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { error: "スキル名は必須です" },
        { status: 400 }
      );
    }

    const trimmedName = String(name).trim();

    const existing = await prisma.skill.findUnique({
      where: { name: trimmedName },
    });

    if (existing) {
      return NextResponse.json(
        { error: "そのスキルは既に登録されています" },
        { status: 400 }
      );
    }

    const skill = await prisma.skill.create({
      data: { name: trimmedName },
    });

    return NextResponse.json(skill, { status: 201 });
  } catch (error) {
    console.error("スキル登録エラー:", error);
    return NextResponse.json(
      { error: "スキルの登録に失敗しました" },
      { status: 500 }
    );
  }
}