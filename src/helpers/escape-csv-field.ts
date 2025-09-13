export default function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replaceAll('"', '""')}"`;
  }
  return field;
}
