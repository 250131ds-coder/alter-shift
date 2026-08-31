'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface StoreRow {
  id: number;
  name: string;
}

interface ChatMessage {
  id: number;
  fromStoreId: number;
  toStoreId: number | null;
  fromStoreName: string;
  toStoreName: string | null;
  message: string;
  isAi: boolean;
  sentAt: string | null;
  createdAt: string;
}

interface Suggestion {
  hasShortage: boolean;
  analysisText?: string;
  draftMessage?: string;
  eventDate?: string;
  eventTitle?: string;
  skillName?: string;
  shortage?: number;
}

export default function ChatPage() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);

  const [fromStoreId, setFromStoreId] = useState(0);
  const [toStoreId, setToStoreId] = useState(0);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

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
          setFromStoreId(data[0].id);

          if (data.length > 1) {
            setToStoreId(data[1].id);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingStores(false);
      }
    };

    fetchStores();
  }, []);

  // AI提案取得（自店舗が変わるたび）
  useEffect(() => {
    if (!fromStoreId) return;

    const fetchSuggestion = async () => {
      setIsLoadingSuggestion(true);
      setSuggestion(null);

      try {
        const res = await fetch('/api/help-chats/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storeId: fromStoreId }),
        });

        if (!res.ok) return;

        const data: Suggestion = await res.json();

        setSuggestion(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingSuggestion(false);
      }
    };

    fetchSuggestion();
  }, [fromStoreId]);

  // チャット履歴取得
  const fetchMessages = useCallback(async () => {
    if (!fromStoreId || !toStoreId || fromStoreId === toStoreId) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);

    try {
      const res = await fetch(
        `/api/help-chats?fromStoreId=${fromStoreId}&toStoreId=${toStoreId}`
      );

      if (!res.ok) return;

      const data: ChatMessage[] = await res.json();

      setMessages(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [fromStoreId, toStoreId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSend = async (textToSend: string, isAi: boolean = false) => {
    if (!textToSend.trim()) return;

    if (!fromStoreId || !toStoreId) {
      alert('自店舗と宛先店舗を選択してください');
      return;
    }

    if (fromStoreId === toStoreId) {
      alert('自店舗と宛先店舗が同じです。宛先店舗を変更してください');
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch('/api/help-chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromStoreId,
          toStoreId,
          message: textToSend,
          isAi,
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        alert(body.error ?? 'メッセージの送信に失敗しました');
        return;
      }

      setMessages((prev) => [...prev, body]);
      setInputText('');
    } catch (error) {
      console.error(error);
      alert('通信エラーが発生しました');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-800 flex flex-col max-w-4xl mx-auto">
      {/* 戻るボタン */}
      <div className="mb-4">
        <Link href="/" className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium">
          ← シフトダッシュボード（メイン画面）へ戻る
        </Link>
      </div>

      {/* ヘッダー */}
      <header className="bg-white p-4 rounded-t-xl shadow-sm border-b border-gray-100">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-lg font-bold text-gray-800">💬 他店舗ヘルプ相談ルーム</h1>
            <p className="text-xs text-gray-400 mt-0.5">AI提案の文章を使って、エリア内の他店長へチャットで応援要請ができます。</p>
          </div>
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">オンライン</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 whitespace-nowrap">自店舗</label>
            <select
              value={fromStoreId}
              disabled={isLoadingStores || stores.length === 0}
              onChange={(e) => setFromStoreId(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-100"
            >
              {isLoadingStores && <option value={0}>読み込み中...</option>}
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 whitespace-nowrap">宛先店舗</label>
            <select
              value={toStoreId}
              disabled={isLoadingStores || stores.length === 0}
              onChange={(e) => setToStoreId(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-100"
            >
              {isLoadingStores && <option value={0}>読み込み中...</option>}
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={fetchMessages}
            className="text-xs text-purple-600 hover:underline font-medium ml-auto"
          >
            🔄 更新
          </button>
        </div>

        {fromStoreId === toStoreId && fromStoreId !== 0 && (
          <p className="text-xs text-red-500 mt-2">自店舗と宛先店舗が同じです。宛先店舗を変更してください。</p>
        )}
      </header>

      {/* AI分析メッセージ */}
      {isLoadingSuggestion && (
        <div className="bg-white px-6 py-3 border-x border-gray-100 text-xs text-gray-400">
          AIが現在のシフト案を分析しています...
        </div>
      )}

      {!isLoadingSuggestion && suggestion?.hasShortage && (
        <div className="bg-white px-6 py-4 border-x border-gray-100">
          <div className="flex flex-col items-start">
            <span className="text-[10px] text-gray-400 mb-1 px-1">AIアシスタント</span>
            <div className="max-w-md p-3.5 rounded-2xl text-sm bg-purple-50 text-purple-900 border border-purple-200 rounded-tl-none">
              {suggestion.analysisText}
            </div>
          </div>
        </div>
      )}

      {/* チャット履歴エリア */}
      <div className="flex-1 bg-white p-6 h-[400px] overflow-y-auto border-x border-gray-100 space-y-4">
        {isLoadingMessages ? (
          <p className="text-xs text-gray-400">読み込み中...</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-gray-400">まだメッセージはありません</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.fromStoreId === fromStoreId;

            return (
              <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-gray-400 mb-1 px-1">
                  {isMine ? `${msg.fromStoreName}（あなた）` : msg.fromStoreName}
                </span>
                <div
                  className={`max-w-md p-3.5 rounded-2xl text-sm ${
                    isMine
                      ? 'bg-purple-600 text-white rounded-tr-none'
                      : msg.isAi
                        ? 'bg-purple-50 text-purple-900 border border-purple-200 rounded-tl-none'
                        : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 下部：AIの提案文章 */}
      {!isLoadingSuggestion && suggestion?.hasShortage && suggestion.draftMessage && (
        <div className="bg-purple-50 p-4 border-x border-t border-purple-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-purple-800 flex items-center gap-1">✨ AIが自動作成したヘルプ打診文</span>
            <button
              onClick={() => handleSend(suggestion.draftMessage!, true)}
              disabled={isSending || fromStoreId === toStoreId}
              className="text-xs bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-2.5 py-1 rounded-md font-semibold transition-colors shadow-sm"
            >
              🚀 この文章をチャットに送信する
            </button>
          </div>
          <p className="text-xs text-gray-600 bg-white p-2.5 rounded-lg border border-purple-200 italic leading-relaxed">
            {suggestion.draftMessage}
          </p>
        </div>
      )}

      {/* チャット入力フォーム */}
      <div className="bg-gray-100 p-4 rounded-b-xl flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="メッセージを入力してください..."
          disabled={isSending}
          className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
          onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
        />
        <button
          onClick={() => handleSend(inputText)}
          disabled={isSending}
          className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg shadow transition-colors"
        >
          {isSending ? '送信中...' : '送信'}
        </button>
      </div>
    </div>
  );
}