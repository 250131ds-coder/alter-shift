import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * 1. 【Read】店舗一覧の取得 (GET)
 */
export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      orderBy: {
        id: 'asc'
      }
    })
    return NextResponse.json(stores, { status: 200 })
  } catch (error) {
    console.error('店舗一覧取得エラー:', error)
    return NextResponse.json(
      { error: '店舗一覧の取得に失敗しました。' }, 
      { status: 500 }
    )
  }
}

/**
 * 2. 【Create】新しい店舗の登録 (POST)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, areaName, managerName } = body

    // 必須入力チェック
    if (!name) {
      return NextResponse.json(
        { error: '店舗名は必須項目です。' }, 
        { status: 400 }
      )
    }

    // Prismaを使ってMySQLに店舗を登録
    const newStore = await prisma.store.create({
      data: {
        name,
        areaName: areaName || null,
        managerName: managerName || null
      }
    })

    return NextResponse.json(newStore, { status: 201 })
  } catch (error) {
    console.error('店舗登録エラー:', error)
    return NextResponse.json(
      { error: '店舗の登録に失敗しました。' }, 
      { status: 500 }
    )
  }
}