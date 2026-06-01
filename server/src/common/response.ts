export function ok<T>(data: T, message = 'ok') {
  return { code: 0, message, data };
}

export function fail(code: number, message: string) {
  return { code, message, data: null };
}
