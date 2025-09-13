export default function translatePopularity(popularity: number) {
  if (Number.isNaN(popularity)) {
    return '';
  }
  if (popularity > 50) {
    return 'Легенда';
  }
  if (popularity > 25) {
    return 'Зірка';
  }
  if (popularity > 12.5) {
    return 'Знаменитість';
  }
  if (popularity > 6.75) {
    return 'Злет';
  }
  if (popularity > 3.375) {
    return 'Проблиск';
  }
  if (popularity > 1.6875) {
    return 'Спроба';
  }
  if (popularity > 0.843_75) {
    return 'Новачок';
  }
  return 'Таємниця';
}
