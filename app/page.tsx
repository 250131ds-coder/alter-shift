'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// 初期スタッフデータ（1週間分フル対応、数値データ形式を維持）
const initialStaffRows = [
  { 
    name: '横浜 旭', 
    role: '社員', 
    shifts: {
      mon: { text: '10:00-19:00', start: 10, end: 19, color: 'bg-indigo-500' },
      tue: { text: '10:00-19:00', start: 10, end: 19, color: 'bg-indigo-500' },
      wed: { text: '10:00-19:00', start: 10, end: 19, color: 'bg-indigo-500' },
      thu: { text: '10:00-19:00', start: 10, end: 19, color: 'bg-indigo-500' },
      fri: { text: '10:00-19:00', start: 10, end: 19, color: 'bg-indigo-500' },
      sat: { text: '09:00-18:00', start: 9, end: 18, color: 'bg-indigo-500' },
      sun: { text: '09:00-18:00', start: 9, end: 18, color: 'bg-indigo-500' },
    }
  },
  { 
    name: '山田 太郎', 
    role: 'アルバイト', 
    shifts: {
      mon: { text: '10:00-15:00', start: 10, end: 15, color: 'bg-purple-500' },
      tue: { text: '不足', start: 0, end: 0, color: '' }, // 不足エリア
      wed: { text: '10:00-15:00', start: 10, end: 15, color: 'bg-purple-500' },
      thu: { text: '10:00-15:00', start: 10, end: 15, color: 'bg-purple-500' },
      fri: { text: '10:00-15:00', start: 10, end: 15, color: 'bg-purple-500' },
      sat: { text: '10:00-19:00', start: 10, end: 19, color: 'bg-purple-500' },
      sun: { text: '公休', start: 0, end: 0, color: '' },
    }
  },
  { 
    name: '佐藤 美咲', 
    role: 'パート', 
    shifts: {
      mon: { text: '公休', start: 0, end: 0, color: '' },
      tue: { text: '10:00-14:00', start: 10, end: 14, color: 'bg-pink-500' },
      wed: { text: '公休', start: 0, end: 0, color: '' },
      thu: { text: '10:00-14:00', start: 10, end: 14, color: 'bg-pink-500' },
      fri: { text: '10:00-14:00', start: 10, end: 14, color: 'bg-pink-500' },
      sat: { text: '12:00-21:00', start: 12, end: 21, color: 'bg-pink-500' },
      sun: { text: '12:00-21:00', start: 12, end: 21, color: 'bg-pink-500' },
    }
  },
];

// 初期メーターデータ（デモのため火曜だけ警告）
const initialCoverageMeter = {
  mon: { status: '充足', label: '適正', width: 'w-full', color: 'bg-green-500' },
  tue: { status: '警告', label: '14-19時 不足', width: 'w-3/5', color: 'bg-red-500 animate-pulse' },
  wed: { status: '充足', label: '適正', width: 'w-full', color: 'bg-green-500' },
  thu: { status: '充足', label: '適正', width: 'w-full', color: 'bg-green-500' },
  fri: { status: '充足', label: '適正', width: 'w-full', color: 'bg-green-500' },
  sat: { status: '充足', label: '適正', width: 'w-full', color: 'bg-green-500' },
  sun: { status: '充足', label: '適正', width: 'w-full', color: 'bg-green-500' },
};

export default function Dashboard() {
  const [staffRows, setStaffRows] = useState(initialStaffRows);
  const [availableHelpers, setAvailableHelpers] = useState([
    { id: 'helper-1', name: '鈴木 一郎', time: '13:00 - 18:00', start: 13, end: 18, skill: '検品持ち' },
    { id: 'helper-2', name: '田中 次郎', time: '10:00 - 16:00', start: 10, end: 16, skill: 'レジのみ' },
  ]);
  
  const [isSpinning, setIsSpinning] = useState(false);

  // 【相談対応】過不足メーターをStateに持たせ、リアルタイム連動できるようにします
  const [coverageMeter, setCoverageMeter] = useState(initialCoverageMeter);

  const days: { key: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'; label: string; bg?: string }[] = [
    { key: 'mon', label: '6/22 (月)' },
    { key: 'tue', label: '6/23 (火)', bg: 'bg-red-50/40' },
    { key: 'wed', label: '6/24 (水)' },
    { key: 'thu', label: '6/25 (木)' },
    { key: 'fri', label: '6/26 (金)' },
    { key: 'sat', label: '6/27 (土)', bg: 'bg-blue-50/40' },
    { key: 'sun', label: '6/28 (日)', bg: 'bg-red-50/40' },
  ];

  const handleAiClick = () => {
    setIsSpinning(true);
    setTimeout(() => {
      setIsSpinning(false);
      alert('【AI自動シフト作成】各スタッフの保有スキル、24時間の過不足時間帯を計算し、最適なバー配置を行いました！');
    }, 1200);
  };

  const handleDragStart = (e: React.DragEvent, helperId: string) => {
    e.dataTransfer.setData('text/plain', helperId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // 【相談対応：神UX連動】ドロップされた時の処理を強化
  const handleDrop = (e: React.DragEvent, dayKey: string) => {
    e.preventDefault();
    const helperId = e.dataTransfer.getData('text/plain');
    const droppedHelper = availableHelpers.find(h => h.id === helperId);

    if (droppedHelper) {
      // 1. 【画面反映】カレンダーの「不足」エリアへバーを配置（これで赤枠警告が消える）
      setStaffRows(prev => prev.map(row => {
        if (row.name === '山田 太郎') {
          return { 
            ...row, 
            shifts: {
              ...row.shifts,
              [dayKey]: { text: `${droppedHelper.name} (${droppedHelper.time})`, start: droppedHelper.start, end: droppedHelper.end, color: 'bg-emerald-600 font-bold' }
            }
          };
        }
        return row;
      }));
      setAvailableHelpers(prev => prev.filter(h => h.id !== helperId));

      // 2. 【メーター連動】対応する曜日（火曜）のメーターを充足状態へリアルタイム変化させる
      setCoverageMeter(prev => ({
        ...prev,
        [dayKey]: { status: '充足', label: '適正', width: 'w-full', color: 'bg-green-500' } // 警告データを緑色データへ差し替え！
      }));

      alert(`🎉 神UX連動成功！\n${droppedHelper.name}さんを配置し、${dayKey.toUpperCase()}曜日の「人数不足警告」を解除しました。`);
    }
  };

  return (
    /* 【3：戻す】元の白基調のデザインに戻します */
    <div className="min-h-screen bg-gray-50 p-6 text-gray-800 antialiased">
      
      {/* 🚀 ヘッダー領域 */}
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-bold bg-purple-100 rounded-full text-purple-700">プロトタイプ</span>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">📅 AlterShift 管理コンソール</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">対象：希望ヶ丘店 | 権限：横浜 店長</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={() => alert('確定通知を送信しました')} className="flex-1 sm:flex-none px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors text-sm shadow-sm flex items-center justify-center gap-1.5">
            📢 確定通知を送信
          </button>
          <button 
            onClick={handleAiClick} 
            className={`flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all shadow-md text-sm flex items-center justify-center gap-2 ${isSpinning ? 'animate-pulse opacity-70' : ''}`}
          >
            <span className={`inline-block ${isSpinning ? 'animate-spin' : ''}`}>✨</span>
            AI自動作成
          </button>
        </div>
      </header>

      {/* 📊 メインレイアウト構成：3カラム型ハイブリッド */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* 【左側 75%】週間ガントチャートカレンダー */}
        <div className="xl:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <span>🗓️</span> 24H時間軸 週間ガントチャート配置表 <span className="text-xs font-normal text-gray-400">（6/22 〜 6/28）</span>
            </h2>
          </div>

          <table className="w-full min-w-[900px] border-collapse text-left text-xs">
            <thead>
              {/* 曜日ヘッダー */}
              <tr className="border-b border-gray-100 text-gray-500 font-semibold text-[11px] tracking-wider">
                <th className="p-2.5 w-32 bg-white sticky left-0 z-10">スタッフ名</th>
                {days.map(d => (
                  <th key={d.key} className={`p-2.5 text-center w-40 ${d.bg || ''}`}>{d.label}</th>
                ))}
              </tr>
              {/* 【1：採用】人数過不足メーター（State連動） */}
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <td className="p-2 font-bold text-gray-400 sticky left-0 bg-gray-50 z-10 text-[10px]">時間帯別過不足</td>
                {days.map(d => {
                  const meter = coverageMeter[d.key];
                  return (
                    <td key={d.key} className="p-2 px-3 text-center">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-medium">
                          <span className={meter.status === '警告' ? 'text-red-600 font-bold' : 'text-gray-500'}>{meter.label}</span>
                          <span className="text-gray-400">{meter.status}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                          <div className={`h-full transition-all duration-500 rounded-full ${meter.width} ${meter.color}`}></div>
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-100">
              {staffRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  {/* スタッフ名固定列 */}
                  <td className="p-3 font-medium text-gray-800 sticky left-0 bg-white shadow-md z-10 border-r border-gray-100/50">
                    <div>{row.name}</div>
                    <div className="text-[9px] text-gray-400 font-normal mt-0.5">{row.role}</div>
                  </td>

                  {/* 7日間のガントチャートマス */}
                  {days.map(d => {
                    const shift = row.shifts[d.key];
                    const isBanned = shift.text === '不足';
                    
                    // 24時間のバー位置計算 (％換算で簡易ガントチャート化)
                    const leftPercent = shift.start ? (shift.start / 24) * 100 : 0;
                    const widthPercent = shift.start ? ((shift.end - shift.start) / 24) * 100 : 0;

                    return (
                      <td 
                        key={d.key} 
                        className={`p-2 relative min-h-[60px] align-middle ${d.bg || ''} ${isBanned ? 'bg-red-50' : ''}`}
                        onDragOver={isBanned ? handleDragOver : undefined}
                        onDrop={isBanned ? (e) => handleDrop(e, d.key) : undefined} // Drop時に曜日キーを渡す
                      >
                        {isBanned ? (
                          /* 【2：修正】対応したスタッフがドロップされたらこの赤枠＆点滅が消える */
                          <div className="border border-dashed border-red-400 rounded-lg p-2 bg-white text-center animate-pulse cursor-pointer">
                            <div className="text-[10px] font-bold text-red-600">🖱️ 候補をドロップ</div>
                          </div>
                        ) : shift.text === '公休' ? (
                          <div className="text-center text-gray-400 font-medium tracking-wide">ー</div>
                        ) : (
                          /* 【1：採用】簡易24時間タイムラインバー表現 */
                          <div className="space-y-1 py-1">
                            {/* 文字表示 */}
                            <div className="text-[10px] text-gray-700 font-medium text-center bg-white border border-gray-100 py-0.5 rounded shadow-inner">
                              {shift.text}
                            </div>
                            {/* ガントバー(24時間の幅を視覚化) */}
                            <div className="w-full h-2 bg-gray-100 rounded-full relative overflow-hidden border border-gray-200">
                              <div 
                                className={`h-full rounded-full ${shift.color} shadow`}
                                style={{ marginLeft: `${leftPercent}%`, width: `${widthPercent}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 【右側 25%】応援・ヘルプ候補スタンド */}
        <div className="xl:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="mb-1">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <span>🖱️</span> 応援候補スタンド
            </h3>
            <p className="text-[10px] text-gray-400 mt-1">
              左側の赤い「不足」マスへドラッグ＆ドロップしてください。メーターともリアルタイムで連動します。
            </p>
          </div>
          
          <hr className="border-gray-100 my-4" />
          
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[420px] pr-1">
            {availableHelpers.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl bg-gray-50 animate-fadeIn">
                配置完了しました 🎉
              </div>
            ) : (
              availableHelpers.map(helper => (
                <div 
                  key={helper.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, helper.id)}
                  className="p-3 bg-white border border-gray-200 rounded-xl cursor-grab active:cursor-grabbing hover:border-purple-300 hover:shadow-lg transition-all group relative overflow-hidden text-xs"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                  <div className="flex justify-between items-center ml-1">
                    <span className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors">⣿ {helper.name}</span>
                    <span className="text-[9px] bg-purple-100 text-purple-700 font-semibold px-1.5 py-0.5 rounded-full border border-purple-200">
                      {helper.skill}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2 ml-4">希望: <strong className="text-gray-700">{helper.time}</strong></p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 🔗 フッターナビゲーション */}
      <footer className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/staff" className="bg-white p-4 rounded-xl text-center border border-gray-100 hover:bg-gray-50 transition-all block text-xs font-semibold text-gray-600 shadow-sm">👥 スタッフ管理 (CRUD)</Link>
        <Link href="/settings" className="bg-white p-4 rounded-xl text-center border border-gray-100 hover:bg-gray-50 transition-all block text-xs font-semibold text-gray-600 shadow-sm">⚙️ スキル＆イベント設定</Link>
        <Link href="/submit" className="bg-white p-4 rounded-xl text-center border border-gray-100 hover:bg-gray-50 transition-all block text-xs font-semibold text-gray-600 shadow-sm">📱 スタッフ希望提出</Link>
        <Link href="/chat" className="bg-white p-4 rounded-xl text-center border border-gray-100 hover:bg-gray-50 transition-all block text-xs font-semibold text-gray-600 shadow-sm">💬 ヘルプ相談チャット</Link>
      </footer>
    </div>
  );
}