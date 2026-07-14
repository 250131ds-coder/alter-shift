import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    success: true,
    message: "AIシフト自動作成API（準備完了）",
  });
}