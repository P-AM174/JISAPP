"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { JisappLogo } from "@/components/jisapp-logo";
import {
  Sparkles,
  Send,
  Clock,
  Banknote,
  CheckCircle2,
  Loader,
  Package,
  MessageSquare,
  Bot,
  AlertTriangle,
  X,
  ShieldCheck,
  FastForward,
} from "lucide-react";

// ─── 型 ───
type MessageSender = "user" | "creator" | "system" | "gemini";

type Message = {
  id: string;
  text: string;
  sender: MessageSender;
  senderName: string;
  timestamp: string;
  isLoading?: boolean;
};

type ChatRoomStatus =
  | "相談中"
  | "開発中"
  | "納品済み"
  | "動作確認待ち"
  | "取引完了（決済確定）"
  | "完了";

type ChatRoom = {
  id: string;
  title: string;
  budget: string;
  deadline: string;
  status: ChatRoomStatus;
  creatorName: string;
  clientName: string;
  deliveredAt?: number | null;
};

// デモ用：表示上は48時間、実際は10秒で自動完了
const DEMO_AUTO_COMPLETE_SEC = 10;
const DISPLAY_TIMER_START = 47 * 3600 + 59 * 60 + 59;

const GEMINI_RULING =
  "【Gemini AI 判定レポート】出品されたソースコードの構文・ロジックを検証した結果、バグは一切検出されませんでした。原因は購入者側の設定ミス（権限未許可等）と断定します。利用規約に基づき、本取引をシステム側で【強制完了】とし、出品者への送金処理を実行しました。";

// ─── ステータス設定 ───
const STATUS_CONFIG: Record<
  ChatRoomStatus,
  { color: string; dot: string; icon: typeof MessageSquare }
> = {
  相談中: { color: "bg-amber-100 text-amber-700", dot: "bg-amber-400", icon: MessageSquare },
  開発中: { color: "bg-blue-100 text-blue-700", dot: "bg-blue-400", icon: Loader },
  納品済み: { color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", icon: Package },
  動作確認待ち: { color: "bg-orange-100 text-orange-700", dot: "bg-orange-400", icon: Clock },
  "取引完了（決済確定）": { color: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-600", icon: CheckCircle2 },
  完了: { color: "bg-gray-100 text-gray-600", dot: "bg-gray-400", icon: CheckCircle2 },
};

const STATUS_ORDER: ChatRoomStatus[] = [
  "相談中",
  "開発中",
  "納品済み",
  "動作確認待ち",
  "取引完了（決済確定）",
  "完了",
];

const INITIAL_MESSAGES: Record<string, Message[]> = {
  default: [
    {
      id: "m1",
      sender: "creator",
      senderName: "クリエイター",
      text: "はじめまして！ご依頼ありがとうございます。要件について詳しく教えていただけますか？",
      timestamp: new Date(Date.now() - 3600000).toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ],
};

function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function nowTime() {
  return new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

// ─── チャットページ ───
export default function ChatPage() {
  const params = useParams();
  const chatId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [senderMode, setSenderMode] = useState<"user" | "creator">("user");
  const [room, setRoom] = useState<ChatRoom>({
    id: chatId,
    title: "依頼・相談",
    budget: "応相談",
    deadline: "応相談",
    status: "相談中",
    creatorName: "クリエイター",
    clientName: "あなた",
  });
  const [mounted, setMounted] = useState(false);

  // 防衛策①
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [aiMediationRunning, setAiMediationRunning] = useState(false);

  // 防衛策③
  const [timerActive, setTimerActive] = useState(false);
  const [displayTimerSec, setDisplayTimerSec] = useState(DISPLAY_TIMER_START);
  const [demoTicksLeft, setDemoTicksLeft] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const mediationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistMessages = useCallback(
    (msgs: Message[]) => {
      try {
        localStorage.setItem(`jisapp_chat_${chatId}`, JSON.stringify(msgs));
      } catch {
        /* noop */
      }
    },
    [chatId]
  );

  const persistRoom = useCallback(
    (r: ChatRoom) => {
      try {
        localStorage.setItem(`jisapp_chatroom_${chatId}`, JSON.stringify(r));
      } catch {
        /* noop */
      }
    },
    [chatId]
  );

  const appendMessages = useCallback(
    (newMsgs: Message[]) => {
      setMessages((prev) => {
        const updated = [...prev, ...newMsgs];
        persistMessages(updated);
        return updated;
      });
    },
    [persistMessages]
  );

  const forceComplete = useCallback(
    (reason: "ai" | "timer") => {
      setRoom((prev) => {
        const updated: ChatRoom = { ...prev, status: "取引完了（決済確定）" };
        persistRoom(updated);
        return updated;
      });
      setTimerActive(false);
      setDemoTicksLeft(0);
      setAiMediationRunning(false);

      if (reason === "timer") {
        appendMessages([
          {
            id: `sys_auto_${Date.now()}`,
            sender: "system",
            senderName: "ジサップシステム",
            text: "⏳ 納品から48時間が経過したため、タイマーシステムにより取引を自動的に完了しました。売上金が出品者に反映されます。",
            timestamp: nowTime(),
          },
        ]);
      }
    },
    [persistRoom, appendMessages]
  );

  // Gemini AI 仲介フロー
  const runGeminiMediation = useCallback(
    (complaintText: string) => {
      setAiMediationRunning(true);

      appendMessages([
        {
          id: `user_reject_${Date.now()}`,
          sender: "user",
          senderName: room.clientName,
          text: `【受取拒否・動作不良の報告】\n${complaintText}`,
          timestamp: nowTime(),
        },
        {
          id: `sys_warn_${Date.now()}`,
          sender: "system",
          senderName: "ジサップシステム",
          text: "⚠️ トラブル検知：購入者から動作不良の報告があったため、Gemini AIがソースコードの緊急動作検証を開始します...",
          timestamp: nowTime(),
          isLoading: true,
        },
      ]);

      if (mediationTimerRef.current) clearTimeout(mediationTimerRef.current);

      mediationTimerRef.current = setTimeout(() => {
        setMessages((prev) => {
          const updated = prev.map((m) =>
            m.isLoading
              ? {
                  ...m,
                  isLoading: false,
                  text: "⚠️ トラブル検知：購入者から動作不良の報告があったため、Gemini AIがソースコードの緊急動作検証を完了しました。",
                }
              : m
          );
          const withGemini: Message[] = [
            ...updated,
            {
              id: `gemini_${Date.now()}`,
              sender: "gemini",
              senderName: "Gemini AI",
              text: GEMINI_RULING,
              timestamp: nowTime(),
            },
          ];
          persistMessages(withGemini);
          return withGemini;
        });

        setRoom((prev) => {
          const updated: ChatRoom = { ...prev, status: "取引完了（決済確定）" };
          persistRoom(updated);
          return updated;
        });
        setTimerActive(false);
        setAiMediationRunning(false);
      }, 3000);
    },
    [room.clientName, appendMessages, persistMessages, persistRoom]
  );

  const handleRejectSubmit = () => {
    const text = rejectReason.trim();
    if (!text) return;
    setShowRejectModal(false);
    setRejectReason("");
    runGeminiMediation(text);
  };

  // 納品 → 動作確認待ち + タイマー起動
  const handleDeliver = () => {
    const updatedRoom: ChatRoom = {
      ...room,
      status: "動作確認待ち",
      deliveredAt: Date.now(),
    };
    setRoom(updatedRoom);
    persistRoom(updatedRoom);
    setTimerActive(true);
    setDisplayTimerSec(DISPLAY_TIMER_START);
    setDemoTicksLeft(DEMO_AUTO_COMPLETE_SEC);

    appendMessages([
      {
        id: `sys_deliver_${Date.now()}`,
        sender: "system",
        senderName: "ジサップシステム",
        text: `📦 ${room.creatorName} が納品しました。購入者は動作確認のうえ【受取完了】または不具合報告を行ってください。`,
        timestamp: nowTime(),
      },
    ]);
  };

  const handleDemoAccelerate = () => {
    forceComplete("timer");
  };

  // チャットルーム・メッセージ読み込み
  useEffect(() => {
    try {
      const rawRoom = localStorage.getItem(`jisapp_chatroom_${chatId}`);
      if (rawRoom) {
        const parsed: ChatRoom = JSON.parse(rawRoom);
        setRoom(parsed);
        if (parsed.status === "動作確認待ち" && parsed.deliveredAt) {
          setTimerActive(true);
          setDisplayTimerSec(DISPLAY_TIMER_START);
          setDemoTicksLeft(DEMO_AUTO_COMPLETE_SEC);
        }
      } else {
        if (chatId.startsWith("creator_")) {
          const creatorNames: Record<string, string> = {
            creator_1: "田中 拓也",
            creator_2: "山田 彩花",
            creator_3: "佐々木 健",
            creator_4: "中村 美咲",
          };
          const name = creatorNames[chatId] ?? "クリエイター";
          const newRoom: ChatRoom = {
            id: chatId,
            title: `${name} への個別相談`,
            budget: "応相談",
            deadline: "応相談",
            status: "相談中",
            creatorName: name,
            clientName: "あなた",
          };
          setRoom(newRoom);
          localStorage.setItem(`jisapp_chatroom_${chatId}`, JSON.stringify(newRoom));
        } else if (chatId.startsWith("req_")) {
          const reqId = chatId.replace("req_", "");
          const newRoom: ChatRoom = {
            id: chatId,
            title: `依頼 #${reqId} の相談`,
            budget: "応相談",
            deadline: "応相談",
            status: "相談中",
            creatorName: "クリエイター",
            clientName: "あなた",
          };
          setRoom(newRoom);
          localStorage.setItem(`jisapp_chatroom_${chatId}`, JSON.stringify(newRoom));
        }
      }
    } catch {
      /* noop */
    }

    try {
      const rawMsgs = localStorage.getItem(`jisapp_chat_${chatId}`);
      if (rawMsgs) {
        setMessages(JSON.parse(rawMsgs));
      } else {
        const initial = INITIAL_MESSAGES.default;
        setMessages(initial);
        localStorage.setItem(`jisapp_chat_${chatId}`, JSON.stringify(initial));
      }
    } catch {
      /* noop */
    }

    setMounted(true);

    return () => {
      if (mediationTimerRef.current) clearTimeout(mediationTimerRef.current);
    };
  }, [chatId]);

  // 48時間タイマー（デモ：10秒で自動完了、表示は48h風に減少）
  useEffect(() => {
    if (!timerActive || room.status !== "動作確認待ち") return;

    const interval = setInterval(() => {
      setDemoTicksLeft((t) => {
        if (t <= 1) {
          setTimeout(() => forceComplete("timer"), 0);
          return 0;
        }
        return t - 1;
      });
      setDisplayTimerSec((s) => {
        const step = DISPLAY_TIMER_START / DEMO_AUTO_COMPLETE_SEC;
        return Math.max(0, s - step);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, room.status, forceComplete]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const msg: Message = {
      id: `msg_${Date.now()}`,
      text,
      sender: senderMode,
      senderName: senderMode === "user" ? room.clientName : room.creatorName,
      timestamp: nowTime(),
    };
    appendMessages([msg]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStatusChange = (next: ChatRoomStatus) => {
    if (next === "動作確認待ち") {
      handleDeliver();
      return;
    }
    const updated = { ...room, status: next };
    setRoom(updated);
    persistRoom(updated);
    setTimerActive(false);
  };

  const statusCfg = STATUS_CONFIG[room.status] ?? STATUS_CONFIG["相談中"];
  const isCompleted =
    room.status === "取引完了（決済確定）" || room.status === "完了";
  const canDeliver =
    !isCompleted &&
    room.status !== "動作確認待ち" &&
    (room.status === "開発中" || room.status === "納品済み");
  const canReject =
    room.status === "動作確認待ち" && !aiMediationRunning && !isCompleted;

  return (
    <div className="flex h-screen flex-col bg-[#f3f6f4]">
      {/* ─── ヘッダー ─── */}
      <header className="shrink-0 border-b border-emerald-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <BackButton label="戻る" hideLabelOnMobile />
          <JisappLogo href="/" />
          <span className="text-sm text-gray-400">/</span>
          <MessageSquare className="h-4 w-4 text-emerald-500" />
          <span className="truncate text-sm font-semibold text-gray-700">{room.title}</span>
          <div
            className={`ml-auto flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${statusCfg.color}`}
          >
            <span className={`h-2 w-2 rounded-full ${statusCfg.dot}`} />
            {room.status}
          </div>
        </div>
      </header>

      {/* ─── 48時間タイマーバナー ─── */}
      {timerActive && room.status === "動作確認待ち" && (
        <div className="shrink-0 border-b border-orange-200 bg-orange-50 px-4 py-3">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
              <div>
                <p className="text-xs font-bold text-orange-800">
                  ⚠️ 購入者が48時間以内に承認または不具合報告を行わない場合、取引は自動的に完了します
                </p>
                <p className="mt-1 font-mono text-lg font-black text-orange-700">
                  残り {formatCountdown(displayTimerSec)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDemoAccelerate}
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-orange-300 bg-white px-3 py-2 text-xs font-bold text-orange-700 hover:bg-orange-100 transition-colors"
            >
              <FastForward className="h-3.5 w-3.5" />
              48時間経過（デモ加速）
            </button>
          </div>
        </div>
      )}

      {/* ─── AI審査中バナー ─── */}
      {aiMediationRunning && (
        <div className="shrink-0 border-b border-blue-200 bg-blue-50 px-4 py-2.5">
          <div className="mx-auto flex max-w-6xl items-center gap-2 text-xs font-semibold text-blue-800">
            <Loader className="h-4 w-4 animate-spin text-blue-600" />
            Gemini AI がソースコードの緊急動作検証を実行中です...
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ─── サイドバー ─── */}
        <aside className="hidden w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r border-gray-200 bg-white p-5 lg:flex">
          <div>
            <h3 className="mb-3 text-[11px] font-black uppercase tracking-wider text-gray-400">
              取引情報
            </h3>
            <div className="space-y-2.5">
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-[11px] text-gray-400">依頼タイトル</p>
                <p className="mt-0.5 text-xs font-bold text-gray-800">{room.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Banknote className="h-3 w-3" /> 予算
                  </div>
                  <p className="mt-0.5 text-xs font-bold text-emerald-700">{room.budget}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Clock className="h-3 w-3" /> 納期
                  </div>
                  <p className="mt-0.5 text-xs font-bold text-gray-800">{room.deadline}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 取引アクション */}
          <div>
            <h3 className="mb-3 text-[11px] font-black uppercase tracking-wider text-gray-400">
              取引アクション
            </h3>
            <div className="space-y-2">
              {canDeliver && (
                <button
                  type="button"
                  onClick={handleDeliver}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                >
                  <Package className="h-4 w-4" />
                  納品する（動作確認待ちへ）
                </button>
              )}
              {canReject && senderMode === "user" && (
                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors"
                >
                  <AlertTriangle className="h-4 w-4" />
                  動かないので受取を拒否する
                </button>
              )}
              {isCompleted && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  決済が確定しました
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-[11px] font-black uppercase tracking-wider text-gray-400">
              ステータス変更
            </h3>
            <div className="space-y-1.5">
              {STATUS_ORDER.map((s) => {
                const cfg = STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStatusChange(s)}
                    disabled={aiMediationRunning}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all disabled:opacity-50 ${
                      room.status === s
                        ? `${cfg.color} ring-2 ring-offset-1 ring-emerald-300`
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                    {s}
                    {room.status === s && <CheckCircle2 className="ml-auto h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-[11px] font-black uppercase tracking-wider text-gray-400">
              参加者
            </h3>
            <div className="space-y-2">
              {[
                { name: room.clientName, role: "発注者", color: "bg-emerald-100 text-emerald-700" },
                { name: room.creatorName, role: "クリエイター", color: "bg-blue-100 text-blue-700" },
              ].map((p) => (
                <div key={p.role} className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${p.color}`}
                  >
                    {p.name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{p.name}</p>
                    <p className="text-[10px] text-gray-400">{p.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-[11px] font-black uppercase tracking-wider text-gray-400">
              送信者（デモ）
            </h3>
            <div className="flex rounded-xl bg-gray-100 p-1">
              {(["user", "creator"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSenderMode(mode)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                    senderMode === mode ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500"
                  }`}
                >
                  {mode === "user" ? "発注者" : "クリエイター"}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ─── チャットエリア ─── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b border-gray-100 bg-white px-4 py-2 lg:hidden">
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusCfg.color}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
              {room.status}
            </span>
            {canDeliver && (
              <button
                type="button"
                onClick={handleDeliver}
                className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white"
              >
                納品
              </button>
            )}
            {canReject && senderMode === "user" && (
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-600 ring-1 ring-rose-200"
              >
                受取拒否
              </button>
            )}
            <div className="ml-auto flex rounded-lg bg-gray-100 p-0.5">
              {(["user", "creator"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSenderMode(mode)}
                  className={`rounded px-2 py-1 text-[10px] font-bold transition-all ${
                    senderMode === mode ? "bg-white text-emerald-700 shadow-sm" : "text-gray-400"
                  }`}
                >
                  {mode === "user" ? "発注者" : "クリエイター"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
            {!mounted ? (
              <div className="flex items-center justify-center py-20 text-sm text-gray-400">
                <Loader className="mr-2 h-4 w-4 animate-spin" /> 読み込み中...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                  <MessageSquare className="h-7 w-7 text-emerald-500" />
                </div>
                <p className="font-bold text-gray-700">チャットを開始しましょう！</p>
              </div>
            ) : (
              messages.map((msg) => {
                if (msg.sender === "system" || msg.sender === "gemini") {
                  return (
                    <div key={msg.id} className="flex justify-center px-2">
                      <div
                        className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                          msg.sender === "gemini"
                            ? "bg-gradient-to-br from-blue-50 to-indigo-50 text-indigo-900 ring-2 ring-blue-200"
                            : "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
                        }`}
                      >
                        {msg.sender === "gemini" && (
                          <div className="mb-2 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600">
                              <Bot className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-[11px] font-black text-blue-700">
                              🤖 Gemini AIからの裁定
                            </span>
                          </div>
                        )}
                        {msg.isLoading ? (
                          <span className="flex items-center gap-2 font-semibold">
                            <Loader className="h-4 w-4 animate-spin" />
                            {msg.text}
                          </span>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        )}
                        <p className="mt-1.5 text-[10px] opacity-60">{msg.timestamp}</p>
                      </div>
                    </div>
                  );
                }

                const isUser = msg.sender === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                        isUser ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {msg.senderName[0]}
                    </div>
                    <div
                      className={`max-w-[72%] space-y-1 ${isUser ? "items-end" : "items-start"} flex flex-col`}
                    >
                      <span
                        className={`text-[10px] text-gray-400 ${isUser ? "text-right" : "text-left"}`}
                      >
                        {msg.senderName}
                      </span>
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          isUser
                            ? "rounded-tr-sm bg-emerald-600 text-white"
                            : "rounded-tl-sm bg-white text-gray-800 shadow-sm ring-1 ring-black/5"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-gray-400">{msg.timestamp}</span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3">
            <div className="flex items-end gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                  senderMode === "user" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                }`}
              >
                {(senderMode === "user" ? room.clientName : room.creatorName)[0]}
              </div>
              <div className="relative flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="メッセージを入力... (Enterで送信、Shift+Enterで改行)"
                  disabled={aiMediationRunning || isCompleted}
                  className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20 disabled:opacity-50"
                  style={{ minHeight: "44px", maxHeight: "120px" }}
                  onInput={(e) => {
                    const t = e.currentTarget;
                    t.style.height = "auto";
                    t.style.height = Math.min(t.scrollHeight, 120) + "px";
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || aiMediationRunning || isCompleted}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-gray-400">
              ※ デモ環境です。発注者モードで「受取拒否」、クリエイターで「納品」を試せます。
            </p>
          </div>
        </div>
      </div>

      {/* ─── 受取拒否モーダル ─── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowRejectModal(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-black text-gray-900">動作不良の報告</h3>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-3 text-xs text-gray-500">
              報告内容を送信すると、Gemini AI による自動検証が開始されます。
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="例：スプレッドシートの権限エラーが出て動作しません..."
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={!rejectReason.trim()}
                className="flex-[2] rounded-xl bg-rose-600 py-3 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                報告を送信する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
