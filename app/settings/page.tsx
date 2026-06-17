'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  // モック用のスキルマスタデータ
  const [skills, setSkills] = useState(['レジ', 'VMD', '検品', '接客', 'キッチン', 'ホール']);
  const [newSkill, setNewSkill] = useState('');

  // モック用のイベントテンプレートデータ
  const [events, setEvents] = useState([
    { id: 1, name: '通常平日', requirements: [{ skill: 'レジ', count: 1 }, { skill: '接客', count: 1 }] },
    { id: 2, name: '週末セール日', requirements: [{ skill: 'レジ', count: 3 }, { skill: '接客', count: 4 }, { skill: 'VMD', count: 1 }] },
    { id: 3, name: '店内棚卸し', requirements: [{ skill: 'レジ', count: 1 }, { skill: '検品', count: 2 }] },
  ]);

  // スキル追加ボタンの擬似アクション
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (skills.includes(newSkill)) {
      alert('そのスキルは既に登録されています');
      return;
    }
    setSkills([...skills, newSkill]);
    setNewSkill('');
  };

  // スキル削除ボタンの擬似アクション
  const handleDeleteSkill = (skillToDelete: string) => {
    setSkills(skills.filter(skill => skill !== skillToDelete));
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
        <h1 className="text-2xl font-bold text-gray-800">⚙️ スキル ＆ イベント設定マスタ</h1>
        <p className="text-sm text-gray-500 mt-1">
          店舗独自の役割（スキル）と、日別の必要人数パターン（イベント）を自由にカスタマイズします。この設定があらゆる業種への流用を可能にします。
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左側：スキルマスタ管理（CRUDイメージ） */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🏷️</span> スキル（職能・ポジション）の定義
          </h2>
          
          {/* 追加フォーム */}
          <form onSubmit={handleAddSkill} className="mb-6 flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="例: キッチン、採寸、ラテアート等"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg shadow transition-colors"
            >
              ＋ スキルを追加
            </button>
          </form>

          {/* スキル一覧（登録されたタグの表示） */}
          <p className="text-xs text-gray-400 mb-2">現在登録されているスキル（クリックで削除可能）</p>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 text-sm rounded-lg font-medium group"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleDeleteSkill(skill)}
                  className="text-purple-400 hover:text-purple-600 font-bold text-xs"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 右側：イベントテンプレート管理（CRUDイメージ） */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📢</span> 日別イベント・必要人数のテンプレート
          </h2>

          <div className="space-y-4">
            {events.map((ev) => (
              <div key={ev.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-all">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-gray-800 text-sm">{ev.name}</h3>
                  <div className="flex gap-2">
                    <button className="text-xs text-blue-600 hover:underline">編集</button>
                    <button className="text-xs text-red-500 hover:underline">削除</button>
                  </div>
                </div>
                {/* 必要なスキルの内訳 */}
                <div className="flex flex-wrap gap-2">
                  {ev.requirements.map((req, rIdx) => (
                    <span key={rIdx} className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded">
                      {req.skill}: <strong className="text-gray-800">{req.count}名</strong>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => alert('【モック動作】新しいイベントパターン登録用のフォームが開きます')}
            className="w-full mt-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg border border-dashed border-gray-300 transition-colors"
          >
            ＋ 新しいイベントテンプレートを作成
          </button>
        </div>
      </div>
    </div>
  );
}