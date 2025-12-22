export function normalizeTime(time: number | string | Date): number {
  const ts = typeof time === 'number' ? time : new Date(time).getTime();
  if (isNaN(ts)) throw new Error('Invalid target time');
  return ts;
}
