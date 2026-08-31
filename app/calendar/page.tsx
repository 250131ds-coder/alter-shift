'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface StoreRow {
  id: number;
  name: string;
}

interface Requirement {
  skillId: number;
  skillName: string;
  count: number;
}

interface EventTemplateRow {
  id: number;
  name: string;
  requirements: Requirement[];
}

interface StoreEventRow {
  id: number;
  date: string;
  title: string;
  templateId: number | null;
  template: EventTemplateRow | null;
}

interface CalendarCell {
  dateStr: string | null;
  dayNum: number | null;
  dayOfWeek: string | null;
}

export default function CalendarPage() {
  const now = new Date();

  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);

  const [stores, setStores] = useState<StoreRow[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState(0);
  const [isLoadingStores, setIsLoadingStores] = useState(true);

  const [templates, setTemplates] = useState<EventTemplateRow[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  const [events, setEvents] = useState<StoreEventRow[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [modalDateStr, setModalDateStr] = useState('');
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalTemplateId, setModalTemplateId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];

  // 店舗一覧取得
  useEffect(() => {
    const fetchStores = async () => {
      setIsLoadingStores(true);

      try {
        const res = await fetch('/api/stores');

        if (!res.ok) return;

        const data: StoreRow[] = await res.json();

        setStores(data);

        if (data.length > 0) {
          setSelectedStoreId(data[0].id);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingStores(false);
      }
    };

    fetchStores();
  }, []);

  // イベントテンプレート取得（店舗が変わるたび）
  useEffect(() => {
    if (!selectedStoreId) return;

    const fetchTemplates = async () => {
      setIsLoadingTemplates(true);

      try {
        const res = await fetch(`/api/event-templates?storeId=${selectedStoreId}`);

        if (!res.ok) return;

        const data: EventTemplateRow[] = await res.json();

        setTemplates(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [selectedStoreId]);

  // 店舗イベント取得（店舗・年月が変わるたび）
  const fetchEvents = async () => {
    if (!selectedStoreId) return;

    setIsLoadingEvents(true);

    try {
      const res = await fetch(
        `/api/store-events?storeId=${selectedStoreId}&year=${currentYear}&month=${currentMonth}`
      );

      if (!res.ok) return;

      const data: StoreEventRow[] = await res.json();

      setEvents(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId, currentYear, currentMonth]);

  // カレンダーのマス目（前後の空白セル込みで週単位に整形）
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();

  const cells: CalendarCell[] = [];

  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ dateStr: null, dayNum: null, dayOfWeek: null });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(currentYear, currentMonth - 1, d);
    const dayOfWeekStr = dayLabels[dateObj.getDay()];
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    cells.push({ dateStr, dayNum: d, dayOfWeek: dayOfWeekStr });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ dateStr: null, dayNum: null, dayOfWeek: null });
  }

  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const openCreateModal = (dateStr: string) => {
    setModalMode('create');
    setModalDateStr(dateStr);
    setEditingEventId(null);
    setModalTitle('');
    setModalTemplateId('');
    setIsModalOpen(true);
  };

  const openEditModal = (ev: StoreEventRow) => {
    setModalMode('edit');
    setModalDateStr(ev.date);
    setEditingEventId(ev.id);
    setModalTitle(ev.title);
    setModalTemplateId(ev.templateId ? String(ev.templateId) : '');
    setIsModalOpen(true);
  };

  const handleTemplateSelect = (value: string) => {
    setModalTemplateId(value);

    if (value !== '') {
      const template = templates.find((t) => t.id === Number(value));
      if (template) {
        setModalTitle(template.name);
      }
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!modalTitle.trim()) {
      alert('タイトルを入力してください');
      return;
    }

    setIsSaving(true);

    try {
      if (modalMode === 'create') {
        const res = await fetch('/api/store-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId: selectedStoreId,
            date: modalDateStr,
            title: modalTitle.trim(),
            templateId: modalTemplateId === '' ? null : Number(modalTemplateId),
          }),
        });

        const body = await res.json();

        if (!res.ok) {
          alert(body.error ?? 'イベントの登録に失敗しました');
          return;
        }

        setEvents((prev) => [...prev, body]);
      } else {
        const res = await fetch(`/api/store-events/${editingEventId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: modalTitle.trim(),
            templateId: modalTemplateId === '' ? null : Number(modalTemplateId),
          }),
        });

        const body = await res.json();

        if (!res.ok) {
          alert(body.error ?? 'イベントの更新に失敗しました');
          return;
        }

        setEvents((prev) => prev.map((ev) => (ev.id === editingEventId ? body : ev)));
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('通信エラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (ev: StoreEventRow) => {
    const confirmed = confirm(`イベント「${ev.title}」を削除しますか？`);

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/store-events/${ev.id}`, {
        method: 'DELETE',
      });

      const body = await res.json();

      if (!res.ok) {
        alert(body.error ?? 'イベントの削除に失敗しました');
        return;
      }

      setEvents((prev) => prev.filter((e) => e.id !== ev.id));
    } catch (error) {
      console.error(error);
      alert('通信エラーが発生しました');
    }
  };

  const selectedTemplatePreview =
    modalTemplateId !== ''
      ? templates.find((t) => t.id === Number(modalTemplateId))
      : null;

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-800">
      <div className="mb-4">
        <Link href="/" className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium">
          ← シフトダッシュボード（メイン画面）へ戻る
        </Link>
      </div>

      <header className="mb-6 bg-white p-6 rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">📅 イベントカレンダー</h1>
        <p className="text-sm text-gray-500 mt-1">
          日付ごとにイベントテンプレートを割り当てると、AIシフト自動作成がその日の必要人数・必要スキルを考慮するようになります。
        </p>
      </header>

      {/* 店舗選択・月切り替え */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500 whitespace-nowrap">対象店舗</label>
          <select
            value={selectedStoreId}
            disabled={isLoadingStores || stores.length === 0}
            onChange={(e) => setSelectedStoreId(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400"
          >
            {isLoadingStores && <option value={0}>読み込み中...</option>}
            {!isLoadingStores && stores.length === 0 && <option value={0}>店舗がありません</option>}
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold"
          >
            ← 前月
          </button>
          <span className="text-sm font-bold text-gray-700 min-w-[90px] text-center">
            {currentYear}年 {currentMonth}月
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold"
          >
            次月 →
          </button>
        </div>
      </div>

      {/* カレンダー本体 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {dayLabels.map((label) => (
            <div
              key={label}
              className="p-2 text-center text-xs font-bold text-gray-500 border-r border-gray-100 last:border-r-0"
            >
              {label}
            </div>
          ))}
        </div>

        {isLoadingEvents ? (
          <div className="p-8 text-center text-xs text-gray-400">読み込み中...</div>
        ) : (
          weeks.map((week, wIdx) => (
            <div key={wIdx} className="grid grid-cols-7 border-b border-gray-100 last:border-b-0">
              {week.map((cell, cIdx) => {
                if (!cell.dateStr) {
                  return (
                    <div
                      key={cIdx}
                      className="min-h-[110px] p-2 border-r border-gray-100 last:border-r-0 bg-gray-50/40"
                    />
                  );
                }

                const dayEvents = events.filter((ev) => ev.date === cell.dateStr);

                let dayColor = 'text-gray-700';
                if (cell.dayOfWeek === '土') dayColor = 'text-blue-600';
                if (cell.dayOfWeek === '日') dayColor = 'text-red-500';

                return (
                  <div
                    key={cIdx}
                    className="min-h-[110px] p-2 border-r border-gray-100 last:border-r-0 flex flex-col gap-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-bold ${dayColor}`}>{cell.dayNum}</span>
                      <button
                        type="button"
                        onClick={() => openCreateModal(cell.dateStr!)}
                        className="text-[10px] text-purple-500 hover:text-purple-700 font-bold"
                      >
                        ＋追加
                      </button>
                    </div>

                    <div className="flex flex-col gap-1">
                      {dayEvents.map((ev) => (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => openEditModal(ev)}
                          className="text-left text-[10px] px-1.5 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded truncate font-medium"
                          title={ev.title}
                        >
                          {ev.title}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* 新規登録・編集兼用のモーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {modalMode === 'create' ? '📅 イベントを追加' : '📝 イベントを編集'}
            </h3>
            <p className="text-xs text-gray-400 mb-4">{modalDateStr}</p>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  テンプレートから選択（任意）
                </label>
                <select
                  value={modalTemplateId}
                  disabled={isLoadingTemplates}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-100"
                >
                  <option value="">自由入力（テンプレートを使わない）</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTemplatePreview && selectedTemplatePreview.requirements.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                  {selectedTemplatePreview.requirements.map((r) => (
                    <span
                      key={r.skillId}
                      className="text-[11px] bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded"
                    >
                      {r.skillName}: <strong className="text-gray-800">{r.count}名</strong>
                    </span>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">タイトル</label>
                <input
                  type="text"
                  required
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="例: 週末セール日、店内棚卸し"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  同じ日でもタイトルが違えば複数のイベントを登録できます。
                </p>
              </div>

              <div className="flex gap-2 justify-between pt-2 border-t border-gray-100">
                {modalMode === 'edit' && (
                  <button
                    type="button"
                    onClick={() => {
                      const ev = events.find((e) => e.id === editingEventId);
                      if (ev) {
                        setIsModalOpen(false);
                        handleDeleteEvent(ev);
                      }
                    }}
                    className="px-4 py-2 text-xs font-medium text-red-500 hover:underline"
                  >
                    このイベントを削除
                  </button>
                )}

                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSaving}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white text-xs font-semibold rounded-lg shadow"
                  >
                    {isSaving ? '保存中...' : modalMode === 'create' ? '登録する' : '変更を適用'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}