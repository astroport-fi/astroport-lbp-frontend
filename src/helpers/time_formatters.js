export function dateString(date) {
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export function timeAndDateString(timeMs) {
  const date = new Date(timeMs);

  return date.toLocaleString(undefined, {
    timeZoneName: 'short',
    hour: '2-digit',
    minute: '2-digit',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
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
