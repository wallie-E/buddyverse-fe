/** 大陆 11 位手机号，或 6–20 位微信号（字母、数字、下划线、减号，允许数字开头） */
export function isValidWechatIdOrPhone(s: string): boolean {
  if (/^1[3-9]\d{9}$/.test(s)) return true;
  return /^[a-zA-Z0-9_-]{6,20}$/.test(s);
}

export const WECHAT_OR_PHONE_FORMAT_ERROR =
  '格式不正确：可为大陆 11 位手机号，或 6–20 位微信号（字母、数字、下划线、减号，可数字开头）';

/** QQ 号：5–11 位数字（与常见后端校验一致，可按需收紧） */
export function isValidQqId(s: string): boolean {
  return /^\d{5,11}$/.test(s);
}

export const QQ_ID_FORMAT_ERROR = 'QQ 号格式不正确：应为 5–11 位数字';
