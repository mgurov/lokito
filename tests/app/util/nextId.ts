let nextIdInternal = 1;

export function nextNumericId() {
  return nextIdInternal++;
}

export function nextId({ prefix }: { prefix?: string } = {}) {
  return `${prefix || ''}${nextIdInternal++}`;
}
