'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface StaffRow {
  id: number;
  name: string;
  role: string;
  storeId: number;
}

interface DaySchedule {
  type: 'unset' | 'work' | 'off';
  startHour: string;
  startMin: string;
  endHour: string;
  endMin: string;
  note: string;
}

interface ScheduleState {
  [dateStr: string]: DaySchedule;
}

export default function SubmitPage() {
  const now = new Date();

  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);

  const [staffs, setStaffs] = useState<StaffRow[]>([]);
  const [staffId, setStaffId] = useState(0);
  const [storeId, setStoreId] = useState(0);
  const [isLoadingStaffs, setIsLoadingStaffs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [schedule, setSchedule] = useState<ScheduleState>({});

  const hours = Array.from(
    { length: 24 },
    (_, i) => String(i).padStart(2, '0')
  );

  const minutes = ['00', '15', '30', '45'];

  useEffect(() => {
    const fetchStaff = async () => {
      setIsLoadingStaffs(true);

      try {
        const res = await fetch('/api/staffs');

        if (!res.ok) return;

        const data: StaffRow[] = await res.json();

        setStaffs(data);

        if (data.length > 0) {
          setStaffId(data[0].id);
          setStoreId(data[0].storeId);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingStaffs(false);
      }
    };

    fetchStaff();
  }, []);

  const daysInMonth = new Date(
    currentYear,
    currentMonth,
    0
  ).getDate();

  const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;

    const dateObj = new Date(
      currentYear,
      currentMonth - 1,
      d
    );

    const dayOfWeekNum = dateObj.getDay();

    const dayOfWeekStr = dayLabels[dayOfWeekNum];

    const dateStr =
      `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    return {
      dateStr,
      dayNum: d,
      label: `${currentMonth}/${d} (${dayOfWeekStr})`,
      dayOfWeek: dayOfWeekStr,
    };
  });

  const updateType = (
    dateStr: string,
    type: 'work' | 'off'
  ) => {
    setSchedule((prev) => ({
      ...prev,
      [dateStr]: {
        ...(prev[dateStr] ?? {
          startHour: '10',
          startMin: '00',
          endHour: '18',
          endMin: '00',
          note: '',
        }),
        type,
      },
    }));
  };

  const handleFieldChange = (
    dateStr: string,
    field: keyof DaySchedule,
    value: string
  ) => {
    setSchedule((prev) => ({
      ...prev,
      [dateStr]: {
        ...(prev[dateStr] ?? {
          type: 'unset',
          startHour: '10',
          startMin: '00',
          endHour: '18',
          endMin: '00',
          note: '',
        }),
        [field]: value,
      },
    }));
  };

  const handleMonthChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const [y, m] = e.target.value.split('-').map(Number);

    setCurrentYear(y);
    setCurrentMonth(m);

    setSchedule({});
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!staffId || !storeId) {
      alert('スタッフ情報を取得できていません。しばらくしてから再度お試しください。');
      return;
    }

    const requests = Object.entries(schedule);

    if (requests.length === 0) {
      alert('希望を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      for (const [date, current] of requests) {

        if (current.type === 'unset') continue;

        const res = await fetch('/api/shift-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storeId,
            staffId,
            date,
            type: current.type === 'off' ? '希望休' : '通常',
            startTime:
              current.type === 'work'
                ? `${current.startHour}:${current.startMin}`
                : null,
            endTime:
              current.type === 'work'
                ? `${current.endHour}:${current.endMin}`
                : null,
            comment: current.note,
          }),
        });

        const body = await res.json();

        if (!res.ok) {
          alert(body.error ?? '希望休登録失敗');
          return;
        }
      }

      alert('希望を提出しました');

      setSchedule({});
    } catch (error) {
      console.error(error);
      alert('送信エラー');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex justify-center items-start text-gray-800">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">

        {/* ヘッダー */}
        <div className="bg-purple-600 p-5 text-white text-center">
          <h1 className="text-lg font-bold">🌌 1か月シフト提出</h1>
          <p className="text-xs text-purple-100 mt-0.5">月を選択して希望をまとめて入力できます</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* 基本情報 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">氏名</label>
              <select
                value={staffId}
                disabled={isLoadingStaffs || staffs.length === 0}
                onChange={(e) => {
                  const id = Number(e.target.value);

                  setStaffId(id);

                  const staff = staffs.find((s) => s.id === id);

                  if (staff) {
                    setStoreId(staff.storeId);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400"
              >
                {isLoadingStaffs && (
                  <option value={0}>読み込み中...</option>
                )}
                {!isLoadingStaffs && staffs.length === 0 && (
                  <option value={0}>スタッフがいません</option>
                )}
                {staffs.map((staff) => (
                  <option
                    key={staff.id}
                    value={staff.id}
                  >
                    {staff.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">対象月</label>
              <select
                value={`${currentYear}-${currentMonth}`}
                onChange={handleMonthChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="2026-5">2026年 5月</option>
                <option value="2026-6">2026年 6月</option>
                <option value="2026-7">2026年 7月</option>
                <option value="2026-8">2026年 8月</option>
              </select>
            </div>
          </div>

          {/* 希望スケジュールリスト */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">
              {currentMonth}月 スケジュール一覧 ({days.length}日間)
            </label>

            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1 border border-gray-100 p-2 bg-gray-50/50 rounded-xl">
              {days.map((day) => {
                const current = schedule[day.dateStr] || { type: 'unset', startHour: '10', startMin: '00', endHour: '18', endMin: '00', note: '' };

                let dayColor = 'text-gray-700';
                if (day.dayOfWeek === '土') dayColor = 'text-blue-600';
                if (day.dayOfWeek === '日') dayColor = 'text-red-500';

                return (
                  <div key={day.dateStr} className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-bold ${dayColor}`}>
                        {day.label}
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => updateType(day.dateStr, 'work')}
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-colors ${current.type === 'work' ? 'bg-purple-600 text-white' : 'bg-gray-100 border text-gray-600 hover:bg-gray-200'}`}
                        >
                          👍出勤
                        </button>
                        <button
                          type="button"
                          onClick={() => updateType(day.dateStr, 'off')}
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-colors ${current.type === 'off' ? 'bg-red-500 text-white' : 'bg-gray-100 border text-gray-600 hover:bg-gray-200'}`}
                        >
                          💤休み
                        </button>
                      </div>
                    </div>

                    {/* 出勤時の時間セレクト */}
                    {current.type === 'work' && (
                      <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex items-center justify-center gap-1 animate-in fade-in duration-100">
                        <div className="flex items-center bg-white border border-gray-200 rounded px-1">
                          <select
                            value={current.startHour}
                            onChange={(e) => handleFieldChange(day.dateStr, 'startHour', e.target.value)}
                            className="bg-transparent py-0.5 text-xs font-bold text-gray-700 outline-none cursor-pointer px-1"
                          >
                            {hours.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                          <span className="text-[10px] text-gray-400">:</span>
                          <select
                            value={current.startMin}
                            onChange={(e) => handleFieldChange(day.dateStr, 'startMin', e.target.value)}
                            className="bg-transparent py-0.5 text-xs font-bold text-gray-700 outline-none cursor-pointer px-1"
                          >
                            {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                        <span className="text-[10px] text-gray-400">〜</span>
                        <div className="flex items-center bg-white border border-gray-200 rounded px-1">
                          <select
                            value={current.endHour}
                            onChange={(e) => handleFieldChange(day.dateStr, 'endHour', e.target.value)}
                            className="bg-transparent py-0.5 text-xs font-bold text-gray-700 outline-none cursor-pointer px-1"
                          >
                            {hours.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                          <span className="text-[10px] text-gray-400">:</span>
                          <select
                            value={current.endMin}
                            onChange={(e) => handleFieldChange(day.dateStr, 'endMin', e.target.value)}
                            className="bg-transparent py-0.5 text-xs font-bold text-gray-700 outline-none cursor-pointer px-1"
                          >
                            {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* 休み指定時 */}
                    {current.type === 'off' && (
                      <div className="text-center py-1 text-[11px] font-bold text-red-500 bg-red-50/50 rounded border border-red-100">
                        終日お休み
                      </div>
                    )}

                    {/* 📝 備考欄 */}
                    <div className="pt-1">
                      <input
                        type="text"
                        value={current.note}
                        onChange={(e) => handleFieldChange(day.dateStr, 'note', e.target.value)}
                        placeholder="備考・連絡事項（例: 17時退勤希望、遅刻の可能性あり等）"
                        className="w-full px-2.5 py-1 border border-gray-200 rounded-lg text-[11px] text-gray-600 bg-gray-50/30 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-400 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isLoadingStaffs}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm shadow transition-colors"
          >
            {isSubmitting ? '送信中...' : `${currentMonth}月分の希望を提出する`}
          </button>
        </form>

        {/* 下部ナビゲーション */}
        <div className="bg-gray-50 p-4 border-t border-gray-100 text-center">
          <Link href="/" className="text-xs text-purple-600 hover:underline font-medium">
            ← ダッシュボードへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}