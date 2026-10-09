declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

export const getTelegramWebApp = () => {
  return typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
};

export const isInsideTelegram = (): boolean => {
  const tg = getTelegramWebApp();
  return Boolean(tg && tg.initData && tg.initData.length > 0);
};

export const initTelegramApp = () => {
  const tg = getTelegramWebApp();
  if (tg) {
    try {
      tg.ready();
      tg.expand();
      if (typeof tg.enableClosingConfirmation === 'function') {
        tg.enableClosingConfirmation();
      }
      // Apply theme colors if available
      if (tg.themeParams?.bg_color) {
        document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color);
      }
      if (tg.themeParams?.text_color) {
        document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color);
      }
    } catch (e) {
      console.warn('Telegram WebApp init error', e);
    }
  }
};

export const getTelegramInitData = (): string => {
  const tg = getTelegramWebApp();
  return tg?.initData || '';
};

export const getTelegramUser = () => {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user || null;
};

// Haptic feedback triggers
export const hapticImpact = (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
  const tg = getTelegramWebApp();
  if (tg?.HapticFeedback?.impactOccurred) {
    try {
      tg.HapticFeedback.impactOccurred(style);
    } catch (e) {}
  } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(style === 'heavy' ? 40 : 20);
  }
};

export const hapticNotification = (type: 'error' | 'success' | 'warning') => {
  const tg = getTelegramWebApp();
  if (tg?.HapticFeedback?.notificationOccurred) {
    try {
      tg.HapticFeedback.notificationOccurred(type);
    } catch (e) {}
  } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(type === 'error' ? [50, 50, 50] : [30, 40]);
  }
};

export const hapticSelection = () => {
  const tg = getTelegramWebApp();
  if (tg?.HapticFeedback?.selectionChanged) {
    try {
      tg.HapticFeedback.selectionChanged();
    } catch (e) {}
  }
};

/**
 * Web Audio API synthesizer for instant pleasant alert sound on new orders
 * Works everywhere without requiring external mp3 download or CORS issues!
 */
export const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // First tone (E5 ~ 659.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second tone (A5 ~ 880Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.2, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (err) {
    console.warn('Audio playback not permitted or failed', err);
  }
};
