export const parseDurationToMillis = (durationStr: string): number => {
  const [minutes, seconds] = durationStr.split(":").map(Number);
  return (minutes * 60 + seconds) * 1000;
};

export const formatMillisToTime = (millis: number) => {
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};
