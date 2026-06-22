'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function SubmitPage() {
  // 1週間分（7日間）のデータ状態を確保
  const [schedule, setSchedule] = useState<{ [key: string]: { type: 'unset' | 'work' | 'off'; startHour: string; startMin: string; endHour: string; endMin: string } }>({
    mon: { type: 'unset', startHour: '10', startMin: '00', endHour: '18', endMin: '00' },
    tue: { type: 'unset', startHour: '10', startMin: '00', endHour: '18', endMin: '00' },
    wed: { type: 'unset', startHour: '10', startMin: '00', endHour: '18', endMin: '00' },
    thu: { type: 'unset', startHour: '10', startMin: '00', endHour: '18', endMin: '00' },
    fri: { type: 'unset', startHour: '10', startMin: '00', endHour: '18', endMin: '00' },
    sat: { type: 'unset', startHour: '10', startMin: '00', endHour: '18', endMin: '00' },
    sun: { type: 'unset', startHour: '10', startMin: '00', endHour: '18', endMin: '00' },
  });

  // 1週間分の配列
  const days = [
    { id: 'mon', label: '6/22 (月)' },
    { id: 'tue', label: '6/23 (火)' },
    { id: 'wed', label: '6/24 (水)' },
    { id: 'thu', label: '6/25 (木)' },
    { id: 'fri', label: '6/26 (金)' },
    { id: 'sat', label: '6/27 (土)' },
    { id: 'sun', label: '6/28 (日)' },
  ];

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')); 
  const minutes = ['00', '15', '30', '45']; 

  const updateType = (id: string, type: 'work' | 'off') => {
    setSchedule(prev => ({ ...prev, [id]: { ...prev[id], type } }));
  };

  const handleTimeChange = (id: string, field: 'startHour' | 'startMin' | 'endHour' | 'endMin', value: string) => {
    setSchedule(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex justify-center items-start text-gray-800">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        
        <div className="bg-purple-600 p-5 text-white text-center">
          <h1 className="text-lg font-bold">🌌 24H対応・シフト提出</h1>
          <p className="text-xs text-purple-100 mt-0.5">1週間分の希望をまとめて入力可能</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); alert('1週間分のシフト希望を送信しました！'); }} className="p-5 space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">氏名</label>
            <input type="text" placeholder="テストスタッフ" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50" required />
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            <label className="block text-xs font-bold text-gray-500 sticky top-0 bg-white pb-1">希望スケジュール（月〜日）</label>
            
            {days.map((day) => {
              const current = schedule[day.id];
              return (
                <div key={day.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700">{day.label}</span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => updateType(day.id, 'work')} className={`px-2 py-0.5 text-[11px] font-semibold rounded ${current.type === 'work' ? 'bg-purple-600 text-white' : 'bg-white border text-gray-600'}`}>👍出勤</button>
                      <button type="button" onClick={() => updateType(day.id, 'off')} className={`px-2 py-0.5 text-[11px] font-semibold rounded ${current.type === 'off' ? 'bg-red-500 text-white' : 'bg-white border text-gray-600'}`}>💤休み</button>
                    </div>
                  </div>

                  {current.type === 'work' && (
                    <div className="bg-white p-2 rounded-lg border border-gray-100 flex items-center justify-center gap-1 animate-fadeIn">
                      <div className="flex items-center bg-white border border-gray-200 rounded px-1">
                        <select value={current.startHour} onChange={(e) => handleTimeChange(day.id, 'startHour', e.target.value)} className="bg-transparent py-0.5 text-xs font-bold text-gray-700 outline-none cursor-pointer px-1">
                          {hours.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <span className="text-[10px] text-gray-400">:</span>
                        <select value={current.startMin} onChange={(e) => handleTimeChange(day.id, 'startMin', e.target.value)} className="bg-transparent py-0.5 text-xs font-bold text-gray-700 outline-none cursor-pointer px-1">
                          {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <span className="text-[10px] text-gray-400">〜</span>
                      <div className="flex items-center bg-white border border-gray-200 rounded px-1">
                        <select value={current.endHour} onChange={(e) => handleTimeChange(day.id, 'endHour', e.target.value)} className="bg-transparent py-0.5 text-xs font-bold text-gray-700 outline-none cursor-pointer px-1">
                          {hours.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <span className="text-[10px] text-gray-400">:</span>
                        <select value={current.endMin} onChange={(e) => handleTimeChange(day.id, 'endMin', e.target.value)} className="bg-transparent py-0.5 text-xs font-bold text-gray-700 outline-none cursor-pointer px-1">
                          {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {current.type === 'off' && (
                    <div className="text-center py-1 text-[11px] font-bold text-red-500 bg-red-50 rounded border border-red-100">
                      終日お休み
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm shadow">希望を提出する</button>
        </form>

        <div className="bg-gray-50 p-4 border-t border-gray-100 text-center">
          <Link href="/" className="text-xs text-purple-600 hover:underline font-medium">
            ← ダッシュボードへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}