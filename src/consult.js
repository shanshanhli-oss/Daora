/**
 * A local interest note for talking with a practitioner.
 * Nothing here opens a network request, invents a confirmed booking,
 * or asks for a contact address.
 */
export const CONSULT_STATUS = '尚未发送 / 尚未预约';

export function consultDraft(input = {}) {
  const system = input.system === 'ziwei' ? 'ziwei' : 'bazi';
  const language = input.language === 'en' ? 'en' : 'zh';
  return {
    system,
    topic: String(input.topic || '').trim().slice(0, 500),
    language,
    timezone: String(input.timezone || '').trim().slice(0, 80),
    times: String(input.times || '').trim().slice(0, 500),
    status: 'unsent',
    label: CONSULT_STATUS,
    sent: false,
  };
}
