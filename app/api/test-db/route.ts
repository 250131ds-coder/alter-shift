import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // 1. データベースへのシンプルなクエリ送信テスト
    // 最も軽量なテーブルである「Store(店舗)」テーブルから全件取得を試みます
    const stores = await prisma.store.findMany()

    // 2. 接続成功時のレスポンス
    console.log('✅ データベース接続状況: 接続できました。')
    return NextResponse.json({
      status: 'success',
      message: '接続できました',
      timestamp: new Date().toISOString(),
      recordCount: stores.length,
      data: stores // データベースが空の場合は空の配列 [] が表示されます
    })

  } catch (error) {
    // 3. 接続失敗時の例外キャッチとエラー内容の出力
    console.error('❌ データベース接続エラーが発生しました:')
    console.error(error)

    return NextResponse.json({
      status: 'error',
      message: 'データベースへの接続に失敗しました。',
      errorDetails: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}