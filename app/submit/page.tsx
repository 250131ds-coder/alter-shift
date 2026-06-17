'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function SubmitPage() {
  const days = [
    { id: 'mon', label: '6/22 (月)' },
    { id: 'tue', label: '6/23 (火)' },
    { id: 'wed', label: '6/24 (水)' },
    { id: 'thu', label: '6/25 (木)' },
    { id: 'fri', label: '6/26 (金)' },
    { id: 'sat', label: '6/27 (土)' },
    { id: 'sun', label: '6/28 (日)' },
  ];

  // フォーム送信の擬似アクション
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('【モック動作】シフト希望を店長（システム）に送信しました！');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 text-gray-800 flex justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* ヘッダー（スマホ対応を意識） */}
        <div className="bg-purple-600 p-6 text-white text-center">
          <h1 className="text-xl font-bold">📱 シフト希望 提出フォーム</h1>
          <p className="text-xs text-purple-100 mt-1">対象期間: 6/22 〜 6/28</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 名前入力用（本来はログインユーザー情報が入る） */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">あなたの氏名</label>
            <input 
              type="text" 
              placeholder="例: 山田 太郎" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
              required
            />
          </div>

          <hr className="border-gray-100" />

          {/* 1週間分の希望入力エリア */}
          <div className="space-y-4">
            <label className="block text-xs font-bold text-gray-500">日別の希望時間</label>
            
            {days.map((day) => (
              <div key={day.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 gap-2">
                <span className="text-sm font-semibold text-gray-700 w-24">{day.label}</span>
                
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <select className="px-2 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-purple-500">
                    <option value="work">出勤希望</option>
                    <option value="off">終日休み</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="10:00-19:00" 
                    className="w-28 px-2 py-1.5 bg-white border border-gray-300 rounded-md text-xs text-center"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* メモ書き */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">店長への連絡事項（備考）</label>
            <textarea 
              rows={2} 
              placeholder="例: 水曜日は学校の講義のため、15時以降なら入れます。"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* 送信ボタン */}
          <button
            type="submit"
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow transition-all active:scale-98 text-sm"
          >
            シフト希望を提出する
          </button>
        </form>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 text-center">
          <Link href="/" className="text-xs text-purple-600 hover:underline font-medium">
            ← 店長用ダッシュボードへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}