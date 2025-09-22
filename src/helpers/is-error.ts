export default function isError(
  value: unknown,
): value is Record<'code' | 'message', unknown> {
  return !(
    typeof value !== 'object' ||
    !value ||
    !('code' in value) ||
    !('message' in value)
  );
}
