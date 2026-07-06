import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * 1. 【Read】スタッフ一覧の取得 (GET)
 * データベースに登録されているすべてのスタッフ情報を取得します。
 * 所属している店舗の情報（store）も一緒にくっつけて取得（Include）します。
 */
export async function GET() {
  try {
    const staffs = await prisma.staff.findMany({
      include: {
        store: true // 💡 リレーション先の店舗情報も含めて取得する
      },
      orderBy: {
        id: 'asc'
      }
    })
    
    return NextResponse.json(staffs, { status: 200 })
  } catch (error) {
    console.error('スタッフ一覧取得エラー:', error)
    return NextResponse.json(
      { error: 'スタッフ一覧の取得に失敗しました。' }, 
      { status: 500 }
    )
  }
}

/**
 * 2. 【Create】新しいスタッフの登録 (POST)
 * 画面から送られてきたスタッフ情報（名前、役割、店舗IDなど）を保存します。
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, role, email, phone, storeId } = body

    // 必須入力チェック
    if (!name || !role || !storeId) {
      return NextResponse.json(
        { error: 'スタッフ名、役割、所属店舗は必須項目です。' }, 
        { status: 400 }
      )
    }

    // Prismaを使ってMySQLにスタッフを登録
    const newStaff = await prisma.staff.create({
      data: {
        name,
        role,
        email: email || null,
        phone: phone || null,
        storeId: Number(storeId) // 💡 画面から文字で送られてくるため数値に変換
      }
    })

    return NextResponse.json(
      { message: 'スタッフを登録しました', staff: newStaff }, 
      { status: 201 }
    )
  } catch (error) {
    console.error('スタッフ登録エラー:', error)
    return NextResponse.json(
      { error: 'スタッフの登録に失敗しました。' }, 
      { status: 500 }
    )
  }
}