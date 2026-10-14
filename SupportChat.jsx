import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

const SupportChat = ({ onAdminCalled }) => {
  const [messages, setMessages] = useState([
    { text: 'Здравствуйте! Я бот поддержки SkinStar. Опишите вашу проблему.', sender: 'bot', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [waitingForAdmin, setWaitingForAdmin] = useState(false);
  const [botStage, setBotStage] = useState(null);
  const [lastSeen, setLastSeen] = useState('Сейчас');
  const [isSending, setIsSending] = useState(false);
  const messagesAreaRef = useRef(null);

  const CHAT_KEY = 'supportChatMessages';
  const BLOCKED_KEY = 'supportBlockedUsers';
  const RETENTION_MAP = { never: Infinity, '24h': 86400000, '7d': 604800000 };

  const filterMessages = (rawMsgs, blocked, retentionKey) => {
    if (!Array.isArray(rawMsgs)) return [];
    const maxAge = RETENTION_MAP[retentionKey] || Infinity;
    const now = Date.now();
    return rawMsgs.filter((msg) => {
      const isOld = (now - msg.timestamp) >= maxAge;
      const isBlocked = blocked.includes(msg.sender);
      return !isOld && !isBlocked;
    });
  };

  useEffect(() => {
    try {
      const rawStr = localStorage.getItem(CHAT_KEY) || '[]';
      const raw = JSON.parse(rawStr);
      const blockedStr = localStorage.getItem(BLOCKED_KEY) || '[]';
      const blocked = JSON.parse(blockedStr);
      const retentionKey = localStorage.getItem('messageRetention') || 'never';
      const filtered = filterMessages(raw, blocked, retentionKey);

      if (filtered.length > 0) {
        setMessages(filtered);
      }
    } catch (e) {
      console.error('Ошибка загрузки чата:', e);
    }
  }, []);

  useEffect(() => {
    const now = Date.now().toString();
    localStorage.setItem('lastSeen', now);
    setLastSeen('Сейчас');
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const stored = parseInt(localStorage.getItem('lastSeen') || '0');
      if (!stored) return;
      const diff = Date.now() - stored;
      if (diff < 60000) setLastSeen('Сейчас');
      else if (diff < 3600000) setLastSeen(`Был(а) ${Math.floor(diff / 60000)} мин назад`);
      else setLastSeen(`Был(а) ${Math.floor(diff / 3600000)} ч назад`);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error('Ошибка сохранения чата:', e);
    }
  }, [messages]);

  useEffect(() => {
    let interval;
    if (waitingForAdmin) {
      interval = setInterval(() => {
        try {
          const rawStr = localStorage.getItem(CHAT_KEY) || '[]';
          const raw = JSON.parse(rawStr);
          const blockedStr = localStorage.getItem(BLOCKED_KEY) || '[]';
          const blocked = JSON.parse(blockedStr);
          const retentionKey = localStorage.getItem('messageRetention') || 'never';
          const filtered = filterMessages(raw, blocked, retentionKey);

          const hasAdminReply = filtered.some(
            m => m.sender === 'admin' && m.timestamp > Date.now() - 5000
          );

          if (hasAdminReply) {
            setMessages(filtered);
            setWaitingForAdmin(false);
            setAttempts(0);
          }
        } catch (e) {
          console.error('Ошибка при поллинге чата:', e);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [waitingForAdmin]);

  // Плавная прокрутка ТОЛЬКО внутри контейнера сообщений (не всей страницы)
  useEffect(() => {
    const el = messagesAreaRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const handleSend = useCallback(() => {
    if (!input.trim() || waitingForAdmin || isSending) return;

    setIsSending(true);
    const userText = input.trim();
    const userMsg = { text: userText, sender: 'user', timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    const lower = userText.toLowerCase();
    let botReply = '';
    let callAdmin = false;

    if (botStage === 'scam_details') {
      botReply = 'Спасибо! Информация передана. Подключаю администратора для разбора ситуации.';
      setBotStage(null);
      callAdmin = true;
    } else if (lower.includes('деньги') && (lower.includes('не закину') || lower.includes('не пришли') || lower.includes('не зачисл') || lower.includes('не поступ'))) {
      botReply = 'Проблема с пополнением баланса требует ручной проверки. Сейчас позову администратора, подождите пару минут.';
      callAdmin = true;
    } else if (lower.includes('обман') || lower.includes('кинули') || lower.includes('кинул') || lower.includes('развод') || lower.includes('мошенник')) {
      botReply = 'Напишите, какой скин вы покупали и у какого пользователя — это нужно для разбора.';
      setBotStage('scam_details');
    } else if (lower.includes('привет') || lower.includes('здравств')) {
      botReply = 'Здравствуйте! Опишите проблему: сделка, пополнение баланса, скин не пришёл или что-то другое?';
    } else if (lower.includes('возврат') || lower.includes('вернуть') || lower.includes('деньги назад')) {
      botReply = 'Возврат средств обрабатывается в течение 3 рабочих дней. Укажите номер сделки и причину возврата.';
    } else if (lower.includes('скин') && (lower.includes('не пришёл') || lower.includes('не получил') || lower.includes('не пришло') || lower.includes('не пришел'))) {
      botReply = 'Скин не пришёл после покупки? Укажите название скина и номер заказа — я передам информацию администратору.';
    } else if (lower.includes('блок') || lower.includes('заблок')) {
      botReply = 'Вопросы блокировки решает только администратор. Опишите ситуацию, и я передам запрос.';
    } else if (lower.includes('премиум') || lower.includes('premium')) {
      botReply = 'Premium даёт анимированный фон, рамку аватара и анимированные карточки товаров. Купить можно в разделе «Профиль».';
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        botReply = 'К сожалению, я не могу решить эту проблему. Сейчас позову администратора — подождите пару минут.';
        callAdmin = true;
      } else {
        botReply = `Я не совсем понял. Попробуйте описать иначе — например: «скин не пришёл», «деньги не закинулись», «меня обманули» (попытка ${newAttempts} из 3).`;
      }
    }

    if (callAdmin) {
      setWaitingForAdmin(true);
      if (onAdminCalled) onAdminCalled();
    }

    const botMsg = { text: botReply, sender: 'bot', timestamp: Date.now() };
    setTimeout(() => {
      setMessages((prev) => [...prev, botMsg]);
      setIsSending(false);
    }, 700);
  }, [input, waitingForAdmin, isSending, botStage, attempts, onAdminCalled]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-container-base">
      <div className="chat-header-info">
        <span
          className="status-dot"
          style={{ background: waitingForAdmin ? '#ff9800' : '#4caf50' }}
        ></span>
        Поддержка SkinStar — {lastSeen}
      </div>

      <div className="chat-messages-area" ref={messagesAreaRef}>
        {messages.map((m, i) => {
          const prevMsg = messages[i - 1];
          // Аватар показываем только у пользователя; бот/админ/система — без аватара
          const isUser = m.sender === 'user';
          const showAvatar = isUser && (!prevMsg || prevMsg.sender !== m.sender);
          return (
            <div
              key={i}
              className={`tg-msg ${m.sender} ${showAvatar ? 'with-avatar' : 'no-avatar'}`}
            >
              {showAvatar && (
                <div className="tg-avatar">
                  <span className="tg-avatar-icon">👤</span>
                </div>
              )}
              <div className="tg-content">
                {showAvatar && <div className="tg-nickname">Вы</div>}
                <div className="tg-bubble">
                  <span className="tg-text">{m.text}</span>
                  <span className="tg-time">{formatTime(m.timestamp)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {waitingForAdmin && (
        <div className="waiting-admin-msg">⏳ Ожидание администратора...</div>
      )}

      <div className="chat-input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            waitingForAdmin
              ? 'Ожидание администратора...'
              : 'Напишите сообщение и нажмите Enter...'
          }
          disabled={waitingForAdmin || isSending}
        />
        <button onClick={handleSend} disabled={waitingForAdmin || isSending}>
          {isSending ? 'Печатает...' : 'Отправить'}
        </button>
      </div>
    </div>
  );
};

export default SupportChat;
