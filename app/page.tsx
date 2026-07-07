'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;

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

interface MeterData {
  status: string;
  label: string;
  width: string;
  color: string;
}

interface CoverageMeterState {
  [dateStr: string]: MeterData;
}

interface Helper {
  id: string;
  name: string;
  time: string;
  start: number;
  end: number;
  skill: string;
}

interface ShiftApiItem {
  id: number;
  date: string;
  type: string;
  startTime: string | null;
  endTime: string | null;
  status: string;
  staffId: number;
  staffName: string;
  role: string;
  storeId: number;
  storeName: string;
}

const getShiftColorByRole = (role: string) => {
  if (role === '社員') return 'bg-indigo-500';
  if (role === 'アルバイト') return 'bg-purple-500';
  if (role === 'パート') return 'bg-pink-500';
  return 'bg-gray-400';
};

const convertApiShiftsToStaffRows = (
  shifts: ShiftApiItem[],
  allDays: {
    key: string;
    dayNum: number;
    label: string;
    bg: string;
    dayOfWeek: string;
  }[]
): StaffRow[] => {
  const grouped = new Map<string, StaffRow>();

  shifts.forEach((shift) => {
    if (!grouped.has(shift.staffName)) {
      const emptyShifts = allDays.reduce((acc, day) => {
        acc[day.key] = { text: 'ー', start: 0, end: 0, color: '' };
        return acc;
      }, {} as { [dateStr: string]: ShiftData });

      grouped.set(shift.staffName, {
        name: shift.staffName,
        role: shift.role,
        shifts: emptyShifts,
      });
    }

    const row = grouped.get(shift.staffName);
    if (!row) return;

    const start = shift.startTime
      ? Number(shift.startTime.split(':')[0])
      : 0;

    const end = shift.endTime
      ? Number(shift.endTime.split(':')[0])
      : 0;

    row.shifts[shift.date] = {
      text:
        shift.startTime && shift.endTime
          ? `${shift.startTime}-${shift.endTime}`
          : shift.type || 'ー',
      start,
      end,
      color: getShiftColorByRole(shift.role),
    };
  });

  return Array.from(grouped.values());
};

export default function Dashboard() {
  const [currentYear] = useState(2026);
  const [currentMonth] = useState(6);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  const allDays = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const dateObj = new Date(currentYear, currentMonth - 1, d);
      const dayOfWeekNum = dateObj.getDay();
      const dayOfWeekStr = DAY_LABELS[dayOfWeekNum];
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
        dayOfWeek: dayOfWeekStr,
      };
    });
  }, [currentYear, currentMonth, daysInMonth]);

  const weeks = useMemo(() => {
    const result: typeof allDays[] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      result.push(allDays.slice(i, i + 7));
    }
    return result;
  }, [allDays]);

  const displayDays = weeks[currentWeekIndex] || weeks[0];

  // 📌 店舗イベントデータ
  const storeEvents: { [dateStr: string]: string } = {
    '2026-06-10': '新商品入荷',
    '2026-06-15': '店舗ミーティング',
    '2026-06-23': '全体棚卸し業務',
    '2026-06-24': '他店合同研修',
  };

  // 初期状態（希望休のみ登録）
  const [staffRows, setStaffRows] = useState<StaffRow[]>([
    { 
      name: '横浜 旭', 
      role: '社員', 
      shifts: allDays.reduce((acc, day) => {
        if (day.dayNum === 13 || day.dayNum === 27) {
          acc[day.key] = { text: '希望休', start: 0, end: 0, color: 'bg-amber-100 text-amber-800 border-amber-300' };
        } else {
          acc[day.key] = { text: 'ー', start: 0, end: 0, color: '' };
        }
        return acc;
      }, {} as { [key: string]: ShiftData })
    },
    { 
      name: '山田 太郎', 
      role: 'アルバイト', 
      shifts: allDays.reduce((acc, day) => {
        if (day.dayOfWeek === '日') {
          acc[day.key] = { text: '希望休', start: 0, end: 0, color: 'bg-amber-100 text-amber-800 border-amber-300' };
        } else if (day.dayNum === 23) {
          acc[day.key] = { text: 'ー', start: 0, end: 0, color: '' };
        } else {
          acc[day.key] = { text: 'ー', start: 0, end: 0, color: '' };
        }
        return acc;
      }, {} as { [key: string]: ShiftData })
    },
    { 
      name: '佐藤 美咲', 
      role: 'パート', 
      shifts: allDays.reduce((acc, day) => {
        if (day.dayOfWeek === '月' || day.dayOfWeek === '水') {
          acc[day.key] = { text: '希望休', start: 0, end: 0, color: 'bg-amber-100 text-amber-800 border-amber-300' };
        } else {
          acc[day.key] = { text: 'ー', start: 0, end: 0, color: '' };
        }
        return acc;
      }, {} as { [key: string]: ShiftData })
    },
  ]);

  // 初期状態のメーター
  const [coverageMeter, setCoverageMeter] = useState<CoverageMeterState>(
    allDays.reduce((acc, day) => {
      if (day.dayNum === 23) {
        acc[day.key] = { status: '警告', label: '14-19時 不足', width: 'w-3/5', color: 'bg-red-500 animate-pulse' };
      } else {
        acc[day.key] = { status: '未確定', label: '未配置', width: 'w-0', color: 'bg-gray-300' };
      }
      return acc;
    }, {} as CoverageMeterState)
  );

  const [availableHelpers, setAvailableHelpers] = useState<Helper[]>([
    { id: 'helper-1', name: '鈴木 一郎', time: '13:00 - 18:00', start: 13, end: 18, skill: '検品持ち' },
    { id: 'helper-2', name: '田中 次郎', time: '10:00 - 16:00', start: 10, end: 16, skill: 'レジのみ' },
  ]);
  
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
  const fetchShiftRows = async () => {
    try {
      const weekDays = weeks[currentWeekIndex] || [];
      if (weekDays.length === 0) return;

      const startDate = weekDays[0].key;
      const endDate = weekDays[weekDays.length - 1].key;

      const res = await fetch(
        `/api/shifts?storeId=1&startDate=${startDate}&endDate=${endDate}`
      );

      if (!res.ok) {
        console.error('シフト一覧取得に失敗しました');
        return;
      }

      const data: ShiftApiItem[] = await res.json();

      if (data.length > 0) {
        const converted = convertApiShiftsToStaffRows(data, allDays);
        setStaffRows(converted);
      }
    } catch (error) {
      console.error('シフト一覧の取得に失敗しました', error);
    }
  };

  fetchShiftRows();
}, [currentWeekIndex, allDays, weeks]);

  // ポップアップ（モーダル）用の管理State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [selectedDayLabel, setSelectedDayLabel] = useState<string>('');

  // 人員を実際に配置する共通ロジック
  const assignHelper = (helperId: string, dayKey: string) => {
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

      alert(`🎉 配置に成功しました！\n${droppedHelper.name}さんを配置し、「人数不足警告」を解除しました。`);
      closeModal();
    }
  };

  // 不足マスをクリックした時の処理
  const handleCellClick = (dayKey: string, dayLabel: string) => {
    setSelectedDayKey(dayKey);
    setSelectedDayLabel(dayLabel);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDayKey(null);
  };

  // ドラッグ＆ドロップ用処理
  const handleDragStart = (e: React.DragEvent, helperId: string) => {
    e.dataTransfer.setData('text/plain', helperId);
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, dayKey: string) => {
    e.preventDefault();
    const helperId = e.dataTransfer.getData('text/plain');
    assignHelper(helperId, dayKey);
  };

  // AI自動作成
  const handleAiClick = () => {
    setIsSpinning(true);
    setTimeout(() => {
      setIsSpinning(false);

      setStaffRows(prevRows => prevRows.map(row => {
        const updatedShifts = { ...row.shifts };
        
        Object.keys(updatedShifts).forEach(key => {
          const currentShift = updatedShifts[key];
          const dateObj = allDays.find(d => d.key === key);
          
          if (currentShift.text === '希望休') {
            updatedShifts[key] = { text: '公休', start: 0, end: 0, color: '' };
          } else if (currentShift.text === 'ー') {
            if (row.name === '山田 太郎' && dateObj?.dayNum === 23) {
              updatedShifts[key] = { text: '不足', start: 0, end: 0, color: '' };
            } else {
              if (row.role === '社員') {
                const isWeekend = dateObj?.dayOfWeek === '土' || dateObj?.dayOfWeek === '日';
                updatedShifts[key] = isWeekend
                  ? { text: '09:00-18:00', start: 9, end: 18, color: 'bg-indigo-500' }
                  : { text: '10:00-19:00', start: 10, end: 19, color: 'bg-indigo-500' };
              } else if (row.role === 'アルバイト') {
                updatedShifts[key] = { text: '10:00-15:00', start: 10, end: 15, color: 'bg-purple-500' };
              } else if (row.role === 'パート') {
                const isWeekend = dateObj?.dayOfWeek === '土' || dateObj?.dayOfWeek === '日';
                updatedShifts[key] = isWeekend
                  ? { text: '12:00-21:00', start: 12, end: 21, color: 'bg-pink-500' }
                  : { text: '10:00-14:00', start: 10, end: 14, color: 'bg-pink-500' };
              }
            }
          }
        });

        return { ...row, shifts: updatedShifts };
      }));

      setCoverageMeter(prevMeter => {
        const updatedMeter = { ...prevMeter };
        Object.keys(updatedMeter).forEach(key => {
          if (updatedMeter[key].status !== '警告') {
            updatedMeter[key] = { status: '充足', label: '適正', width: 'w-full', color: 'bg-green-500' };
          }
        });
        return updatedMeter;
      });

      alert('✨【AIワンクリックシフト作成完了】\n提出された希望休を全て「公休」へ自動変換し、空き日程へ必要なスキルベースの通常シフトを一括アサインしました！\n（※23日の人員不足のみ要調整として残しています）');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-800 antialiased relative">
      
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
            AI自動作成 (希望休連動)
          </button>
        </div>
      </header>

      {/* メインレイアウト */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* 左側 1週間ガントチャート */}
        <div className="xl:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          
          {/* 週切り替えナビゲーションバー */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <span>🗓️</span> 24H時間軸 シフト配置表 <span className="text-xs font-normal text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-bold">第 {currentWeekIndex + 1} 週目を表示中</span>
            </h2>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                disabled={currentWeekIndex === 0}
                onClick={() => setCurrentWeekIndex(prev => prev - 1)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                ← 前の週
              </button>
              
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {weeks.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentWeekIndex(idx)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${currentWeekIndex === idx ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <button
                disabled={currentWeekIndex === weeks.length - 1}
                onClick={() => setCurrentWeekIndex(prev => prev + 1)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                次の週 →
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-150 rounded-xl max-w-full">
            <table className="w-full min-w-[850px] border-collapse text-left text-xs table-fixed">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-semibold text-[11px] tracking-wider bg-gray-50/70">
                  <th className="p-3 w-36 bg-gray-150 sticky left-0 z-20 border-r border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">スタッフ名</th>
                  {displayDays.map(d => (
                    <th key={d.key} className={`p-2.5 text-center w-24 border-r border-gray-100 ${d.bg || ''}`}>{d.label}</th>
                  ))}
                </tr>
                
                <tr className="border-b border-gray-200 bg-gray-50/30">
                  <td className="p-2.5 font-bold text-gray-400 sticky left-0 bg-gray-100 z-20 border-r border-gray-200 text-[10px] shadow-[2px_0_5px_rgba(0,0,0,0.05)]">過不足状況</td>
                  {displayDays.map(d => {
                    const meter = coverageMeter[d.key] || { status: '充足', label: '適正', width: 'w-full', color: 'bg-green-500' };
                    return (
                      <td key={d.key} className="p-2 px-2 text-center border-r border-gray-100">
                        <div className="space-y-1">
                          <div className="flex flex-col text-[9px] font-medium leading-tight">
                            <span className={meter.status === '警告' ? 'text-red-600 font-bold' : meter.status === '未確定' ? 'text-gray-400' : 'text-gray-500'}>{meter.label}</span>
                            <span className="text-[8px] text-gray-400">{meter.status}</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                            <div className={`h-full transition-all duration-500 rounded-full ${meter.status === '未確定' ? 'w-0' : meter.width} ${meter.color}`}></div>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </thead>
              
              <tbody className="divide-y divide-gray-100">
                <tr className="bg-amber-50/40 hover:bg-amber-50/70 transition-colors border-b border-gray-200">
                  <td className="p-3 font-bold text-amber-800 bg-amber-50/80 sticky left-0 z-20 border-r border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)] flex items-center gap-1">
                    🚩 店舗イベント
                  </td>
                  {displayDays.map(d => {
                    const eventName = storeEvents[d.key];
                    return (
                      <td key={d.key} className={`p-2 border-r border-gray-100 text-center align-middle ${d.bg || ''}`}>
                        {eventName ? (
                          <div className="px-2 py-1 bg-amber-500 text-white font-extrabold text-[10px] rounded-md shadow-xs truncate" title={eventName}>
                            {eventName}
                          </div>
                        ) : (
                          <span className="text-gray-300 font-normal">ー</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {staffRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-3 font-medium text-gray-800 sticky left-0 bg-white z-20 border-r border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                      <div className="truncate font-bold">{row.name}</div>
                      <div className="text-[9px] text-gray-400 font-normal mt-0.5">{row.role}</div>
                    </td>

                    {displayDays.map(d => {
                      const shift = row.shifts[d.key] || { text: 'ー', start: 0, end: 0, color: '' };
                      const isBanned = shift.text === '不足';
                      const isWishHoliday = shift.text === '希望休';
                      
                      const leftPercent = shift.start ? (shift.start / 24) * 100 : 0;
                      const widthPercent = shift.start ? ((shift.end - shift.start) / 24) * 100 : 0;

                      return (
                        <td 
                          key={d.key} 
                          className={`p-2 border-r border-gray-100 relative min-h-[65px] align-middle ${d.bg || ''} ${isBanned ? 'bg-red-50' : ''} ${isWishHoliday ? 'bg-amber-50/60' : ''}`}
                          onDragOver={isBanned ? handleDragOver : undefined}
                          onDrop={isBanned ? (e) => handleDrop(e, d.key) : undefined}
                        >
                          {isBanned ? (
                            <div 
                              onClick={() => handleCellClick(d.key, d.label)}
                              className="border border-dashed border-red-400 rounded-lg p-1 py-2 bg-white text-center animate-pulse cursor-pointer shadow-sm hover:bg-red-100 hover:border-red-500 transition-colors"
                              title="クリックして人員を配置"
                            >
                              <div className="text-[9px] font-bold text-red-600 leading-none">⚠️ クリック配置</div>
                            </div>
                          ) : isWishHoliday ? (
                            <div className="text-center p-1 bg-amber-100 border border-amber-200 rounded text-amber-800 font-bold text-[10px] shadow-2xs">
                              ⭐ 希望休
                            </div>
                          ) : shift.text === '公休' || shift.text === 'ー' ? (
                            <div className="text-center text-gray-300 font-medium">{shift.text}</div>
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
              ドラッグ＆ドロップ、または不足マスを直接クリックして配置できます。
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

      {/* 下部：シフト不足警告ログパネル */}
      <div className="mt-6 bg-white p-5 rounded-xl shadow-sm border border-red-100">
        <h3 className="text-sm font-bold text-red-700 flex items-center gap-2 mb-3">
          <span>🚨</span> 現在検出されている人員不足・アラート（下部警告）
        </h3>
        <div className="divide-y divide-gray-100 text-xs">
          {Object.values(coverageMeter).filter((m) => m.status === '警告').length === 0 ? (
            <div className="text-gray-500 py-2 text-center font-medium bg-green-50 rounded-lg border border-green-100 text-green-700">
              🎉 現在、シフトの過不足はありません。すべての時間帯が充足しています。
            </div>
          ) : (
            Object.keys(coverageMeter)
              .filter((key) => coverageMeter[key].status === '警告')
              .map((key) => {
                const meter = coverageMeter[key];
                const targetDay = allDays.find((d) => d.key === key);
                return (
                  <div key={key} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 font-bold rounded text-[10px]">人員不足</span>
                      <strong className="text-gray-800">{targetDay?.label}</strong>
                      <span className="text-gray-500">ー {meter.label} が発生しています。</span>
                    </div>
                    <button 
                      onClick={() => {
                        const targetWeekIdx = weeks.findIndex(w => w.some(d => d.key === key));
                        if (targetWeekIdx !== -1) setCurrentWeekIndex(targetWeekIdx);
                        handleCellClick(key, targetDay?.label || '');
                      }}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md text-[11px] transition-colors shadow-sm"
                    >
                      ⚡ この週に移動して解決
                    </button>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* 人員配置用のポップアップ（モーダルウィンドウ） */}
      {isModalOpen && selectedDayKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-purple-700 to-indigo-700 p-4 text-white">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm flex items-center gap-1.5">
                  <span>📌</span> 応援スタッフの手動配置
                </h4>
                <button 
                  onClick={closeModal} 
                  className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] text-purple-100 mt-1">
                対象日：<strong className="text-white underline">{selectedDayLabel}</strong> (不足時間帯の補填)
              </p>
            </div>

            <div className="p-5">
              <label className="block text-xs font-bold text-gray-500 mb-3">配置可能な応援スタッフ候補</label>
              
              <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                {availableHelpers.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-400 italic">
                    現在、アサイン可能な応援候補スタッフがいません。
                  </div>
                ) : (
                  availableHelpers.map(helper => (
                    <div key={helper.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center gap-2">
                      <div>
                        <div className="font-bold text-xs text-gray-800">{helper.name} <span className="text-[9px] text-purple-600 bg-purple-50 px-1 py-0.2 rounded border border-purple-100 ml-1">{helper.skill}</span></div>
                        <div className="text-[10px] text-gray-500 mt-1">希望時間: {helper.time}</div>
                      </div>
                      <button
                        onClick={() => assignHelper(helper.id, selectedDayKey)}
                        className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-md transition-colors shadow-xs"
                      >
                        配置する
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 flex justify-end">
                <button 
                  onClick={closeModal} 
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-lg text-xs transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* フッターナビゲーション */}
      <footer className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Link href="/staff" className="bg-white p-4 rounded-xl text-center border border-gray-100 hover:bg-gray-50 transition-all block text-xs font-semibold text-gray-600 shadow-sm">👥 スタッフ管理 (CRUD)</Link>
        <Link href="/stores" className="bg-white p-4 rounded-xl text-center border border-gray-100 hover:bg-gray-50 transition-all block text-xs font-semibold text-gray-600 shadow-sm">🏪 店舗管理マスタ</Link>
        <Link href="/settings" className="bg-white p-4 rounded-xl text-center border border-gray-100 hover:bg-gray-50 transition-all block text-xs font-semibold text-gray-600 shadow-sm">⚙️ スキル＆イベント設定</Link>
        <Link href="/submit" className="bg-white p-4 rounded-xl text-center border border-gray-100 hover:bg-gray-50 transition-all block text-xs font-semibold text-gray-600 shadow-sm">📱 スタッフ希望提出</Link>
        <Link href="/chat" className="bg-white p-4 rounded-xl text-center border border-gray-100 hover:bg-gray-50 transition-all block text-xs font-semibold text-gray-600 shadow-sm">💬 ヘルプ相談チャット</Link>
      </footer>
    </div>
  );
}