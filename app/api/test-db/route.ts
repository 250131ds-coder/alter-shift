import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // データベース内の「Store（店舗）」テーブルから1件データを取得してみるテスト
    // (まだデータがない場合は空の配列 [] が返ってくれば接続自体は成功です)
    const stores = await prisma.store.findMany()
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'データベースへの接続に成功しました！', 
      data: stores 
    })
  } catch (error) {
    console.error('データベース接続エラー:', error)
    return NextResponse.json({ 
      status: 'error', 
      message: 'データベースへの接続に失敗しました。', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}