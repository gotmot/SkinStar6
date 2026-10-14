import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showAlert, showConfirm, showPrompt } from './dialogBus';

const SupportLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (username === 'admin' && password === 'skin2024') {
      localStorage.setItem('supportRole', 'admin');
      navigate('/support');
    } else {
      setError('Неверный логин или пароль');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="login-overlay">
      <div className="login-box">
        <h2>Вход для поддержки</h2>
        {error && <p className="error-message">{error}</p>}
        <input
          type="text"
          placeholder="Логин поддержки"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={handleLogin}>Войти в панель</button>
      </div>
    </div>
  );
};

export default SupportLogin;
