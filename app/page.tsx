'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type ShiftType = '通常' | '希望休' | '公休' | '応援';

type ShiftRow = {
  id: number;
  date: string; // YYYY-MM-DD
  type: string;
  startTime: string | null; // HH:mm
  endTime: string | null; // HH:mm
  status: string;
  staffId: number;
  staffName: string;
  role: string;
  storeId: number;
  storeName: string;
  isOvernight?: boolean;
  workMinutes?: number;
};

type StaffRow = {
  id: number;
  name: string;
  role: string;
};

type StoreRow = {
  id: number;
  name: string;
};

type ShiftMap = Record<string, ShiftRow>;

/* =========================
 * 日付ユーティリティ
 * ========================= */
const pad2 = (value: number) => String(value).padStart(2, '0');

const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
};

const getMonthStart = (baseDate: Date) => {
  return new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
};

const getMonthEnd = (baseDate: Date) => {
  return new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
};

const getDatesInMonth = (baseDate: Date) => {
  const start = getMonthStart(baseDate);
  const end = getMonthEnd(baseDate);

  const dates: Date[] = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

const getDayLabel = (date: Date) => {
  const labels = ['日', '月', '火', '水', '木', '金', '土'];
  return labels[date.getDay()];
};

const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

/* =========================
 * 表示ユーティリティ
 * ========================= */
const isNoTimeShift = (type: string) => {
  return type === '希望休' || type === '公休';
};

const getShiftCellClassName = (shift: ShiftRow | undefined) => {
  if (!shift) {
    return 'bg-white';
  }

  if (shift.type === '希望休') {
    return 'bg-yellow-100 text-yellow-900';
  }

  if (shift.type === '公休') {
    return 'bg-gray-200 text-gray-900';
  }

  if (shift.type === '応援') {
    return 'bg-sky-100 text-sky-900';
  }

  if (shift.isOvernight) {
    return 'bg-indigo-100 text-indigo-900';
  }

  return 'bg-green-100 text-green-900';
};

const buildShiftMap = (rows: ShiftRow[]) => {
  const map: ShiftMap = {};
  for (const row of rows) {
    map[`${row.staffId}_${row.date}`] = row;
  }
  return map;
};

const buildStaffList = (rows: ShiftRow[]) => {
  const unique = new Map<number, StaffRow>();

  for (const row of rows) {
    if (!unique.has(row.staffId)) {
      unique.set(row.staffId, {
        id: row.staffId,
        name: row.staffName,
        role: row.role,
      });
    }
  }

  return Array.from(unique.values()).sort((a, b) => a.id - b.id);
};

/* =========================
 * 新規作成フォーム初期値
 * ========================= */
const initialForm = {
  staffId: '',
  date: '',
  type: '通常' as ShiftType,
  startTime: '09:00',
  endTime: '18:00',
  status: 'draft',
};

/* =========================
 * Page
 * ========================= */
export default function Page() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date(2026, 5, 1));
  
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState(11);

  const [shiftRows, setShiftRows] = useState<ShiftRow[]>([]);
  const [staffs, setStaffs] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const [editingShift, setEditingShift] = useState<ShiftRow | null>(null);

  const [editForm, setEditForm] = useState({
    id: 0,
    staffId: '',
    date: '',
    type: '通常' as ShiftType,
    startTime: '09:00',
    endTime: '18:00',
    status: 'draft',
  });

  const monthDates = useMemo(() => getDatesInMonth(currentMonth), [currentMonth]);
  const startDate = useMemo(() => formatDate(getMonthStart(currentMonth)), [currentMonth]);
  const endDate = useMemo(() => formatDate(getMonthEnd(currentMonth)), [currentMonth]);

  const shiftMap = useMemo(() => buildShiftMap(shiftRows), [shiftRows]);

  const fetchStores = useCallback(async () => {
    try {
      const res = await fetch("/api/stores");

      if (!res.ok) {
        throw new Error("店舗取得失敗");
      }

      const data: StoreRow[] = await res.json();

      setStores(data);

      if (data.length > 0) {
        setSelectedStoreId((prev) => prev ?? data[0].id);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchShiftRows = useCallback(async () => {
  try {
    setLoading(true);

    const params = new URLSearchParams({
      storeId: String(selectedStoreId),
      startDate,
      endDate,
    });

      const res = await fetch(`/api/shifts?${params.toString()}`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        console.error('シフト一覧取得に失敗しました', errorBody);
        alert(
          `シフト一覧取得に失敗しました\n${
            errorBody?.error ?? 'サーバーエラーが発生しました'
          }`
        );
        setShiftRows([]);
        setStaffs([]);
        return;
      }

      const data = (await res.json()) as ShiftRow[];

      setShiftRows(data);
      setStaffs(buildStaffList(data));
    } catch (error) {
      console.error('シフト一覧取得エラー:', error);
      alert('シフト一覧の取得中にエラーが発生しました');
      setShiftRows([]);
      setStaffs([]);
    } finally {
      setLoading(false);
    }
  }, [selectedStoreId, startDate, endDate]);

  useEffect(() => {
  void fetchStores();
}, [fetchStores]);

  useEffect(() => {
    const fetchStores = async () => {
      const res = await fetch("/api/stores");

      if (!res.ok) return;

      const data: StoreRow[] = await res.json();

      setStores(data);

      if (data.length > 0) {
        setSelectedStoreId(data[0].id);
      }
    };

    void fetchStores();
  }, []);

  useEffect(() => {
  void fetchShiftRows();
}, [fetchShiftRows]);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleChangeForm = (key: keyof typeof initialForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const submitShift = async () => {
    if (!form.staffId) {
      alert('スタッフを選択してください');
      return;
    }

    if (!form.date) {
      alert('日付を選択してください');
      return;
    }

    if (!form.type) {
      alert('シフト種別を選択してください');
      return;
    }

    if ((form.type === '通常' || form.type === '応援') && (!form.startTime || !form.endTime)) {
      alert('通常/応援シフトでは開始時刻・終了時刻が必要です');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        storeId: selectedStoreId,
        staffId: Number(form.staffId),
        date: form.date,
        type: form.type,
        startTime: form.type === '希望休' || form.type === '公休' ? null : form.startTime,
        endTime: form.type === '希望休' || form.type === '公休' ? null : form.endTime,
        status: form.status,
      };

      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        alert(body?.error ?? 'シフト作成に失敗しました');
        return;
      }

      alert('シフトを作成しました');
      setForm(initialForm);
      await fetchShiftRows();
    } catch (error) {
      console.error('シフト作成エラー:', error);
      alert('シフト作成中にエラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  const updateShift = async () => {
    try {
      setSubmitting(true);

      const res = await fetch(`/api/shifts/${editForm.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        alert(body?.error ?? "更新に失敗しました");
        return;
      }

      alert("更新しました");

      setEditingShift(null);

      await fetchShiftRows();
    } catch (error) {
      console.error(error);
      alert("更新エラー");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteShift = async () => {
  if (!editingShift) return;

  const ok = confirm("このシフトを削除しますか？");

  if (!ok) return;

  try {
    setSubmitting(true);

    const res = await fetch(`/api/shifts/${editingShift.id}`, {
      method: "DELETE",
    });

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      alert(body?.error ?? "削除に失敗しました");
      return;
    }

    alert("削除しました");

    setEditingShift(null);

    await fetchShiftRows();
  } catch (error) {
    console.error(error);
    alert("削除中にエラーが発生しました");
  } finally {
    setSubmitting(false);
  }
};

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-[1800px] space-y-6">
        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">シフト管理ダッシュボード</h1>
              <div className="mt-4 flex items-center gap-3">
                <label className="text-sm font-medium">
                  店舗選択
                </label>

                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(Number(e.target.value))}
                  className="rounded-md border border-slate-300 px-3 py-2"
                >
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
              >
                ← 前月
              </button>

              <div className="min-w-[180px] text-center text-lg font-semibold">
                {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
              </div>

              <button
                onClick={handleNextMonth}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
              >
                次月 →
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-lg font-bold">シフト作成</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">スタッフID</label>
              <select
                value={form.staffId}
                onChange={(e) => handleChangeForm("staffId", e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              >
                <option value="">スタッフを選択</option>

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

            <div className="space-y-2">
              <label className="text-sm font-medium">日付</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => handleChangeForm('date', e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">種別</label>
              <select
                value={form.type}
                onChange={(e) => handleChangeForm('type', e.target.value as ShiftType)}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              >
                <option value="通常">通常</option>
                <option value="希望休">希望休</option>
                <option value="公休">公休</option>
                <option value="応援">応援</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">開始時刻</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => handleChangeForm('startTime', e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                disabled={form.type === '希望休' || form.type === '公休'}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">終了時刻</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => handleChangeForm('endTime', e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                disabled={form.type === '希望休' || form.type === '公休'}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">ステータス</label>
              <select
                value={form.status}
                onChange={(e) => handleChangeForm('status', e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={submitShift}
              disabled={submitting}
              className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? '作成中...' : 'シフト作成'}
            </button>
          </div>

          <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-medium">補足</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>通常/応援シフトは開始時刻・終了時刻を入力します。</li>
              <li>希望休/公休は時間なしで登録します。</li>
              <li>19:00 → 04:00 のように終了時刻が開始時刻以下なら、夜勤として翌日終了扱いになります。</li>
              <li>画面上では夜勤セルに 🌙 を付けて表示します。</li>
            </ul>
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">月間シフト表</h2>
            {loading && <span className="text-sm text-slate-500">読み込み中...</span>}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1400px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 border border-slate-300 bg-slate-100 px-3 py-2 text-left">
                    スタッフ
                  </th>

                  {monthDates.map((date) => {
                    const dateStr = formatDate(date);
                    const weekend = isWeekend(date);

                    return (
                      <th
                        key={dateStr}
                        className={`border border-slate-300 px-2 py-2 text-center ${
                          weekend ? 'bg-amber-50' : 'bg-slate-50'
                        }`}
                      >
                        <div className="font-semibold">{date.getDate()}</div>
                        <div className="text-xs text-slate-500">{getDayLabel(date)}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {staffs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={monthDates.length + 1}
                      className="border border-slate-300 px-4 py-10 text-center text-slate-500"
                    >
                      シフトデータがありません
                    </td>
                  </tr>
                ) : (
                  staffs.map((staff) => (
                    <tr key={staff.id}>
                      <td className="sticky left-0 z-10 border border-slate-300 bg-white px-3 py-2 align-top shadow-[1px_0_0_0_rgba(203,213,225,1)]">
                        <div className="font-medium">{staff.name}</div>
                        <div className="text-xs text-slate-500">{staff.role}</div>
                        <div className="text-xs text-slate-400">ID: {staff.id}</div>
                      </td>

                      {monthDates.map((date) => {
                        const dateStr = formatDate(date);
                        const shift = shiftMap[`${staff.id}_${dateStr}`];
                        const className = getShiftCellClassName(shift);

                        return (
                          <td
                            key={`${staff.id}_${dateStr}`}
                            onClick={() => {
                              if (!shift) return;

                              setEditingShift(shift);

                              setEditForm({
                                id: shift.id,
                                staffId: String(shift.staffId),
                                date: shift.date,
                                type: shift.type as ShiftType,
                                startTime: shift.startTime ?? "09:00",
                                endTime: shift.endTime ?? "18:00",
                                status: shift.status,
                              });
                            }}
                            className={`h-[72px] min-w-[110px] border border-slate-300 px-2 py-2 align-top ${className}`}
                            title={
                              shift
                                ? [
                                    `スタッフ: ${shift.staffName}`,
                                    `日付: ${shift.date}`,
                                    `種別: ${shift.type}`,
                                    shift.startTime && shift.endTime
                                      ? `時間: ${shift.startTime} - ${shift.endTime}`
                                      : null,
                                    shift.isOvernight ? '夜勤: あり' : null,
                                    shift.status ? `状態: ${shift.status}` : null,
                                  ]
                                    .filter(Boolean)
                                    .join('\n')
                                : ''
                            }
                          >
                            {shift ? (
                              <div className="space-y-1">
                                <div className="font-medium">{shift.type}</div>

                                {!isNoTimeShift(shift.type) &&
                                  shift.startTime &&
                                  shift.endTime && (
                                    <div className="text-xs">
                                      {shift.startTime} - {shift.endTime}
                                      {shift.isOvernight ? ' 🌙' : ''}
                                    </div>
                                  )}

                                {isNoTimeShift(shift.type) && (
                                  <div className="text-xs text-slate-600">
                                    時間指定なし
                                  </div>
                                )}

                                {shift.workMinutes != null &&
                                  shift.workMinutes > 0 && (
                                    <div className="text-[11px] text-slate-600">
                                      勤務時間:{' '}
                                      {(shift.workMinutes / 60).toFixed(
                                        shift.workMinutes % 60 === 0 ? 0 : 1
                                      )}
                                      h
                                    </div>
                                  )}
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-lg font-bold">凡例</h2>

          <div className="flex flex-wrap gap-3 text-sm">
            <div className="rounded-md bg-green-100 px-3 py-2 text-green-900">
              通常勤務
            </div>
            <div className="rounded-md bg-indigo-100 px-3 py-2 text-indigo-900">
              夜勤勤務
            </div>
            <div className="rounded-md bg-yellow-100 px-3 py-2 text-yellow-900">
              希望休
            </div>
            <div className="rounded-md bg-gray-200 px-3 py-2 text-gray-900">
              公休
            </div>
            <div className="rounded-md bg-sky-100 px-3 py-2 text-sky-900">
              応援
            </div>
          </div>
        </section>

        {editingShift && (
          <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-4 text-lg font-bold">
              シフト編集
            </h2>

            <div className="space-y-4">

              <div>
                <label className="block text-sm font-medium">
                  日付
                </label>

                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      date: e.target.value,
                    })
                  }
                  className="w-full rounded border p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  種別
                </label>

                <select
                  value={editForm.type}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      type: e.target.value as ShiftType,
                    })
                  }
                  className="w-full rounded border p-2"
                >
                  <option value="通常">通常</option>
                  <option value="希望休">希望休</option>
                  <option value="公休">公休</option>
                  <option value="応援">応援</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">
                    開始
                  </label>

                  <input
                    type="time"
                    value={editForm.startTime}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        startTime: e.target.value,
                      })
                    }
                    className="w-full rounded border p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    終了
                  </label>

                  <input
                    type="time"
                    value={editForm.endTime}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        endTime: e.target.value,
                      })
                    }
                    className="w-full rounded border p-2"
                  />
                </div>
              </div>

              <div className="flex gap-3">

                <button
                  onClick={updateShift}
                  className="rounded bg-blue-600 px-4 py-2 text-white"
                >
                  更新
                </button>

                <button
                  onClick={deleteShift}
                  disabled={submitting}
                  className="rounded bg-red-600 px-4 py-2 text-white"
                >
                  削除
                </button>

              </div>

            </div>
          </section>
        )}
      </div>
    </main>
  );
}