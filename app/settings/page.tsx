'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface StoreRow {
  id: number;
  name: string;
}

interface SkillRow {
  id: number;
  name: string;
}

interface Requirement {
  skillId: number;
  skillName: string;
  count: number;
}

interface EventTemplate {
  id: number;
  name: string;
  requirements: Requirement[];
}

export default function SettingsPage() {
  // 店舗
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState(0);
  const [isLoadingStores, setIsLoadingStores] = useState(true);

  // スキルマスタ
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);
  const [newSkillName, setNewSkillName] = useState('');
  const [isAddingSkill, setIsAddingSkill] = useState(false);

  // イベントテンプレート
  const [events, setEvents] = useState<EventTemplate[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // モーダルの開閉状態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  // モーダル用入力State
  const [eventName, setEventName] = useState('');
  const [requirementsInput, setRequirementsInput] = useState<{ [skillId: number]: number }>({});

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

  // スキル一覧取得（店舗共通なので初回のみ）
  useEffect(() => {
    const fetchSkills = async () => {
      setIsLoadingSkills(true);

      try {
        const res = await fetch('/api/skills');

        if (!res.ok) return;

        const data: SkillRow[] = await res.json();

        setSkills(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingSkills(false);
      }
    };

    fetchSkills();
  }, []);

  // イベントテンプレート取得（選択中の店舗が変わるたび）
  useEffect(() => {
    if (!selectedStoreId) return;

    const fetchEvents = async () => {
      setIsLoadingEvents(true);

      try {
        const res = await fetch(`/api/event-templates?storeId=${selectedStoreId}`);

        if (!res.ok) return;

        const data: EventTemplate[] = await res.json();

        setEvents(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [selectedStoreId]);

  // スキル追加
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newSkillName.trim()) return;

    setIsAddingSkill(true);

    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newSkillName.trim() }),
      });

      const body = await res.json();

      if (!res.ok) {
        alert(body.error ?? 'スキル登録に失敗しました');
        return;
      }

      setSkills((prev) => [...prev, body]);
      setNewSkillName('');
    } catch (error) {
      console.error(error);
      alert('通信エラーが発生しました');
    } finally {
      setIsAddingSkill(false);
    }
  };

  // スキル削除
  const handleDeleteSkill = async (skill: SkillRow) => {
    const confirmed = confirm(
      `スキル「${skill.name}」を削除しますか？\nこのスキルを使っているスタッフの紐付けや、イベントテンプレートの人数設定も一緒に削除されます。`
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/skills/${skill.id}`, {
        method: 'DELETE',
      });

      const body = await res.json();

      if (!res.ok) {
        alert(body.error ?? 'スキル削除に失敗しました');
        return;
      }

      setSkills((prev) => prev.filter((s) => s.id !== skill.id));

      // イベントテンプレート側の人数設定も変わった可能性があるため再取得
      if (selectedStoreId) {
        const eventsRes = await fetch(`/api/event-templates?storeId=${selectedStoreId}`);

        if (eventsRes.ok) {
          const eventsData: EventTemplate[] = await eventsRes.json();
          setEvents(eventsData);
        }
      }
    } catch (error) {
      console.error(error);
      alert('通信エラーが発生しました');
    }
  };

  // 新規作成モーダルを開く
  const openCreateModal = () => {
    setModalMode('create');
    setEditingEventId(null);
    setEventName('');

    const initialReqs: { [skillId: number]: number } = {};
    skills.forEach((skill) => {
      initialReqs[skill.id] = 0;
    });
    setRequirementsInput(initialReqs);
    setIsModalOpen(true);
  };

  // 編集モーダルを開く
  const openEditModal = (event: EventTemplate) => {
    setModalMode('edit');
    setEditingEventId(event.id);
    setEventName(event.name);

    const initialReqs: { [skillId: number]: number } = {};
    skills.forEach((skill) => {
      const found = event.requirements.find((r) => r.skillId === skill.id);
      initialReqs[skill.id] = found ? found.count : 0;
    });
    setRequirementsInput(initialReqs);
    setIsModalOpen(true);
  };

  // モーダル内で各スキルの人数が変更された時の処理
  const handleCountChange = (skillId: number, count: number) => {
    setRequirementsInput((prev) => ({
      ...prev,
      [skillId]: Math.max(0, count),
    }));
  };

  // テンプレートの保存処理（新規・編集共通）
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventName.trim()) {
      alert('イベント名を入力してください');
      return;
    }

    const validRequirements = Object.keys(requirementsInput)
      .map((key) => Number(key))
      .filter((skillId) => requirementsInput[skillId] > 0)
      .map((skillId) => ({ skillId, count: requirementsInput[skillId] }));

    if (validRequirements.length === 0) {
      alert('少なくとも1つのスキルに1名以上の人数を設定してください');
      return;
    }

    if (!selectedStoreId) {
      alert('店舗を選択してください');
      return;
    }

    setIsSavingEvent(true);

    try {
      if (modalMode === 'create') {
        const res = await fetch('/api/event-templates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storeId: selectedStoreId,
            name: eventName.trim(),
            requirements: validRequirements,
          }),
        });

        const body = await res.json();

        if (!res.ok) {
          alert(body.error ?? 'イベントテンプレートの登録に失敗しました');
          return;
        }

        setEvents((prev) => [...prev, body]);
        alert(`【登録完了】イベントテンプレート「${eventName.trim()}」を追加しました。`);
      } else {
        const res = await fetch(`/api/event-templates/${editingEventId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: eventName.trim(),
            requirements: validRequirements,
          }),
        });

        const body = await res.json();

        if (!res.ok) {
          alert(body.error ?? 'イベントテンプレートの更新に失敗しました');
          return;
        }

        setEvents((prev) =>
          prev.map((ev) => (ev.id === editingEventId ? body : ev))
        );
        alert(`【更新完了】イベントテンプレート「${eventName.trim()}」を修正しました。`);
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('通信エラーが発生しました');
    } finally {
      setIsSavingEvent(false);
    }
  };

  // イベント削除ボタンの処理
  const handleDeleteEvent = async (id: number, name: string) => {
    const confirmed = confirm(`イベントテンプレート「${name}」を削除しますか？`);

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/event-templates/${id}`, {
        method: 'DELETE',
      });

      const body = await res.json();

      if (!res.ok) {
        alert(body.error ?? 'イベントテンプレートの削除に失敗しました');
        return;
      }

      setEvents((prev) => prev.filter((ev) => ev.id !== id));
    } catch (error) {
      console.error(error);
      alert('通信エラーが発生しました');
    }
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
      <header className="mb-6 bg-white p-6 rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">⚙️ スキル ＆ イベント設定マスタ</h1>
        <p className="text-sm text-gray-500 mt-1">
          店舗独自の役割（スキル）と、日別の必要人数パターン（イベント）を自由にカスタマイズします。この設定があらゆる業種への流用を可能にします。
        </p>
      </header>

      {/* 店舗選択 */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
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
        <span className="text-xs text-gray-400">※ イベントテンプレートは店舗ごとに管理されます</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左側：スキルマスタ管理 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🏷️</span> スキル（職能・ポジション）の定義
          </h2>

          {/* 追加フォーム */}
          <form onSubmit={handleAddSkill} className="mb-6 flex gap-2">
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="例: キッチン、採寸、ラテアート等"
              disabled={isAddingSkill}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={isAddingSkill}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg shadow transition-colors"
            >
              ＋ スキルを追加
            </button>
          </form>

          {/* スキル一覧 */}
          <p className="text-xs text-gray-400 mb-2">現在登録されているスキル（クリックで削除可能）</p>
          {isLoadingSkills ? (
            <p className="text-xs text-gray-400">読み込み中...</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 text-sm rounded-lg font-medium group"
                >
                  {skill.name}
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
          )}
        </div>

        {/* 右側：イベントテンプレート管理 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📢</span> 日別イベント・必要人数のテンプレート
          </h2>

          {isLoadingEvents ? (
            <p className="text-xs text-gray-400">読み込み中...</p>
          ) : (
            <div className="space-y-4">
              {events.length === 0 && (
                <p className="text-xs text-gray-400">この店舗のイベントテンプレートはまだありません</p>
              )}
              {events.map((ev) => (
                <div key={ev.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-all">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-gray-800 text-sm">{ev.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(ev)}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(ev.id, ev.name)}
                        className="text-xs text-red-500 hover:underline font-medium"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                  {/* 必要なスキルの内訳 */}
                  <div className="flex flex-wrap gap-2">
                    {ev.requirements.map((req) => (
                      <span key={req.skillId} className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded">
                        {req.skillName}: <strong className="text-gray-800">{req.count}名</strong>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={openCreateModal}
            disabled={!selectedStoreId || isLoadingSkills}
            className="w-full mt-4 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 text-gray-700 text-xs font-bold rounded-lg border border-dashed border-gray-300 transition-colors"
          >
            ＋ 新しいイベントテンプレートを作成
          </button>
        </div>
      </div>

      {/* 新規登録・編集兼用のモーダルウィンドウ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {modalMode === 'create' ? '📅 新しいテンプレートを作成' : '📝 テンプレートを編集'}
            </h3>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">イベント名</label>
                <input
                  type="text"
                  required
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="例: クリスマス商戦、平日雨天時"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">必要な職能・ポジションごとの人数</label>
                <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-100 p-2 rounded-lg bg-gray-50">
                  {skills.map((skill) => (
                    <div key={skill.id} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200">
                      <span className="text-xs font-medium text-gray-700">{skill.name}</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          value={requirementsInput[skill.id] || 0}
                          onChange={(e) => handleCountChange(skill.id, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <span className="text-xs text-gray-500">名</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSavingEvent}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSavingEvent}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white text-xs font-semibold rounded-lg shadow"
                >
                  {isSavingEvent ? '保存中...' : modalMode === 'create' ? 'テンプレートを保存' : '変更を適用'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}