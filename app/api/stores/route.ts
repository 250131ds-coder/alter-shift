import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * 1. 【Read】店舗一覧の取得 (GET)
 * デフォルトでは有効な店舗のみ返す。
 * ?includeInactive=true を付けると無効化された店舗も含めて返す。
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const stores = await prisma.store.findMany({
      where: includeInactive ? {} : { isActive: true },
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

    if (!name) {
      return NextResponse.json(
        { error: '店舗名は必須項目です。' },
        { status: 400 }
      )
    }

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