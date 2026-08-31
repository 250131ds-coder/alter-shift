'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Store {
  id: number;
  name: string;
  areaName: string | null;
  managerName: string | null;
  isActive: boolean;
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [name, setName] = useState('');
  const [areaName, setAreaName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showInactive, setShowInactive] = useState(false);

  // 編集モーダル用
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [editName, setEditName] = useState('');
  const [editAreaName, setEditAreaName] = useState('');
  const [editManagerName, setEditManagerName] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fetchStores = async () => {
    try {
      const res = await fetch(`/api/stores?includeInactive=${showInactive}`);
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

  useEffect(() => {
    setIsLoading(true);
    fetchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('店舗名を入力してください');
      return;
    }

    setIsSubmitting(true);

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
        fetchStores();
      } else {
        const errorData = await res.json();
        alert(`❌ 登録エラー: ${errorData.error}`);
      }
    } catch {
      alert('❌ 通信エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (store: Store) => {
    setEditingStore(store);
    setEditName(store.name);
    setEditAreaName(store.areaName ?? '');
    setEditManagerName(store.managerName ?? '');
    setIsModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingStore) return;

    if (!editName.trim()) {
      alert('店舗名を入力してください');
      return;
    }

    setIsSavingEdit(true);

    try {
      const res = await fetch(`/api/stores/${editingStore.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          areaName: editAreaName.trim() === '' ? null : editAreaName.trim(),
          managerName: editManagerName.trim() === '' ? null : editManagerName.trim(),
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        alert(body.error ?? '更新に失敗しました');
        return;
      }

      setStores((prev) =>
        prev.map((s) => (s.id === editingStore.id ? body : s))
      );
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('通信エラーが発生しました');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeactivate = async (store: Store) => {
    const confirmed = confirm(
      `店舗「${store.name}」を閉店（無効化）しますか？\nスタッフやシフトなどのデータは残りますが、他の画面のプルダウンには表示されなくなります。`
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/stores/${store.id}`, {
        method: 'DELETE',
      });

      const body = await res.json();

      if (!res.ok) {
        alert(body.error ?? '無効化に失敗しました');
        return;
      }

      if (showInactive) {
        setStores((prev) =>
          prev.map((s) => (s.id === store.id ? { ...s, isActive: false } : s))
        );
      } else {
        setStores((prev) => prev.filter((s) => s.id !== store.id));
      }
    } catch (error) {
      console.error(error);
      alert('通信エラーが発生しました');
    }
  };

  const handleReactivate = async (store: Store) => {
    const confirmed = confirm(`店舗「${store.name}」を再度有効化しますか？`);

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/stores/${store.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });

      const body = await res.json();

      if (!res.ok) {
        alert(body.error ?? '有効化に失敗しました');
        return;
      }

      setStores((prev) =>
        prev.map((s) => (s.id === store.id ? body : s))
      );
    } catch (error) {
      console.error(error);
      alert('通信エラーが発生しました');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-800">
      <div className="mb-4">
        <Link href="/" className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium">
          ← シフトダッシュボード（メイン画面）へ戻る
        </Link>
      </div>

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
              disabled={isSubmitting}
              className="w-full py-2.5 font-semibold rounded-lg shadow transition-colors text-sm text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300"
            >
              {isSubmitting ? '登録中...' : '店舗を登録する'}
            </button>
          </form>
        </div>

        {/* 右側：登録済み店舗一覧 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 xl:col-span-2 overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span>📋</span> 登録済み店舗一覧
            </h2>
            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="cursor-pointer"
              />
              閉店した店舗も表示する
            </label>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <p className="text-sm text-gray-500 p-4">読み込み中...</p>
            ) : stores.length === 0 ? (
              <p className="text-sm text-gray-400 italic p-4">登録されている店舗はありません。左のフォームから追加してください。</p>
            ) : (
              <table className="w-full min-w-[600px] text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase">
                    <th className="p-3">ID</th>
                    <th className="p-3">店舗名</th>
                    <th className="p-3">エリア</th>
                    <th className="p-3">店長名</th>
                    <th className="p-3">状態</th>
                    <th className="p-3">操作</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {stores.map((store) => (
                    <tr key={store.id} className={`hover:bg-gray-50 transition-colors ${!store.isActive ? 'opacity-60' : ''}`}>
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
                      <td className="p-3">
                        {store.isActive ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded font-semibold">営業中</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded font-semibold">閉店</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(store)}
                            className="text-xs text-blue-600 hover:underline font-medium"
                          >
                            編集
                          </button>
                          {store.isActive ? (
                            <button
                              type="button"
                              onClick={() => handleDeactivate(store)}
                              className="text-xs text-red-500 hover:underline font-medium"
                            >
                              閉店にする
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleReactivate(store)}
                              className="text-xs text-green-600 hover:underline font-medium"
                            >
                              再開する
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* 編集モーダル */}
      {isModalOpen && editingStore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📝 店舗情報を編集</h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">店舗名</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">エリア名</label>
                <input
                  type="text"
                  value={editAreaName}
                  onChange={(e) => setEditAreaName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">店長名 / 管理者名</label>
                <input
                  type="text"
                  value={editManagerName}
                  onChange={(e) => setEditManagerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSavingEdit}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white text-xs font-semibold rounded-lg shadow"
                >
                  {isSavingEdit ? '保存中...' : '変更を保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}