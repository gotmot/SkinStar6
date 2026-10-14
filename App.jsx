import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import './App.css';

import Profile from './Profile';
import Settings from './Settings';
import SupportPage from './SupportPage';
import SellPage from './SellPage';
import AppDialog from './AppDialog';
import PrivacyPage from './PrivacyPage';
import { showConfirm, showAlert } from './dialogBus';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const role = localStorage.getItem('userRole') || 'user';

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/support" replace state={{ from: location }} />;
  }
  return children;
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [selectedGame, setSelectedGame] = useState('all');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerData, setRegisterData] = useState({
    username: '', password: '', confirmPassword: '', email: ''
  });
  const [registerError, setRegisterError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
      setUserRole(storedRole);
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
      setUserRole('user');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    if (!loginInput.trim() || !passwordInput.trim()) {
      setLoginError('Заполните все поля');
      return;
    }

    if (loginInput === 'admin' && passwordInput === 'admin123') {
      localStorage.setItem('userRole', 'admin');
      setUserRole('admin');
      setIsLoggedIn(true);
      setLoginError('');
      return;
    }

    if (loginInput === 'user' && passwordInput === 'user123') {
      localStorage.setItem('userRole', 'user');
      setUserRole('user');
      setIsLoggedIn(true);
      setLoginError('');
      return;
    }

    const stored = localStorage.getItem('registeredUsers');
    const registered = stored ? JSON.parse(stored) : [];
    const found = registered.find(
      (u) => u.username === loginInput && u.password === passwordInput
    );
    if (found) {
      localStorage.setItem('userRole', 'user');
      setUserRole('user');
      setIsLoggedIn(true);
      setLoginError('');
      return;
    }

    setLoginError('Неверный логин или пароль');
  };

  const handleLoginKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  const handleRegisterOpen = () => {
    setRegisterError('');
    setRegisterData({ username: '', password: '', confirmPassword: '', email: '' });
    setIsRegisterModalOpen(true);
  };

  const handleRegisterClose = () => setIsRegisterModalOpen(false);

  const handleRegisterInputChange = (e) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterSubmit = async () => {
    const { username, password, confirmPassword, email } = registerData;
    if (!username || !password || !confirmPassword || !email) {
      setRegisterError('Заполните все поля');
      return;
    }
    if (password !== confirmPassword) {
      setRegisterError('Пароли не совпадают');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setRegisterError('Некорректный email');
      return;
    }

    const stored = localStorage.getItem('registeredUsers');
    const registered = stored ? JSON.parse(stored) : [];
    registered.push({ id: Date.now().toString(), username, password, email });
    localStorage.setItem('registeredUsers', JSON.stringify(registered));

    setIsRegisterModalOpen(false);
    setRegisterError('');
    await showAlert('Аккаунт успешно создан! Теперь можно войти.', 'Регистрация');
  };

  const handleSendForgot = async () => {
    setShowForgotPassword(false);
    await showAlert('Инструкции отправлены на ваш email (демо)', 'Восстановление пароля');
  };

  const handleLogout = async () => {
    const ok = await showConfirm('Вы уверены, что хотите выйти из аккаунта?', 'Выход');
    if (!ok) return;
    localStorage.removeItem('userRole');
    setIsLoggedIn(false);
    setUserRole('user');
    setLoginInput('');
    setPasswordInput('');
  };

  const skinsData = {
    cs: [
      { name: 'AK-47 | Asiimov', game: 'cs', price: 2500, rarity: 'normal', image: 'ak-47-asiimov.jpg' },
      { name: 'Dragon Lore', game: 'cs', price: 85000, rarity: 'legendary', isHit: true, image: 'dragon-lore.jpg' },
      { name: 'Karambit | Fade', game: 'cs', price: 12000, rarity: 'rare', image: 'karambit-fade.jpg' },
      { name: 'Kukri Knife | Blue Steel', game: 'cs', price: 3200, rarity: 'normal', image: 'kukri-blue-steel.jpg' }
    ],
    dota: [
      { name: 'Arcana on Zeus', game: 'dota', price: 1800, rarity: 'rare', image: 'dota-zeus-arcana.jpg' },
      { name: 'Arcana on Pudge', game: 'dota', price: 2100, rarity: 'rare', image: 'dota-pudge-arcana.jpg' },
      { name: 'Techies Arcana', game: 'dota', price: 2400, rarity: 'rare', image: 'dota-techies-arcana.jpg' },
      { name: 'Spectre Arcana', game: 'dota', price: 2900, rarity: 'rare', image: 'dota-spectre-arcana.jpg' }
    ],
    rust: [
      { name: 'AK47 Rust Skin', game: 'rust', price: 450, rarity: 'normal', image: 'rust-ak47.jpg' },
      { name: 'Mask Skin', game: 'rust', price: 120, rarity: 'normal', image: 'rust-mask.jpg' },
      { name: 'Helmet Skin', game: 'rust', price: 180, rarity: 'normal', image: 'rust-helmet.jpg' },
      { name: 'Chest Plate Skin', game: 'rust', price: 210, rarity: 'normal', image: 'rust-chest.jpg' }
    ]
  };

  const getSkins = () =>
    selectedGame === 'all'
      ? [...skinsData.cs, ...skinsData.dota, ...skinsData.rust]
      : skinsData[selectedGame];

  const getGameName = (gameKey) => {
    switch (gameKey) {
      case 'cs': return 'Counter-Strike';
      case 'dota': return 'Dota 2';
      case 'rust': return 'Rust';
      default: return 'Все игры';
    }
  };

  const getSkinImageUrl = (imageName) => `/${imageName}`;

  const getRarityColor = (rarity) => {
    if (rarity === 'legendary') return '#ff0055';
    if (rarity === 'rare') return '#5d40e1';
    return '#888';
  };

  if (!isLoggedIn) {
    return (
      <Router>
        <div className="login-overlay">
          <div className="login-box">
            <div className="login-star-wrapper">
              <div className="login-star-spin"></div>
            </div>
            <h2>Вход в систему</h2>

            {loginError && <p className="error-message">{loginError}</p>}

            <input
              type="text"
              placeholder="Логин"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              onKeyDown={handleLoginKeyDown}
              autoFocus
            />
            <input
              type="password"
              placeholder="Пароль"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={handleLoginKeyDown}
            />

            <button onClick={handleLogin}>Авторизоваться</button>

            <p className="register-link">
              Нет аккаунта? <span onClick={handleRegisterOpen}>Зарегистрироваться</span>
            </p>

            <p className="forgot-password-link">
              <span onClick={() => setShowForgotPassword(true)}>Забыли пароль?</span>
            </p>

            {showForgotPassword && (
              <div className="modal-overlay">
                <div className="modal-content forgot-modal">
                  <button className="close-modal" onClick={() => setShowForgotPassword(false)}>&times;</button>
                  <h3>Восстановление пароля</h3>
                  <p className="forgot-hint">Введите email, привязанный к аккаунту — мы отправим инструкции.</p>
                  <input type="email" placeholder="Ваш email" />
                  <button onClick={handleSendForgot}>Отправить</button>
                </div>
              </div>
            )}

            {isRegisterModalOpen && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <button className="close-modal" onClick={handleRegisterClose}>&times;</button>
                  <h3>Регистрация</h3>
                  {registerError && <p className="error-message">{registerError}</p>}
                  <input name="username" type="text" placeholder="Логин" value={registerData.username} onChange={handleRegisterInputChange} />
                  <input name="email" type="email" placeholder="Email" value={registerData.email} onChange={handleRegisterInputChange} />
                  <input name="password" type="password" placeholder="Пароль" value={registerData.password} onChange={handleRegisterInputChange} />
                  <input name="confirmPassword" type="password" placeholder="Повторите пароль" value={registerData.confirmPassword} onChange={handleRegisterInputChange} />
                  <button onClick={handleRegisterSubmit}>Создать аккаунт</button>
                </div>
              </div>
            )}
          </div>
          <AppDialog />
        </div>
      </Router>
    );
  }

  return (
    <Router>
      <div className="App">
        <header>
          {userRole === 'admin' && <span className="admin-pill">🛡️ Админ</span>}
          {userRole === 'support' && <span className="support-pill">💬 Поддержка</span>}
          <h1>SkinStar</h1>
          <div className="star-container"><div className="star"></div></div>
        </header>

        <nav>
          <ul>
            {userRole !== 'admin' && (
              <li><Link to="/">Главная</Link></li>
            )}

            {!['support', 'admin'].includes(userRole) && (
              <li><Link to="/sell">Продажа</Link></li>
            )}

            <li><Link to="/profile">Профиль</Link></li>

            {/* Настройки недоступны для поддержки и админа */}
            {!['support', 'admin'].includes(userRole) && (
              <li><Link to="/settings">Настройки</Link></li>
            )}

            <li><Link to="/support">Поддержка</Link></li>
          </ul>
        </nav>

        <main className="home-content">
          <Routes>
            <Route
              path="/"
              element={
                userRole === 'admin' || userRole === 'support'
                  ? <Navigate to="/support" replace />
                  : (
                      <>
                        <section className="game-selector">
                          <h2>Выберите игру</h2>
                          <div className="games-grid">
                            {['cs', 'dota', 'rust', 'all'].map((game) => {
                              const name = game === 'cs' ? 'CS' : game === 'dota' ? 'Dota 2' : game === 'rust' ? 'Rust' : 'Все';
                              return (
                                <div
                                  key={game}
                                  className={`game-card ${selectedGame === game ? 'active' : ''}`}
                                  onClick={() => setSelectedGame(game)}
                                >
                                  <span className="game-card-title">{name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </section>

                        <section className="skins-preview">
                          <h2>{selectedGame === 'all' ? 'Популярные скины' : `Скины для ${getGameName(selectedGame)}`}</h2>
                          {isLoading ? (
                            <div className="loading-state">Загрузка...</div>
                          ) : (
                            <div className="skins-grid">
                              {getSkins().map((skin, index) => (
                                <div key={index} className="skin-card" style={{ animationDelay: `${index * 0.1}s` }}>
                                  <div className="skin-img-wrapper">
                                    <img
                                      src={getSkinImageUrl(skin.image)}
                                      alt={skin.name}
                                      className="skin-image"
                                      loading="lazy"
                                      onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                                      }}
                                    />
                                    {skin.isHit && <span className="badge-hit">Хит</span>}
                                  </div>
                                  <div className="skin-info">
                                    <h3 className="skin-name">{skin.name}</h3>
                                    <p className="skin-game">{getGameName(skin.game)}</p>
                                    <div className="rarity-marker" style={{ color: getRarityColor(skin.rarity) }}>
                                      {skin.rarity === 'legendary' ? 'Легендарный' : skin.rarity === 'rare' ? 'Редкий' : 'Обычный'}
                                    </div>
                                    <div className="skin-price-block">
                                      <span className="price-value">{skin.price.toLocaleString('ru-RU')}</span>
                                      <span className="currency-symbol">₽</span>
                                    </div>
                                    <button className="buy-button">Купить</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </section>
                      </>
                    )
              }
            />

            <Route
              path="/sell"
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <SellPage />
                </ProtectedRoute>
              }
            />

            <Route path="/profile" element={<Profile setIsLoggedIn={setIsLoggedIn} userRole={userRole} />} />

            {/* Прямой заход /settings для поддержки и админа — редирект */}
            <Route
              path="/settings"
              element={
                userRole === 'support' || userRole === 'admin'
                  ? <Navigate to="/support" replace />
                  : <Settings setIsLoggedIn={setIsLoggedIn} />
              }
            />

            <Route path="/support" element={<SupportPage setIsLoggedIn={setIsLoggedIn} userRole={userRole} />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="*" element={<div style={{ padding: '2rem', textAlign: 'center' }}>Страница не найдена</div>} />
          </Routes>

          <footer className="app-footer">
            <p>
              <Link to="/privacy" style={{
                color: 'var(--accent-color, #e0e0e0)',
                textDecoration: 'underline',
                cursor: 'pointer',
                marginRight: '1rem'
              }}>
                Политика конфиденциальности
              </Link>

              <button
                onClick={handleLogout}
                style={{
                  color: 'var(--accent-color, #e0e0e0)',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Выход
              </button>
            </p>
          </footer>
        </main>
      </div>

      <AppDialog />
    </Router>
  );
};

export default App;
