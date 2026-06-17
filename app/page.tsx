'use client';

import React, { useState } from 'react';
import Link from 'next/link'; // ←これを追加

export default function Dashboard() {
  // モックアップ用のダミーデータ（スタッフとシフトの例）
  const [staffShifts] = useState([
    { id: 1, name: '横浜 旭', role: '店長', skills: ['レジ', 'VMD', '検品'], schedule: ['10:00-19:00', '10:00-19:00', '休み', '13:00-22:00', '10:00-19:00', '休み', '10:00-19:00'] },
    { id: 2, name: '山田 太郎', role: 'アルバイト', skills: ['レジ', '接客'], schedule: ['休み', '13:00-22:00', '10:00-19:00', '休み', '13:00-22:00', '10:00-19:00', '休み'] },
    { id: 3, name: '佐藤 美咲', role: 'パート', skills: ['レジ', '検品'], schedule: ['10:00-15:00', '休み', '10:00-15:00', '10:00-15:00', '休み', '休み', '10:00-15:00'] },
    { id: 4, name: '鈴木 一郎', role: 'アルバイト', skills: ['接客'], schedule: ['13:00-22:00', '13:00-22:00', '休み', '13:00-22:00', '13:00-22:00', '10:00-19:00', '休み'] },
  ]);

  const days = ['6/22 (月)', '6/23 (火)', '6/24 (水)', '6/25 (木)', '6/26 (金)', '6/27 (土)', '6/28 (日)'];
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // AI自動生成ボタンを押したときの疑似アクション（モック動作）
  const handleAiGenerate = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      setIsAiGenerating(false);
      alert('【モック動作】AIが店舗イベントとスタッフのスキルを分析し、最適なシフト案（下書き）を作成しました！');
    }, 2000); // 2秒間ぐるぐる回す
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-800">
      {/* ヘッダーエリア */}
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">AlterShift ── シフトダッシュボード</h1>
          <p className="text-sm text-gray-500 mt-1">アパレル・飲食対応 / 汎用型スキルパズル最適化システム</p>
        </div>
        
        {/* 独自要素：AI自動作成ボタン */}
        <button
          onClick={handleAiGenerate}
          disabled={isAiGenerating}
          className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-white shadow transition-all ${
            isAiGenerating ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 active:scale-95'
          }`}
        >
          {isAiGenerating ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              AIがシフトをお直し中...
            </>
          ) : (
            <>
              ✨ AIシフト自動作成 (最適化)
            </>
          )}
        </button>
      </header>

      {/* 今週のイベント情報（独自要素：汎用設定の見える化） */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h2 className="text-sm font-bold text-blue-800 mb-2">📢 今週の店舗イベント・必要人数要件（マスタ連動イメージ）</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-xs">
          <div className="bg-white p-2 rounded border border-blue-100"><strong>月: 通常日</strong><br/>レジ1/検品1</div>
          <div className="bg-white p-2 rounded border border-blue-100"><strong>火: 通常日</strong><br/>レジ1/接客1</div>
          <div className="bg-white p-2 rounded border border-blue-100"><strong>水: 店内棚卸</strong><br/><span className="text-red-600 font-semibold">検品2/レジ1</span></div>
          <div className="bg-white p-2 rounded border border-blue-100"><strong>木: 通常日</strong><br/>レジ1/接客1</div>
          <div className="bg-white p-2 rounded border border-blue-100"><strong>金: セール前日</strong><br/><span className="text-amber-600 font-semibold">VMD1/レジ2</span></div>
          <div className="bg-white p-2 rounded border border-blue-100"><strong>土: セール初日</strong><br/><span className="text-red-600 font-semibold">レジ3/接客4</span></div>
          <div className="bg-white p-2 rounded border border-blue-100"><strong>日: セール2日目</strong><br/><span className="text-red-600 font-semibold">レジ3/接客3</span></div>
        </div>
      </div>

      {/* メインのシフト表（カレンダーUIモックアップ） */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="p-4 text-sm font-bold text-gray-600 w-1/5">スタッフ情報 (保有スキル)</th>
                {days.map((day, index) => (
                  <th key={index} className="p-4 text-sm font-bold text-gray-600 text-center">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staffShifts.map((staff) => (
                <tr key={staff.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  {/* スタッフ名と汎用スキルタグの表示部分 */}
                  <td className="p-4">
                    <div className="font-semibold text-gray-800">{staff.name}</div>
                    <div className="text-xs text-gray-400 mb-1.5">{staff.role}</div>
                    <div className="flex flex-wrap gap-1">
                      {staff.skills.map((skill, sIdx) => (
                        <span key={sIdx} className="px-1.5 py-0.5 bg-gray-200 text-gray-700 text-[10px] rounded font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>
                  {/* 1週間分のシフト時間 */}
                  {staff.schedule.map((time, tIdx) => (
                    <td key={tIdx} className="p-4 text-center">
                      <span className={`inline-block px-3 py-1.5 rounded-md text-xs font-medium w-full max-w-[110px] ${
                        time === '休み' 
                          ? 'bg-gray-100 text-gray-400' 
                          : 'bg-green-50 text-green-700 border border-green-200'
                      }`}>
                        {time}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

{/* フッター誘導リンク（他画面への遷移を有効化！） */}
      <footer className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/staff" className="bg-white p-4 rounded-lg text-center shadow-sm border border-gray-100 cursor-pointer hover:bg-purple-50 hover:border-purple-200 transition-all block">
          <span className="text-lg">👥</span> 
          <p className="text-xs font-semibold text-gray-600 mt-1 group-hover:text-purple-700">スタッフ管理 (CRUD)</p>
        </Link>
        
        <Link href="/settings" className="bg-white p-4 rounded-lg text-center shadow-sm border border-gray-100 cursor-pointer hover:bg-purple-50 hover:border-purple-200 transition-all block">
          <span className="text-lg">⚙️</span> 
          <p className="text-xs font-semibold text-gray-600 mt-1">スキル＆イベント設定</p>
        </Link>

        <div onClick={() => alert('【モック動作】スタッフ用の希望提出画面（スマホ版）が開きます')} className="bg-white p-4 rounded-lg text-center shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-100 transition-all opacity-60">
          <span className="text-lg">📱</span> 
          <p className="text-xs font-semibold text-gray-500 mt-1">スタッフ希望提出（準備中）</p>
        </div>

        <div onClick={() => alert('【モック動作】AI打診文つきのヘルプ相談チャットが開きます')} className="bg-white p-4 rounded-lg text-center shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-100 transition-all opacity-60">
          <span className="text-lg">💬</span> 
          <p className="text-xs font-semibold text-gray-500 mt-1">ヘルプ相談チャット（準備中）</p>
        </div>
      </footer>
    </div>
  );
}