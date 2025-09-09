export default function translateAlbumType(type: string): string {
  switch (type) {
    case 'album':
      return 'альбом';
    case 'single':
      return 'окремок';
    case 'compilation':
      return 'збірка';
    case 'appears_on':
      return 'співучасть';
    default:
      return type;
  }
}
