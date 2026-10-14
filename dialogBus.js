const listeners = new Set();

const emit = (payload) => {
  return new Promise((resolve) => {
    listeners.forEach((fn) => fn({ ...payload, resolve }));
  });
};

export const showAlert = (message, title = 'Информация') =>
  emit({ type: 'alert', title, message });

export const showConfirm = (message, title = 'Подтверждение') =>
  emit({ type: 'confirm', title, message });

export const showPrompt = (message, placeholder = '', title = 'Ввод') =>
  emit({ type: 'prompt', title, message, placeholder });

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
