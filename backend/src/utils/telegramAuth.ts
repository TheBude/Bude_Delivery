import crypto from 'crypto';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface ValidatedInitData {
  user: TelegramUser;
  auth_date: number;
  query_id?: string;
}

/**
 * Validates Telegram WebApp initData string using HMAC-SHA256.
 * Reference: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateTelegramInitData(
  initDataRaw: string,
  botToken: string
): { isValid: boolean; data?: ValidatedInitData; error?: string } {
  try {
    if (!initDataRaw) {
      return { isValid: false, error: 'InitData is empty' };
    }

    const urlParams = new URLSearchParams(initDataRaw);
    const hash = urlParams.get('hash');

    if (!hash) {
      return { isValid: false, error: 'Missing hash in initData' };
    }

    // Collect and sort all parameters except hash
    const params: string[] = [];
    urlParams.forEach((val, key) => {
      if (key !== 'hash') {
        params.push(`${key}=${val}`);
      }
    });
    params.sort();
    const dataCheckString = params.join('\n');

    // secret_key = HMAC_SHA256("WebAppData", botToken)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // calculated_hash = HMAC_SHA256(secretKey, dataCheckString)
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      return { isValid: false, error: 'Hash verification failed' };
    }

    // Parse user object
    const userJson = urlParams.get('user');
    const authDateStr = urlParams.get('auth_date');

    if (!userJson || !authDateStr) {
      return { isValid: false, error: 'Missing user or auth_date' };
    }

    const user: TelegramUser = JSON.parse(userJson);
    const authDate = parseInt(authDateStr, 10);

    return {
      isValid: true,
      data: {
        user,
        auth_date: authDate,
        query_id: urlParams.get('query_id') || undefined,
      },
    };
  } catch (err: any) {
    return { isValid: false, error: err.message || 'Validation error' };
  }
}
