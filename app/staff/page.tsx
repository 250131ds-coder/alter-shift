'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Store {
  id: number;
  name: string;
}

interface Staff {
  id: number;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  storeId: number;
  store?: Store;
  storeName?: string | null;
  skills?: string[];
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const availableSkills = ['レジ', 'VMD', '検品', '接客', 'キッチン', 'ホール'];

  const [name, setName] = useState('');
  const [role, setRole] = useState('アルバイト');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [storeId, setStoreId] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [staffsRes, storesRes] = await Promise.all([
          fetch('/api/staffs'),
          fetch('/api/stores'),
        ]);

        if (!staffsRes.ok || !storesRes.ok) {
          throw new Error('データ取得に失敗しました');
        }

        const staffsData = await staffsRes.json();
        const storesData = await storesRes.json();

        setStaffList(staffsData);
        setStores(storesData);

        if (storesData.length > 0) {
          setStoreId((prev) => prev || String(storesData[0].id));
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
        alert('スタッフまたは店舗データの取得に失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const refreshStaffList = async () => {
    try {
      const res = await fetch('/api/staffs');
      if (!res.ok) throw new Error('スタッフ一覧の再取得に失敗しました');

      const data = await res.json();
      setStaffList(data);
    } catch (error) {
      console.error(error);
      alert('スタッフ一覧の再取得に失敗しました。');
    }
  };

  const handleSkillChange = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setRole('アルバイト');
    setEmail('');
    setPhone('');
    setSelectedSkills([]);

    if (stores.length > 0) {
      setStoreId(String(stores[0].id));
    } else {
      setStoreId('');
    }
  };

  const handleEditClick = (staff: Staff) => {
    setEditingId(staff.id);
    setName(staff.name);
    setRole(staff.role);
    setEmail(staff.email ?? '');
    setPhone(staff.phone ?? '');
    setStoreId(String(staff.storeId));
    setSelectedSkills(staff.skills ?? []);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (!name.trim()) {
    alert('氏名を入力してください');
    return;
  }

  if (!storeId) {
    alert('所属店舗を選択してください');
    return;
  }

  const payload = {
    name: name.trim(),
    role,
    email: email.trim() || null,
    phone: phone.trim() || null,
    storeId: Number(storeId),
    skills: selectedSkills,
  };

  try {
    if (editingId !== null) {
      const res = await fetch(`/api/staffs/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (!res.ok) {
        alert(`❌ 更新エラー: ${data.error || 'スタッフ情報の更新に失敗しました'}`);
        return;
      }

      alert('📝 スタッフ情報を更新しました！');
      resetForm();
      await refreshStaffList();
      return;
    }

    const res = await fetch('/api/staffs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    if (!res.ok) {
      alert(`❌ 登録エラー: ${data.error || 'スタッフ登録に失敗しました'}`);
      console.error('POST /api/staffs error response:', data);
      return;
    }

    alert('🎉 データベースにスタッフを登録しました！');
    resetForm();
    await refreshStaffList();
  } catch (error) {
    console.error('handleFormSubmit error:', error);
    alert('❌ 通信エラーが発生しました');
  }
};

  const handleDeleteStaff = async (id: number, staffName: string) => {
    const ok = window.confirm(`⚠️ 本当に「${staffName}」さんを削除しますか？`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/staffs/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`❌ 削除エラー: ${data.error || 'スタッフ削除に失敗しました'}`);
        return;
      }

      alert('🗑️ スタッフ情報を削除しました。');

      if (editingId === id) {
        resetForm();
      }

      await refreshStaffList();
    } catch (error) {
      console.error(error);
      alert('❌ 通信エラーが発生しました');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-800">
      <div className="mb-4">
        <Link
          href="/"
          className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium"
        >
          ← シフトダッシュボード（メイン画面）へ戻る
        </Link>
      </div>

      <header className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800">👥 スタッフ管理・DB連携版</h1>
        <p className="text-sm text-gray-500 mt-1">
          データベースと直接通信し、店舗に所属するスタッフの登録・編集・削除を行います。
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div
          className={`bg-white p-6 rounded-xl shadow-sm border h-fit xl:col-span-1 ${
            editingId !== null
              ? 'border-amber-400 ring-2 ring-amber-400/20'
              : 'border-gray-100'
          }`}
        >
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>{editingId !== null ? '✏️' : '➕'}</span>
            {editingId !== null ? 'スタッフ情報の編集' : 'スタッフ新規登録'}
          </h2>

          {stores.length === 0 ? (
            <div className="text-sm text-red-500 font-bold p-3 bg-red-50 rounded-lg">
              ⚠️ 登録されている店舗がありません。<br />
              先に
              <Link href="/stores" className="underline text-blue-600 ml-1">
                店舗管理画面（/stores）
              </Link>
              から店舗を1件以上登録してください。
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  所属店舗（必須）
                </label>
                <select
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  required
                >
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">氏名</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: 山田 花子"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">役職 / 区分</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                >
                  <option value="店長">店長</option>
                  <option value="社員">社員</option>
                  <option value="アルバイト">アルバイト</option>
                  <option value="パート">パート</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">メールアドレス</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  連絡先（電話番号）
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="090-0000-0000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  保有スキルの割り当て
                </label>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {availableSkills.map((skill) => (
                    <label
                      key={skill}
                      className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSkills.includes(skill)}
                        onChange={() => handleSkillChange(skill)}
                        className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                      />
                      {skill}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {editingId !== null && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-lg text-sm transition-colors"
                  >
                    キャンセル
                  </button>
                )}
                <button
                  type="submit"
                  className={`flex-1 py-2.5 font-semibold rounded-lg shadow transition-colors text-sm text-white ${
                    editingId !== null
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {editingId !== null ? '変更を保存する' : 'スタッフを登録する'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 xl:col-span-2 overflow-hidden">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📋</span> 所属スタッフ一覧
          </h2>

          <div className="overflow-x-auto">
            {isLoading ? (
              <p className="text-sm text-gray-500 p-4">読み込み中...</p>
            ) : staffList.length === 0 ? (
              <p className="text-sm text-gray-400 italic p-4">
                登録されているスタッフはいません。左のフォームから追加してください。
              </p>
            ) : (
              <table className="w-full min-w-[500px] text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase">
                    <th className="p-3">氏名 / 役職</th>
                    <th className="p-3">所属店舗</th>
                    <th className="p-3">連絡先</th>
                    <th className="p-3">対応可能スキル</th>
                    <th className="p-3 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {staffList.map((staff) => (
                    <tr
                      key={staff.id}
                      className={
                        editingId === staff.id
                          ? 'bg-amber-50/50 hover:bg-amber-50'
                          : 'hover:bg-gray-50'
                      }
                    >
                      <td className="p-3">
                        <div className="font-semibold text-gray-800">{staff.name}</div>
                        <div className="text-xs text-gray-400">{staff.role}</div>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold rounded">
                          {staff.store?.name || staff.storeName || `店舗ID: ${staff.storeId}`}
                        </span>
                      </td>

                      <td className="p-3 text-gray-600 text-xs">
                        <div>{staff.email || '未設定'}</div>
                        <div className="text-gray-400 mt-1">{staff.phone || '未設定'}</div>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {staff.skills && staff.skills.length > 0 ? (
                            staff.skills.map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 text-[11px] rounded font-medium"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">未設定</span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-3 text-xs">
                          <button
                            onClick={() => handleEditClick(staff)}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(staff.id, staff.name)}
                            className="text-red-500 hover:underline font-medium"
                          >
                            削除
                          </button>
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
    </div>
  );
}