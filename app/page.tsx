'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ShiftData {
  text: string;
  start: number;
  end: number;
  color: string;
}

interface StaffRow {
  name: string;
  role: string;
  shifts: { [dateStr: string]: ShiftData };
}

// 💡 メーターデータ用の型定義を追加
interface MeterData {
  status: string;
  label: string;
  width: string;
  color: string;
}

interface CoverageMeterState {
  [dateStr: string]: MeterData;
}

export default function Dashboard() {
  // 現在は2026年6月をベースとして固定デモ
  const [currentYear] = useState(2026);
  const [currentMonth] = useState(6);

  // 6月の末日（30日）分の日付データを自動生成
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];
  
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const dateObj = new Date(currentYear, currentMonth - 1, d);
    const dayOfWeekNum = dateObj.getDay();
    const dayOfWeekStr = dayLabels[dayOfWeekNum];
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    let bg = '';
    if (dayOfWeekStr === '土') bg = 'bg-blue-50/40';
    if (dayOfWeekStr === '日') bg = 'bg-red-50/40';
    if (d === 23) bg = 'bg-red-100/50';

    return {
      key: dateStr,
      dayNum: d,
      label: `${currentMonth}/${d} (${dayOfWeekStr})`,
      bg,
      dayOfWeek: dayOfWeekStr
    };
  });

  // 初期スタッフデータ
  const [staffRows, setStaffRows] = useState<StaffRow[]>([
    { 
      name: '横浜 旭', 
      role: '社員', 
      shifts: days.reduce((acc, day) => {
        const isWeekend = day.dayOfWeek === '土' || day.dayOfWeek === '日';
        acc[day.key] = isWeekend
          ? { text: '09:00-18:00', start: 9, end: 18, color: 'bg-indigo-500' }
          : { text: '10:00-19:00', start: 10, end: 19, color: 'bg-indigo-500' };
        return acc;
      }, {} as { [key: string]: ShiftData })
    },
    { 
      name: '山田 太郎', 
      role: 'アルバイト', 
      shifts: days.reduce((acc, day) => {
        if (day.dayNum === 23) {
          acc[day.key] = { text: '不足', start: 0, end: 0, color: '' };
        } else if (day.dayOfWeek === '日') {
          acc[day.key] = { text: '公休', start: 0, end: 0, color: '' };
        } else {
          acc[day.key] = { text: '10:00-15:00', start: 10, end: 15, color: 'bg-purple-500' };
        }
        return acc;
      }, {} as { [key: string]: ShiftData })
    },
    { 
      name: '佐藤 美咲', 
      role: 'パート', 
      shifts: days.reduce((acc, day) => {
        if (day.dayOfWeek === '月' || day.dayOfWeek === '水') {
          acc[day.key] = { text: '公休', start: 0, end: 0, color: '' };
        } else if (day.dayOfWeek === '土' || day.dayOfWeek === '日') {
          acc[day.key] = { text: '12:00-21:00', start: 12, end: 21, color: 'bg-pink-500' };
        } else {
          acc[day.key] = { text: '10:00-14:00', start: 10, end: 14, color: 'bg-pink-500' };
        }
        return acc;
      }, {} as { [key: string]: ShiftData })
    },
  ]);

  // 🛠️ 【修正箇所】any型を排除し、定義した型アサーションを明記
  const [coverageMeter, setCoverageMeter] = useState<CoverageMeterState>(
    days.reduce((acc, day) => {
      if (day.dayNum === 23) {
        acc[day.key] = { status: '警告', label: '14-19時 不足', width: 'w-3/5', color: 'bg-red-500 animate-pulse' };
      } else {
        acc[day.key] = { status: '充足', label: '適正', width: 'w-full', color: 'bg-green-500' };
      }
      return acc;
    }, {} as CoverageMeterState)
  );

  const [availableHelpers, setAvailableHelpers] = useState([
    { id: 'helper-1', name: '鈴木 一郎', time: '13:00 - 18:00', start: 13, end: 18, skill: '検品持ち' },
    { id: 'helper-2', name: '田中 次郎', time: '10:00 - 16:00', start: 10, end: 16, skill: 'レジのみ' },
  ]);
  
  const [isSpinning, setIsSpinning] = useState(false);

  const handleAiClick = () => {
    setIsSpinning(true);
    setTimeout(() => {
      setIsSpinning(false);
      alert('【AI自動シフト作成】1か月分の保有スキル、過不足時間帯を計算し、最適なバー配置を行いました！');
    }, 1200);
  };

  const handleDragStart = (e: React.DragEvent, helperId: string) => {
    e.dataTransfer.setData('text/plain', helperId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dayKey: string) => {
    e.preventDefault();
    const helperId = e.dataTransfer.getData('text/plain');
    const droppedHelper = availableHelpers.find(h => h.id === helperId);

    if (droppedHelper) {
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

      setCoverageMeter(prev => ({
        ...prev,
        [dayKey]: { status: '充足', label: '適正', width: 'w-full', color: 'bg-green-500' }
      }));

      alert(`🎉 UX連動成功！\n${droppedHelper.name}さんを配置し、対象日の「人数不足警告」を解除しました。`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-800 antialiased">
      
      {/* ヘッダー */}
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-bold bg-purple-100 rounded-full text-purple-700">プロトタイプ</span>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">📅 AlterShift 管理コンソール</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">対象：希望ヶ丘店 | 権限：横浜 店長 ({currentYear}年{currentMonth}月度)</p>
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

      {/* メインレイアウト */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* 左側 1か月ガントチャート */}
        <div className="xl:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <span>🗓️</span> 24H時間軸 1か月ガントチャート配置表 <span className="text-xs font-normal text-gray-400">（横にスクロールして全日確認できます）</span>
            </h2>
          </div>

          <div className="overflow-x-auto border border-gray-150 rounded-xl max-w-full">
            <table className="w-full min-w-[2800px] border-collapse text-left text-xs table-fixed">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-semibold text-[11px] tracking-wider bg-gray-50/70">
                  <th className="p-3 w-36 bg-gray-150 sticky left-0 z-20 border-r border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">スタッフ名</th>
                  {days.map(d => (
                    <th key={d.key} className={`p-2.5 text-center w-24 border-r border-gray-100 ${d.bg || ''}`}>{d.label}</th>
                  ))}
                </tr>
                
                <tr className="border-b border-gray-200 bg-gray-50/30">
                  <td className="p-2.5 font-bold text-gray-400 sticky left-0 bg-gray-100 z-20 border-r border-gray-200 text-[10px] shadow-[2px_0_5px_rgba(0,0,0,0.05)]">過不足状況</td>
                  {days.map(d => {
                    const meter = coverageMeter[d.key] || { status: '充足', label: '適正', width: 'w-full', color: 'bg-green-500' };
                    return (
                      <td key={d.key} className="p-2 px-2 text-center border-r border-gray-100">
                        <div className="space-y-1">
                          <div className="flex flex-col text-[9px] font-medium leading-tight">
                            <span className={meter.status === '警告' ? 'text-red-600 font-bold' : 'text-gray-500'}>{meter.label}</span>
                            <span className="text-[8px] text-gray-400">{meter.status}</span>
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
                  <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-3 font-medium text-gray-800 sticky left-0 bg-white z-20 border-r border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                      <div className="truncate font-bold">{row.name}</div>
                      <div className="text-[9px] text-gray-400 font-normal mt-0.5">{row.role}</div>
                    </td>

                    {days.map(d => {
                      const shift = row.shifts[d.key] || { text: 'ー', start: 0, end: 0, color: '' };
                      const isBanned = shift.text === '不足';
                      
                      const leftPercent = shift.start ? (shift.start / 24) * 100 : 0;
                      const widthPercent = shift.start ? ((shift.end - shift.start) / 24) * 100 : 0;

                      return (
                        <td 
                          key={d.key} 
                          className={`p-2 border-r border-gray-100 relative min-h-[65px] align-middle ${d.bg || ''} ${isBanned ? 'bg-red-50' : ''}`}
                          onDragOver={isBanned ? handleDragOver : undefined}
                          onDrop={isBanned ? (e) => handleDrop(e, d.key) : undefined}
                        >
                          {isBanned ? (
                            <div className="border border-dashed border-red-400 rounded-lg p-1 py-2 bg-white text-center animate-pulse cursor-pointer shadow-sm">
                              <div className="text-[9px] font-bold text-red-600 leading-none">🖱️ ドロップ</div>
                            </div>
                          ) : shift.text === '公休' || shift.text === 'ー' ? (
                            <div className="text-center text-gray-300 font-medium">ー</div>
                          ) : (
                            <div className="space-y-1 py-0.5">
                              <div className="text-[9px] text-gray-700 font-medium text-center bg-white border border-gray-200 py-0.5 rounded shadow-sm truncate px-0.5">
                                {shift.text}
                              </div>
                              <div className="w-full h-2 bg-gray-100 rounded-full relative overflow-hidden border border-gray-200">
                                <div 
                                  className={`h-full rounded-full ${shift.color} shadow-sm`}
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
        </div>

        {/* 右側 応援候補スタンド */}
        <div className="xl:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="mb-1">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <span>🖱️</span> 応援候補スタンド
            </h3>
            <p className="text-[10px] text-gray-400 mt-1">
              左側の赤い「不足」マスへドラッグ＆ドロップしてください。
            </p>
          </div>
          
          <hr className="border-gray-100 my-4" />
          
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[420px] pr-1">
            {availableHelpers.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl bg-gray-50">
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

      {/* フッターナビゲーション */}
      <footer className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/staff" className="bg-white p-4 rounded-xl text-center border border-gray-100 hover:bg-gray-50 transition-all block text-xs font-semibold text-gray-600 shadow-sm">👥 スタッフ管理 (CRUD)</Link>
        <Link href="/settings" className="bg-white p-4 rounded-xl text-center border border-gray-100 hover:bg-gray-50 transition-all block text-xs font-semibold text-gray-600 shadow-sm">⚙️ スキル＆イベント設定</Link>
        <Link href="/submit" className="bg-white p-4 rounded-xl text-center border border-gray-100 hover:bg-gray-50 transition-all block text-xs font-semibold text-gray-600 shadow-sm">📱 スタッフ希望提出</Link>
        <Link href="/chat" className="bg-white p-4 rounded-xl text-center border border-gray-100 hover:bg-gray-50 transition-all block text-xs font-semibold text-gray-600 shadow-sm">💬 ヘルプ相談チャット</Link>
      </footer>
    </div>
  );
}