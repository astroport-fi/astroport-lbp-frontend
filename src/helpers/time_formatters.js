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

// Returns a string like: 1d : 22h : 25m
// When seconds < 60, returns "< 1m"
// Behavior when seconds <=0 is unspecified
export function durationString(seconds) {
  const minutes = seconds / 60;
  const hours = minutes / 60;

  if(seconds >= 60) {
    return `${Math.floor(hours / 24)}d : ${Math.floor(hours % 24)}h : ${Math.floor(minutes % 60)}m`;
  } else {
    return '< 1m';
  }
}
