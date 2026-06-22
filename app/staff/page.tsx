'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// スタッフ1人あたりの型定義
interface Staff {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  skills: string[];
}

export default function StaffPage() {
  // 💡 【修正】 useState<Staff[]> と配列の型に修正
  const [staffList, setStaffList] = useState<Staff[]>([
    { id: 1, name: '横浜 旭', role: '店長', email: 'yokohama@example.com', phone: '090-0000-0000', skills: ['レジ', 'VMD', '検品'] },
    { id: 2, name: '山田 太郎', role: 'アルバイト', email: 'yamada@example.com', phone: '080-0000-0000', skills: ['レジ', '接客'] },
    { id: 3, name: '佐藤 美咲', role: 'パート', email: 'sato@example.com', phone: '070-0000-0000', skills: ['レジ', '検品'] },
    { id: 4, name: '鈴木 一郎', role: 'アルバイト', email: 'suzuki@example.com', phone: '050-0000-0000', skills: ['接客'] },
  ]);

  // 利用可能なスキルマスタ
  const availableSkills = ['レジ', 'VMD', '検品', '接客', 'キッチン', 'ホール'];

  // フォーム用State
  const [name, setName] = useState('');
  const [role, setRole] = useState('アルバイト');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // 編集モードを管理するためのState
  const [editingId, setEditingId] = useState<number | null>(null);

  // スキルのチェックボックスが変更された時の処理
  const handleSkillChange = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  // フォーム送信ハンドラー（新規登録 & 編集保存の共通化）
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert('名前とメールアドレスを入力してください');
      return;
    }

    if (editingId !== null) {
      // 【Update】既存スタッフデータの更新処理
      setStaffList(prevList =>
        prevList.map(staff =>
          staff.id === editingId
            ? { ...staff, name, role, email, phone, skills: selectedSkills }
            : staff
        )
      );
      alert('【モック動作】スタッフ情報を更新しました。');
      resetForm();
    } else {
      // 【Create】新規スタッフ登録処理
      const newStaff: Staff = {
        id: staffList.length > 0 ? Math.max(...staffList.map(s => s.id)) + 1 : 1,
        name,
        role,
        email,
        phone,
        skills: selectedSkills,
      };
      setStaffList([...staffList, newStaff]);
      alert('【モック動作】スタッフ情報を登録しました。');
      resetForm();
    }
  };

  // 編集ボタンを押した時にデータをフォームにロードする処理
  const handleEditClick = (staff: Staff) => {
    setEditingId(staff.id);
    setName(staff.name);
    setRole(staff.role);
    setEmail(staff.email);
    setPhone(staff.phone);
    setSelectedSkills(staff.skills);
  };

  // フォーム入力状態をクリアする共通処理
  const resetForm = () => {
    setEditingId(null);
    setName('');
    setRole('アルバイト');
    setEmail('');
    setPhone('');
    setSelectedSkills([]);
  };

  // スタッフ削除ボタンの擬似アクション
  const handleDeleteStaff = (id: number, staffName: string) => {
    if (confirm(`${staffName} さんを削除しますか？`)) {
      setStaffList(staffList.filter(staff => staff.id !== id));
      if (editingId === id) resetForm();
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
        <h1 className="text-2xl font-bold text-gray-800">👥 スタッフ管理・スキル紐付け</h1>
        <p className="text-sm text-gray-500 mt-1">
          店舗に所属するスタッフの登録（CRUD）と、それぞれの保有スキルの割り当てを行います。
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* 左側：登録 & 編集フォーム */}
        <div className={`bg-white p-6 rounded-xl shadow-sm border transition-all h-fit xl:col-span-1 ${editingId !== null ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-gray-100'}`}>
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>{editingId !== null ? '✏️' : '➕'}</span> 
            {editingId !== null ? 'スタッフ情報の編集' : 'スタッフ新規登録'}
          </h2>
          
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">氏名</label>
              {/* 💡 【修正】 target.value から e.target.value に修正（以下同様） */}
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 田中 太郎"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">役職 / 区分</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                placeholder="tanaka@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">連絡先（電話番号）</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="090-0000-0000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* スキル紐付けエリア */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">保有スキルの割り当て</label>
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                {availableSkills.map((skill, index) => (
                  <label key={index} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
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
                className={`flex-1 py-2.5 font-semibold rounded-lg shadow transition-colors text-sm text-white ${editingId !== null ? 'bg-amber-500 hover:bg-amber-600' : 'bg-purple-600 hover:bg-purple-700'}`}
              >
                {editingId !== null ? '変更を保存する' : 'スタッフを登録する'}
              </button>
            </div>
          </form>
        </div>

        {/* 右側：スタッフ一覧 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 xl:col-span-2 overflow-hidden">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📋</span> 所属スタッフ一覧
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase">
                  <th className="p-3">氏名 / 役職</th>
                  <th className="p-3">連絡先</th>
                  <th className="p-3">対応可能スキル（役割）</th>
                  <th className="p-3 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {staffList.map((staff) => (
                  <tr key={staff.id} className={`transition-colors ${editingId === staff.id ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-gray-50'}`}>
                    <td className="p-3">
                      <div className="font-semibold text-gray-800">{staff.name}</div>
                      <div className="text-xs text-gray-400">{staff.role}</div>
                    </td>
                    <td className="p-3 text-gray-600 text-xs">
                      <div>{staff.email}</div>
                      <div className="text-gray-400 mt-1">{staff.phone}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {staff.skills.length > 0 ? (
                          staff.skills.map((skill, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 text-[11px] rounded font-medium">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">スキルなし</span>
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
          </div>
        </div>
      </div>
    </div>
  );
}