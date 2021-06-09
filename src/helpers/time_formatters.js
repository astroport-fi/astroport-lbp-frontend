function padded(int) {
  return String(int).padStart(2, '0');
}

export function dateString(date) {
  return `${padded(date.getDate())}-${padded(date.getMonth()+1)}-${date.getFullYear()}`;
}

export function timeAndDateString(timeMs) {
  const date = new Date(timeMs);

  const timeString = `${padded(date.getHours())}:${padded(date.getMinutes())} (UTC)`;

  return `${timeString} ${dateString(date)}`;
}