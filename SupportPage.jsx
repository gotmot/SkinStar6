import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SupportChat from './SupportChat';
import { showConfirm, showAlert } from './dialogBus';

const TEST_USERS = [
  { id: 'user1', name: 'Invoker', problem: 'Меня обманули при сделке', status: 'urgent' },
  { id: 'user2', name: 'Zeus', problem: 'Деньги не закинулись на баланс', status: 'urgent' },
  { id: 'user3', name: 'Marci', problem: 'Скин не пришёл после покупки', status: 'waiting' },
  { id: 'user4', name: 'Pudge', problem: 'Возврат средств', status: 'resolved' },
  { id: 'user5', name: 'Juggernaut', problem: 'Не работает сайт', status: 'waiting' }
];

const AVATARS = {
  user1: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80&fit=crop',
  user2: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80&fit=crop',
  user3: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80&fit=crop',
  user4: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&q=80&fit=crop',
  user5: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80&fit=crop'
};

const DURATIONS = {
  '1h': { label: '1 час', ms: 3600000 },
  '3h': { label: '3 часа', ms: 3 * 3600000 },
  '1d': { label: '1 день', ms: 86400000 },
  '3d': { label: '3 дня', ms: 3 * 86400000 },
  '7d': { label: '7 дней', ms: 7 * 86400000 },
  '30d': { label: '30 дней', ms: 30 * 86400000 }
};

const getInitialChat = (userId) => {
  const chats = {
    user1: [
      { text: 'Здравствуйте! Я бот поддержки SkinStar. Опишите вашу проблему.', sender: 'bot', timestamp: Date.now() - 600000, isSpam: false },
      { text: 'Меня обманули! Купил AK-47 у пользователя Scammer123', sender: 'user', timestamp: Date.now() - 580000, isSpam: false },
      { text: 'Вас обманули при сделке? Напишите, какой скин вы покупали.', sender: 'bot', timestamp: Date.now() - 570000, isSpam: false },
      { text: 'AK-47 Asiimov за 2500₽', sender: 'user', timestamp: Date.now() - 550000, isSpam: false },
      { text: 'Спасибо! Информация передана. Подключаю администратора для разбора ситуации.', sender: 'bot', timestamp: Date.now() - 540000, isSpam: false }
    ],
    user2: [
      { text: 'Здравствуйте! Я бот поддержки SkinStar. Опишите вашу проблему.', sender: 'bot', timestamp: Date.now() - 800000, isSpam: false },
      { text: 'Деньги не закинулись на баланс!', sender: 'user', timestamp: Date.now() - 780000, isSpam: false },
      { text: 'Проблема с пополнением требует ручной проверки. Позову администратора.', sender: 'bot', timestamp: Date.now() - 770000, isSpam: false }
    ],
    user3: [
      { text: 'Здравствуйте! Я бот поддержки SkinStar. Опишите вашу проблему.', sender: 'bot', timestamp: Date.now() - 400000, isSpam: false },
      { text: 'Скин не пришёл после покупки', sender: 'user', timestamp: Date.now() - 380000, isSpam: false },
      { text: 'Укажите название скина и номер заказа.', sender: 'bot', timestamp: Date.now() - 370000, isSpam: false },
      { text: 'Arcana on Pudge, заказ #47821', sender: 'user', timestamp: Date.now() - 350000, isSpam: false }
    ],
    user4: [
      { text: 'Здравствуйте! Я бот поддержки SkinStar. Опишите вашу проблему.', sender: 'bot', timestamp: Date.now() - 1200000, isSpam: false },
      { text: 'Хочу вернуть деньги за покупку', sender: 'user', timestamp: Date.now() - 1180000, isSpam: false },
      { text: 'Возврат обрабатывается 3 рабочих дня. Укажите номер сделки.', sender: 'bot', timestamp: Date.now() - 1170000, isSpam: false },
      { text: 'Сделка #33156, передумал покупать', sender: 'user', timestamp: Date.now() - 1150000, isSpam: false },
      { text: 'Возврат одобрен. Проблема решена.', sender: 'admin', timestamp: Date.now() - 1100000, isSpam: false }
    ],
    user5: [
      { text: 'Здравствуйте! Я бот поддержки SkinStar. Опишите вашу проблему.', sender: 'bot', timestamp: Date.now() - 300000, isSpam: false },
      { text: 'Не могу зайти в профиль, выдаёт ошибку 403', sender: 'user', timestamp: Date.now() - 280000, isSpam: false },
      { text: 'Попробуйте описать иначе (попытка 1 из 3).', sender: 'bot', timestamp: Date.now() - 270000, isSpam: false },
      { text: 'Сайт не работает, профиль не открывается', sender: 'user', timestamp: Date.now() - 250000, isSpam: false },
      { text: 'Не могу решить эту проблему. Позову администратора.', sender: 'bot', timestamp: Date.now() - 240000, isSpam: false }
    ]
  };
  return chats[userId] || [{ text: 'Нет сообщений.', sender: 'bot', timestamp: Date.now(), isSpam: false }];
};

const SupportPage = ({ setIsLoggedIn, userRole }) => {
  const navigate = useNavigate();
  const isAdmin = userRole === 'admin';

  const [userStates, setUserStates] = useState(() => {
    const stored = JSON.parse(localStorage.getItem('supportUserStates') || '{}');
    return { ...TEST_USERS.reduce((acc, u) => ({ ...acc, [u.id]: u.status }), {}), ...stored };
  });

  const [adminReply, setAdminReply] = useState('');
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [activeUserId, setActiveUserId] = useState('user1');
  const [activeChat, setActiveChat] = useState([]);
  const [showBanForm, setShowBanForm] = useState(false);
  const [userToBlock, setUserToBlock] = useState('');
  const [banDuration, setBanDuration] = useState('1h');
  const [banReason, setBanReason] = useState('');
  const [resolvedChats, setResolvedChats] = useState({});
  const [assignedTickets, setAssignedTickets] = useState(() =>
    JSON.parse(localStorage.getItem('supportAssignedTickets') || '[]')
  );

  const chatViewRef = useRef(null);
  const lastMsgCountRef = useRef(0);

  useEffect(() => {
    setBlockedUsers(JSON.parse(localStorage.getItem('blockedUsers') || '[]'));

    TEST_USERS.forEach((u) => {
      const key = `supportChat_${u.id}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(getInitialChat(u.id)));
      }
    });

    loadActiveChat('user1');
  }, []);

  useEffect(() => {
    localStorage.setItem('supportUserStates', JSON.stringify(userStates));
  }, [userStates]);

  useEffect(() => {
    localStorage.setItem('supportAssignedTickets', JSON.stringify(assignedTickets));
  }, [assignedTickets]);

  const loadActiveChat = (userId) => {
    const key = `supportChat_${userId}`;
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    setActiveChat(stored);
  };

  useEffect(() => {
    if (!isAdmin) return;
    const interval = setInterval(() => {
      loadActiveChat(activeUserId);
    }, 1000);
    return () => clearInterval(interval);
  }, [isAdmin, activeUserId]);

  // Автопрокрутка вниз — только когда появилось новое сообщение, мгновенно, без рывков
  useEffect(() => {
    if (activeChat.length > lastMsgCountRef.current) {
      const el = chatViewRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
    lastMsgCountRef.current = activeChat.length;
  }, [activeChat]);

  // Автоматический разбан: убираем тех, у кого истёк срок
  useEffect(() => {
    const cleanup = () => {
      setBlockedUsers((prev) => {
        const now = Date.now();
        const alive = prev.filter(
          (u) => u.type === 'permanent' || (u.unbanAt && u.unbanAt > now)
        );
        if (alive.length !== prev.length) {
          localStorage.setItem('blockedUsers', JSON.stringify(alive));
        }
        return alive;
      });
    };

    cleanup();
    const interval = setInterval(cleanup, 30000);
    return () => clearInterval(interval);
  }, []);

  const onAdminCalled = () => {
    localStorage.setItem('adminRequested', 'true');
  };

  const handleSelectUser = (userId) => {
    setActiveUserId(userId);
    loadActiveChat(userId);
    lastMsgCountRef.current = 0;
  };

  const sendAdminReply = () => {
    if (!adminReply.trim()) return;
    const key = `supportChat_${activeUserId}`;
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    const newMsg = { text: adminReply.trim(), sender: 'admin', timestamp: Date.now(), isSpam: false };
    const updated = [...stored, newMsg];
    localStorage.setItem(key, JSON.stringify(updated));
    setActiveChat(updated);
    setAdminReply('');
  };

  const handleAdminReply = (e) => {
    if (e.key === 'Enter' && adminReply.trim()) sendAdminReply();
  };

  const handleResolveChat = async () => {
    if (!(await showConfirm('Проблема решена? Чат будет закрыт, но история сохранится.', 'Решение'))) return;

    const key = `supportChat_${activeUserId}`;
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = stored.map((m) => ({ ...m, isResolvedChat: true }));
    localStorage.setItem(key, JSON.stringify(updated));

    setActiveChat(updated);
    setResolvedChats((prev) => ({ ...prev, [activeUserId]: true }));
    setAssignedTickets((prev) => prev.filter((id) => id !== activeUserId));
    setUserStates((prev) => ({ ...prev, [activeUserId]: 'resolved' }));
  };

  const toggleSpamMessage = (index) => {
    const key = `supportChat_${activeUserId}`;
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    const toggled = stored.map((m, i) =>
      i === index ? { ...m, isSpam: !m.isSpam } : m
    );
    localStorage.setItem(key, JSON.stringify(toggled));
    setActiveChat(toggled);
  };

  const takeTicket = () => {
    if (assignedTickets.includes(activeUserId)) {
      setAssignedTickets((prev) => prev.filter((id) => id !== activeUserId));
      setUserStates((prev) => ({
        ...prev,
        [activeUserId]: prev[activeUserId] === 'resolved' ? 'resolved' : 'waiting'
      }));
      return;
    }

    setAssignedTickets((prev) => [...prev, activeUserId]);
    setUserStates((prev) => ({ ...prev, [activeUserId]: 'assigned' }));
  };

  const formatDuration = (dur) =>
    dur === 'forever' ? 'Навсегда' : DURATIONS[dur]?.label || dur;

  const handleBlockUser = async () => {
    if (!userToBlock.trim()) {
      await showAlert('Введите ник пользователя', 'Ошибка', 'error');
      return;
    }
    if (!banReason.trim()) {
      await showAlert('Укажите причину блокировки', 'Ошибка', 'error');
      return;
    }

    const userExists = TEST_USERS.some(
      (u) => u.name.toLowerCase() === userToBlock.trim().toLowerCase()
    );
    if (!userExists) {
      await showAlert(
        `Пользователь «${userToBlock.trim()}» не найден. Проверьте ник и попробуйте снова.`,
        'Пользователь не найден',
        'error'
      );
      return;
    }

    const alreadyBlocked = blockedUsers.some(
      (u) => u.username.toLowerCase() === userToBlock.trim().toLowerCase()
    );
    if (alreadyBlocked) {
      await showAlert('Этот пользователь уже заблокирован', 'Ошибка', 'error');
      return;
    }

    const isPermanent = banDuration === 'forever';
    const newBlock = {
      username: userToBlock.trim(),
      type: isPermanent ? 'permanent' : 'temp',
      duration: formatDuration(banDuration),
      unbanAt: isPermanent ? null : Date.now() + (DURATIONS[banDuration]?.ms || 3600000),
      reason: banReason.trim(),
      date: new Date().toLocaleString('ru-RU')
    };

    const updated = [...blockedUsers, newBlock];
    setBlockedUsers(updated);
    localStorage.setItem('blockedUsers', JSON.stringify(updated));

    setShowBanForm(false);
    setUserToBlock('');
    setBanReason('');
    setBanDuration('1h');
    await showAlert(
      `Пользователь «${newBlock.username}» заблокирован на ${newBlock.duration}`,
      'Готово',
      'success'
    );
  };

  const handleUnblockUser = async (index) => {
    if (!(await showConfirm(`Разблокировать «${blockedUsers[index].username}»?`, 'Разблокировка'))) return;
    const updated = blockedUsers.filter((_, i) => i !== index);
    setBlockedUsers(updated);
    localStorage.setItem('blockedUsers', JSON.stringify(updated));
  };

  const handleGoToProfile = (username) => {
    navigate(`/profile?user=${encodeURIComponent(username)}`);
  };

  const getStatusBadge = (status, isAssigned, isResolved) => {
    if (isResolved || status === 'resolved') return { text: 'Решён', cls: 'status-resolved' };
    if (isAssigned) return { text: 'В работе', cls: 'status-assigned' };
    if (status === 'urgent') return { text: 'Срочно', cls: 'status-urgent' };
    return { text: 'Ожидает', cls: 'status-waiting' };
  };

  const sortedUsers = [...TEST_USERS].sort((a, b) => {
    const aAssigned = assignedTickets.includes(a.id);
    const bAssigned = assignedTickets.includes(b.id);

    const aResolved = resolvedChats[a.id] || userStates[a.id] === 'resolved';
    const bResolved = resolvedChats[b.id] || userStates[b.id] === 'resolved';

    if (aResolved && !bResolved) return 1;
    if (!aResolved && bResolved) return -1;

    if (aAssigned && !bAssigned) return -1;
    if (!aAssigned && bAssigned) return 1;

    const aUrgent = userStates[a.id] === 'urgent';
    const bUrgent = userStates[b.id] === 'urgent';
    if (aUrgent && !bUrgent) return -1;
    if (!aUrgent && bUrgent) return 1;

    return 0;
  });

  const activeUser = TEST_USERS.find((u) => u.id === activeUserId);
  const isChatResolved = resolvedChats[activeUserId] || userStates[activeUserId] === 'resolved';
  const isTicketAssigned = assignedTickets.includes(activeUserId);

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  if (!isAdmin) {
    return (
      <div className="support-page">
        <h2 className="section-title">Поддержка</h2>
        <SupportChat onAdminCalled={onAdminCalled} />
      </div>
    );
  }

  return (
    <div className="support-admin-page">
      <div className="admin-header">
        <h2 className="section-title">Панель поддержки</h2>
        <span className="admin-badge">🛡️ Режим администратора</span>
      </div>

      <div className="admin-dashboard">
        <section className="admin-card admin-chat-section">
          <div className="admin-card-header">
            <h3>💬 Чат с {activeUser?.name}</h3>
            <div className="chat-header-actions">
              <span
                className={`chat-status ${
                  getStatusBadge(userStates[activeUser?.id], isTicketAssigned, isChatResolved).cls
                }`}
              >
                {getStatusBadge(userStates[activeUser?.id], isTicketAssigned, isChatResolved).text}
              </span>
              {!isChatResolved && (
                <button className="btn-primary btn-sm" onClick={takeTicket}>
                  {isTicketAssigned ? 'Снять тикет' : 'Взять тикет'}
                </button>
              )}
              {activeChat.length > 0 && !isChatResolved && (
                <button className="btn-danger btn-sm" onClick={handleResolveChat}>
                  ✓ Решить
                </button>
              )}
            </div>
          </div>

          <div className="admin-chat-view" ref={chatViewRef}>
            {activeChat.length === 0 ? (
              <p className="storage-info">
                {isChatResolved ? 'Обращение закрыто. Чат удалён.' : 'Нет сообщений.'}
              </p>
            ) : (
              activeChat.map((m, i) => {
                if (m.isSpam && !isChatResolved) {
                  return (
                    <div key={i} className="tg-msg spam-message">
                      <div className="spam-indicator">⚠️ Спам</div>
                      <button
                        className="btn-link-sm"
                        onClick={() => toggleSpamMessage(i)}
                        style={{ marginLeft: 8 }}
                      >
                        Показать
                      </button>
                    </div>
                  );
                }

                const prevMsg = activeChat[i - 1];
                const showAvatar = !prevMsg || prevMsg.sender !== m.sender;
                const avatarUrl = AVATARS[activeUserId];
                const side = m.sender === 'admin' ? 'msg-right' : 'msg-left';

                return (
                  <div key={i} className={`tg-msg ${m.sender} ${side} ${showAvatar ? 'with-avatar' : 'no-avatar'}`}>
                    {showAvatar ? (
                      <div className="tg-avatar">
                        {m.sender === 'admin' ? (
                          <span className="tg-avatar-icon">🛡️</span>
                        ) : m.sender === 'bot' ? (
                          <span className="tg-avatar-icon">🤖</span>
                        ) : (
                          <img src={avatarUrl} alt="" className="tg-avatar-img" />
                        )}
                      </div>
                    ) : (
                      <div className="tg-avatar-spacer"></div>
                    )}

                    <div className="tg-content">
                      {showAvatar && (
                        <div className="tg-nickname">
                          {m.sender === 'admin'
                            ? 'Поддержка'
                            : m.sender === 'bot'
                              ? 'Бот поддержки'
                              : activeUser?.name}
                        </div>
                      )}
                      <div className={`tg-bubble ${m.isSpam ? 'spam-bubble' : ''}`}>
                        <span className="tg-text">
                          {m.isSpam ? '⚠️ [Спам] ' : ''}
                          {m.text}
                        </span>
                        <span className="tg-time">{formatTime(m.timestamp)}</span>
                      </div>
                    </div>

                    {!isChatResolved && m.sender !== 'bot' && m.sender !== 'admin' && (
                      <button
                        className="btn-link-sm spam-toggle-btn"
                        onClick={() => toggleSpamMessage(i)}
                        title={m.isSpam ? 'Снять пометку спама' : 'Пометить как спам'}
                      >
                        {m.isSpam ? 'Не спам' : '🚩 Спам'}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {activeChat.length > 0 && !isChatResolved && (
            <div className="chat-input-area">
              <input
                type="text"
                value={adminReply}
                onChange={(e) => setAdminReply(e.target.value)}
                onKeyDown={handleAdminReply}
                placeholder={`Ответить ${activeUser?.name} (Enter)...`}
              />
              <button className="btn-primary" onClick={sendAdminReply}>
                Ответить
              </button>
            </div>
          )}
        </section>

        <aside className="admin-sidebar">
          <h3 className="sidebar-title">Обращения ({TEST_USERS.length})</h3>
          {sortedUsers.map((u) => {
            const isResolved = resolvedChats[u.id] || userStates[u.id] === 'resolved';
            const isAssigned = assignedTickets.includes(u.id);
            const badge = getStatusBadge(userStates[u.id], isAssigned, isResolved);
            return (
              <div
                key={u.id}
                className={`user-ticket ${activeUserId === u.id ? 'active' : ''} ${
                  isResolved ? 'resolved' : ''
                } ${isAssigned ? 'assigned' : ''}`}
                onClick={() => handleSelectUser(u.id)}
              >
                <div className="ticket-top">
                  <span className="ticket-name">{u.name}</span>
                  <span className={`ticket-status ${badge.cls}`}>{badge.text}</span>
                </div>
                <div className="ticket-problem">{u.problem}</div>
                <div className="ticket-actions">
                  <button
                    className="link-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGoToProfile(u.name);
                    }}
                  >
                    Профиль →
                  </button>
                  <button
                    className="link-btn link-btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserToBlock(u.name);
                      setShowBanForm(true);
                    }}
                  >
                    Заблокировать
                  </button>
                </div>
              </div>
            );
          })}
        </aside>
      </div>

      <section className="admin-card">
        <div className="admin-card-header">
          <h3>🔒 Управление пользователями</h3>
          <button className="btn-primary btn-sm" onClick={() => setShowBanForm(!showBanForm)}>
            {showBanForm ? 'Скрыть форму' : 'Заблокировать'}
          </button>
        </div>

        {showBanForm && (
          <div className="ban-form">
            <div className="ban-form-row">
              <label className="ban-label">Ник пользователя</label>
              <input
                type="text"
                placeholder="Например: Invoker"
                value={userToBlock}
                onChange={(e) => setUserToBlock(e.target.value)}
                className="ban-input"
              />
            </div>
            <div className="ban-form-row">
              <label className="ban-label">Срок блокировки</label>
              <div className="ban-duration-grid">
                {[
                  { value: '1h', label: '1 час' },
                  { value: '3h', label: '3 часа' },
                  { value: '1d', label: '1 день' },
                  { value: '3d', label: '3 дня' },
                  { value: '7d', label: '7 дней' },
                  { value: '30d', label: '30 дней' },
                  { value: 'forever', label: 'Навсегда' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    className={`ban-duration-btn ${banDuration === opt.value ? 'active' : ''} ${
                      opt.value === 'forever' ? 'danger' : ''
                    }`}
                    onClick={() => setBanDuration(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="ban-form-row">
              <label className="ban-label">Причина блокировки</label>
              <textarea
                placeholder="Например: мошенничество, спам, нарушение правил..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="ban-input ban-textarea"
                rows={3}
              />
            </div>
            <div className="ban-form-actions">
              <button
                className={`btn-block-confirm ${banDuration === 'forever' ? 'permanent' : ''}`}
                onClick={handleBlockUser}
              >
                {banDuration === 'forever'
                  ? 'Заблокировать навсегда'
                  : `Заблокировать на ${formatDuration(banDuration)}`}
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowBanForm(false);
                  setUserToBlock('');
                  setBanReason('');
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {blockedUsers.length > 0 && (
          <div className="blocked-list">
            <h4 className="blocked-list-title">Заблокированные ({blockedUsers.length})</h4>
            {blockedUsers.map((u, i) => (
              <div key={i} className="blocked-user-card">
                <div className="blocked-user-main">
                  <span className="blocked-user-name">{u.username}</span>
                  <span className={`blocked-type-badge ${u.type === 'permanent' ? 'perm' : 'temp'}`}>
                    {u.type === 'permanent'
                      ? 'Навсегда'
                      : `До ${new Date(u.unbanAt).toLocaleString('ru-RU')}`}
                  </span>
                </div>
                <div className="blocked-user-details">
                  <span className="blocked-detail">
                    Срок: <strong>{u.duration}</strong>
                  </span>
                  <span className="blocked-detail">
                    Причина: <strong>{u.reason}</strong>
                  </span>
                  <span className="blocked-detail">Заблокирован: {u.date}</span>
                </div>
                <div className="blocked-user-actions">
                  <button className="link-btn" onClick={() => handleGoToProfile(u.username)}>
                    Профиль →
                  </button>
                  <button className="link-btn link-btn-danger" onClick={() => handleUnblockUser(i)}>
                    Разблокировать
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {blockedUsers.length === 0 && !showBanForm && (
          <p className="storage-info">Список заблокированных пуст.</p>
        )}
      </section>
    </div>
  );
};

export default SupportPage;
