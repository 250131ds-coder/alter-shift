'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// 店舗データの型定義
interface Store {
  id: number;
  name: string;
  areaName: string | null;
  managerName: string | null;
}

export default function StoresPage() {
  // 状態管理（DBから取得する店舗一覧、フォーム、ローディング、メッセージ）
  const [stores, setStores] = useState<Store[]>([]);
  const [name, setName] = useState('');
  const [areaName, setAreaName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 1. 【Read】最初にデータベースから店舗一覧を取得
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await fetch('/api/stores');
        if (res.ok) {
          const data = await res.json();
          setStores(data);
        }
      } catch (error) {
        console.error('店舗一覧の取得に失敗しました', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStores();
  }, []);

  // 💡 登録成功時などに、最新の一覧をDBから再取得するための関数
  const refreshStores = async () => {
    try {
      const res = await fetch('/api/stores');
      if (res.ok) {
        const data = await res.json();
        setStores(data);
      }
    } catch (error) {
      console.error('店舗一覧の再取得に失敗しました', error);
    }
  };

  // 2. 【Create】フォーム送信時にAPIを通じてMySQLへ保存する処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('店舗名を入力してください');
      return;
    }

    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, areaName, managerName }),
      });

      if (res.ok) {
        alert('🎉 データベースに店舗を登録しました！');
        setName('');
        setAreaName('');
        setManagerName('');
        // DBから最新の一覧を引っ張ってきて画面を更新
        refreshStores();
      } else {
        const errorData = await res.json();
        alert(`❌ 登録エラー: ${errorData.error}`);
      }
    } catch {
      alert('❌ 通信エラーが発生しました');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-800">
      {/* 戻るナビゲーション */}
      <div className="mb-4">
        <Link href="/" className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium">
          ← シフトダッシュボード（メイン画面）へ戻る
        </Link>
      </div>

      {/* ヘッダーエリア */}
      <header className="mb-8 bg-white p-6 rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">🏪 店舗管理・DB連携版</h1>
        <p className="text-sm text-gray-500 mt-1">
          シフト管理の土台となる店舗マスタの登録を行います。ここで登録した店舗にスタッフを紐付けます。
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* 左側：新規店舗登録フォーム */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit xl:col-span-1">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>➕</span> 店舗新規登録
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">店舗名（必須）</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 横浜西口店"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">エリア名</label>
              <input
                type="text"
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                placeholder="例: 神奈川エリア"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">店長名 / 管理者名</label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="例: 山田 太郎"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 font-semibold rounded-lg shadow transition-colors text-sm text-white bg-purple-600 hover:bg-purple-700"
            >
              店舗を登録する
            </button>
          </form>
        </div>

        {/* 右側：登録済み店舗一覧 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 xl:col-span-2 overflow-hidden">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📋</span> 登録済み店舗一覧
          </h2>

          <div className="overflow-x-auto">
            {isLoading ? (
              <p className="text-sm text-gray-500 p-4">読み込み中...</p>
            ) : stores.length === 0 ? (
              <p className="text-sm text-gray-400 italic p-4">登録されている店舗はありません。左のフォームから追加してください。</p>
            ) : (
              <table className="w-full min-w-[500px] text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase">
                    <th className="p-3">ID</th>
                    <th className="p-3">店舗名</th>
                    <th className="p-3">エリア</th>
                    <th className="p-3">店長名</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {stores.map((store) => (
                    <tr key={store.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-mono text-gray-400">{store.id}</td>
                      <td className="p-3 font-semibold text-gray-800">{store.name}</td>
                      <td className="p-3 text-gray-600">
                        {store.areaName ? (
                          <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-xs rounded">
                            {store.areaName}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">未設定</span>
                        )}
                      </td>
                      <td className="p-3 text-gray-600">{store.managerName || <span className="text-gray-400 italic text-xs">未設定</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}