'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'AIアシスタント', text: '現在のシフト案を分析しました。6/24(水)の「棚卸し」の時間帯に検品スキルを持つスタッフが1名不足しています。他店舗へ応援要請を行いますか？', isAi: true },
  ]);
  const [inputText, setInputText] = useState('');

  // AIが作った打診文のテンプレート
  const aiTemplateText = "【ヘルプ要請】希望ヶ丘店 店長の横浜です。急なご連絡で恐縮ですが、6/24(水)の10:00-15:00（棚卸し業務）にて、検品スキルをお持ちのスタッフ様を1名アサインいただくことは可能でしょうか？";

  // メッセージ送信アクション
  const handleSend = (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    // ユーザーのメッセージを追加
    const userMsg = { id: messages.length + 1, sender: '横浜 店長（あなた）', text: textToSend, isAi: false };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // 1秒後に他店舗の店長から擬似返信が来る（リッチなモック動作）
    setTimeout(() => {
      const replyMsg = {
        id: messages.length + 2,
        sender: '渋谷店 鈴木店長',
        text: '横浜さんお疲れ様です！その日、ちょうど検品ができるベテランのアルバイトが1名フリーで動けますので、横浜店に応援に行かせるように手配しますね！',
        isAi: false
      };
      setMessages(prev => [...prev, replyMsg]);
    }, 1200);
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
      <header className="bg-white p-4 rounded-t-xl shadow-sm border-b border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-gray-800">💬 他店舗ヘルプ相談ルーム</h1>
          <p className="text-xs text-gray-400 mt-0.5">AI提案の文章を使って、エリア内の他店長へチャットで応援要請ができます。</p>
        </div>
        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">オンライン</span>
      </header>

      {/* チャット履歴エリア */}
      <div className="flex-1 bg-white p-6 h-[400px] overflow-y-auto border-x border-gray-100 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender.includes('あなた') ? 'items-end' : 'items-start'}`}>
            <span className="text-[10px] text-gray-400 mb-1 px-1">{msg.sender}</span>
            <div className={`max-w-md p-3.5 rounded-2xl text-sm ${
              msg.sender.includes('あなた') 
                ? 'bg-purple-600 text-white rounded-tr-none' 
                : msg.isAi 
                  ? 'bg-purple-50 text-purple-900 border border-purple-200 rounded-tl-none'
                  : 'bg-gray-100 text-gray-800 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* 下部：AIの提案文章をコピペできる親切エリア */}
      <div className="bg-purple-50 p-4 border-x border-t border-purple-100">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-purple-800 flex items-center gap-1">✨ AIが自動作成したヘルプ打診文</span>
          <button 
            onClick={() => handleSend(aiTemplateText)}
            className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 rounded-md font-semibold transition-colors shadow-sm"
          >
            🚀 この文章をチャットに送信する
          </button>
        </div>
        <p className="text-xs text-gray-600 bg-white p-2.5 rounded-lg border border-purple-200 italic leading-relaxed">
          {aiTemplateText}
        </p>
      </div>

      {/* チャット入力フォーム */}
      <div className="bg-gray-100 p-4 rounded-b-xl flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="メッセージを入力するか、上のAI自動生成文を送信してください..."
          className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
        />
        <button
          onClick={() => handleSend(inputText)}
          className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg shadow transition-colors"
        >
          送信
        </button>
      </div>
    </div>
  );
}