export default function areDatesSameDay(...dates: Date[]): boolean {
  let day: string = '';
  for (const date of dates) {
    const datesDay = date.toISOString().slice(0, 10);
    if (day) {
      if (datesDay !== day) {
        return false;
      }
    } else {
      day = datesDay;
    }
  }
  return true;
}
