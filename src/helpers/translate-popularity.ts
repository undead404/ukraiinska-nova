export default function translatePopularity(popularity: number) {
  if (Number.isNaN(popularity)) {
    return '';
  }
  if (popularity > 6) {
    return 'Легенда';
  }
  if (popularity > 5) {
    return 'Зірка';
  }
  if (popularity > 4) {
    return 'Знаменитість';
  }
  if (popularity > 3) {
    return 'Злет';
  }
  if (popularity > 2) {
    return 'Проблиск';
  }
  if (popularity > 1) {
    return 'Спроба';
  }
  if (popularity > 0) {
    return 'Новачок';
  }
  return 'Таємниця';
}
