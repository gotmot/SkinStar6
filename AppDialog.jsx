import React, { useEffect, useState } from 'react';
import { subscribe } from './dialogBus';

const AppDialog = () => {
  const [dialog, setDialog] = useState(null); // { type, title, message, placeholder, resolve }
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const unsubscribe = subscribe((payload) => {
      setInputValue('');
      setDialog(payload);
    });
    return unsubscribe;
  }, []);

  if (!dialog) return null;

  const close = (result) => {
    dialog.resolve(result);
    setDialog(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') close(dialog.type === 'prompt' ? inputValue : true);
    if (e.key === 'Escape') close(false);
  };

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && close(false)}>
      <div className="modal-content dialog-content" onKeyDown={handleKeyDown}>
        <button className="close-modal" onClick={() => close(false)}>&times;</button>
        <h3>{dialog.title}</h3>
        <p>{dialog.message}</p>

        {dialog.type === 'prompt' && (
          <input
            type="text"
            autoFocus
            placeholder={dialog.placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="dialog-input"
          />
        )}

        <div className="dialog-buttons">
          {dialog.type === 'alert' ? (
            <button className="dialog-btn dialog-btn-ok" onClick={() => close(true)}>
              ОК
            </button>
          ) : dialog.type === 'confirm' ? (
            <>
              <button className="dialog-btn dialog-btn-cancel" onClick={() => close(false)}>
                Отмена
              </button>
              <button className="dialog-btn dialog-btn-ok" onClick={() => close(true)}>
                Да
              </button>
            </>
          ) : (
            <>
              <button className="dialog-btn dialog-btn-cancel" onClick={() => close(false)}>
                Отмена
              </button>
              <button className="dialog-btn dialog-btn-ok" onClick={() => close(inputValue)}>
                Отправить
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppDialog;
