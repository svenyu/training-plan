/** 将 Prisma BigInt 转为字符串，避免 JSON 序列化失败 */
export function serialize<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? v.toString() : v)),
  ) as T;
}
