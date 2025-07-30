export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\n/g, "\\n").replace(/\t/g, "\\t");
}
