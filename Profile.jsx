import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { showAlert, showConfirm } from './dialogBus';

const Profile = ({ setIsLoggedIn, userRole = 'user' }) => {
  const isAdminAccount = userRole === 'admin' || userRole === 'support';

  const [searchParams] = useSearchParams();
  const viewedUser = searchParams.get('user');

  const [user, setUser] = useState({
    username: isAdminAccount ? 'SupportAccount' : (viewedUser || 'PlayerOne'),
    avatar: isAdminAccount
      ? '/Boss.png'
      : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80&fit=crop&auto=format',
    bgImage: isAdminAccount
      ? 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1920&q=80&fit=crop&auto=format'
      : 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80&fit=crop&auto=format',
    description: isAdminAccount
      ? 'Это аккаунт поддержки созданный для помощи пользователям'
      : 'Люблю скины и коллекционировать редкие предметы.',
    isPremium: false
  });

  const [banInfo, setBanInfo] = useState(null);

  useEffect(() => {
    const checkBan = () => {
      const blocked = JSON.parse(localStorage.getItem('blockedUsers') || '[]');
      const nameToCheck = viewedUser || user.username;
      const found = blocked.find(
        (u) => u.username.toLowerCase() === nameToCheck.toLowerCase()
      );
      setBanInfo(found || null);
    };

    if (!isAdminAccount && viewedUser) {
      setUser((prev) => ({ ...prev, username: viewedUser }));
    }
    checkBan();
  }, [viewedUser]);

  const [isEditing, setIsEditing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [bgFile, setBgFile] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  const [formData, setFormData] = useState({
    username: user.username,
    description: user.description,
    bgImage: user.bgImage,
    avatar: user.avatar
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      username: user.username,
      description: user.description,
      bgImage: user.bgImage,
      avatar: user.avatar
    }));
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (img) => {
      if (field === 'bgImage') setBgFile(img.target.result);
      if (field === 'avatar') setAvatarFile(img.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => setIsConfirming(true);

  const handleSave = async () => {
    setUser((prev) => ({
      ...prev,
      username: formData.username,
      description: formData.description,
      bgImage: formData.bgImage,
      avatar: formData.avatar
    }));
    setIsEditing(false);
    setIsConfirming(false);
    await showAlert('Профиль успешно обновлён!', 'Готово');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsConfirming(false);
    setFormData({
      username: user.username,
      description: user.description,
      bgImage: user.bgImage,
      avatar: user.avatar
    });
    setBgFile(null);
    setAvatarFile(null);
  };

  const handleBuyPremium = async () => {
    setUser((prev) => ({ ...prev, isPremium: true }));
    await showAlert('Премиум куплен! Доступны анимированные эффекты.', 'Premium');
  };

  // Выход из аккаунта для админа
  const handleAdminLogout = async () => {
    const ok = await showConfirm('Выйти с аккаунта администратора?', 'Выход');
    if (!ok) return;
    localStorage.removeItem('userRole');
    setIsLoggedIn(false);
  };

  const currentBg = bgFile || user.bgImage;
  const currentAvatar = avatarFile || user.avatar;

  // Текст и класс плашки статуса
  const statusText = isAdminAccount
    ? 'Админ аккаунт'
    : user.isPremium
      ? 'Premium аккаунт'
      : 'Базовый аккаунт';
  const statusClass = isAdminAccount ? 'admin' : user.isPremium ? 'premium' : 'basic';

  return (
    <div className="profile-page">
      {viewedUser && !isAdminAccount && (
        <div className="viewed-user-banner">
          <span>Просмотр профиля пользователя: <strong>{viewedUser}</strong></span>
        </div>
      )}

      {banInfo && (
        <div className={`ban-banner ${banInfo.type === 'permanent' ? 'ban-perm' : 'ban-temp'}`}>
          <div className="ban-banner-icon">🔒</div>
          <div className="ban-banner-content">
            <h3 className="ban-banner-title">
              {banInfo.type === 'permanent'
                ? 'Аккаунт заблокирован навсегда'
                : `Аккаунт заблокирован до ${banInfo.banUntil}`}
            </h3>
            <p className="ban-banner-reason">Причина: {banInfo.reason}</p>
            <p className="ban-banner-date">Дата блокировки: {banInfo.date}</p>
          </div>
        </div>
      )}

      <div
        className={`profile-background ${isAdminAccount ? 'profile-background--admin' : ''}`}
        style={{ backgroundImage: `url(${currentBg})` }}
      ></div>

      <div className="profile-container">
        <button className="back-btn" onClick={() => window.history.back()}>← Назад</button>

        <div className={`profile-card ${isAdminAccount ? 'profile-card--admin' : ''}`}>
          <div className="profile-header">
            <div className="avatar-wrapper">
              <img
                src={currentAvatar}
                alt="Avatar"
                className={`avatar ${user.isPremium ? 'avatar--premium' : ''}`}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/200?text=Boss';
                }}
              />
              {user.isPremium && <div className="star-badge"></div>}
              {isEditing && !isAdminAccount && (
                <label className="upload-label">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'avatar')}
                    style={{ display: 'none' }}
                    id="avatarInput"
                  />
                  <span>Сменить</span>
                </label>
              )}
            </div>

            <div className="profile-info">
              {isAdminAccount && <div className="admin-ribbon">Админ</div>}
              <h1 className="profile-username">{user.username}</h1>

              {!isEditing || isAdminAccount ? (
                <p className="profile-description">{user.description}</p>
              ) : (
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  className="profile-input description-input"
                  placeholder="Описание профиля"
                />
              )}

              <div className="status-badge">
                <span className={`status-dot ${statusClass}`}></span>
                <span className="status-text">{statusText}</span>
              </div>
            </div>
          </div>

          {!isAdminAccount && (
            <div className="profile-actions">
              {!isEditing ? (
                <button className="btn-edit" onClick={() => setIsEditing(true)}>
                  Редактировать профиль
                </button>
              ) : (
                <div className="edit-controls">
                  <button className="btn-cancel" onClick={handleCancel}>Отмена</button>
                  <button className="btn-confirm" onClick={handleConfirm}>Подтвердить изменения</button>
                </div>
              )}
              {!user.isPremium && (
                <button className="btn-premium" onClick={handleBuyPremium}>Купить Premium</button>
              )}
            </div>
          )}

          {isConfirming && !isAdminAccount && (
            <div className="confirm-modal">
              <p>Вы уверены, что хотите сохранить изменения?</p>
              <div className="confirm-buttons">
                <button className="btn-cancel" onClick={handleCancel}>Отмена</button>
                <button className="btn-save" onClick={handleSave}>Сохранить</button>
              </div>
            </div>
          )}

          {isEditing && !isConfirming && !isAdminAccount && (
            <div className="profile-form">
              <div className="field-group">
                <label>Никнейм</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="profile-input"
                />
              </div>
              <div className="field-group">
                <label>Фон профиля (URL или файл)</label>
                <input
                  type="url"
                  name="bgImage"
                  placeholder="https://..."
                  value={formData.bgImage}
                  onChange={handleChange}
                  className="profile-input"
                />
                <label className="upload-label small">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'bgImage')}
                    style={{ display: 'none' }}
                    id="bgInput"
                  />
                  <span>Или загрузить файл</span>
                </label>
              </div>
            </div>
          )}

          {!isAdminAccount && (
            <div className="premium-features">
              <h3>Премиум-возможности</h3>
              <ul>
                <li>Анимированный фон профиля</li>
                <li>Анимированная рамка аватара</li>
                <li>Создание анимированных карточек товаров</li>
              </ul>
            </div>
          )}

          {/* Выход из аккаунта для админа — длинная кнопка снизу */}
          {isAdminAccount && (
            <div className="admin-logout-wrapper">
              <button className="admin-logout-btn" onClick={handleAdminLogout}>
                Выйти с аккаунта
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
