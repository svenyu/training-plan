import { request } from './request';
import { uploadAvatar } from './upload';

/** 本地临时路径需先上传再入库 */
function isTempAvatar(path) {
  if (!path) return false;
  return (
    path.startsWith('wxfile://') ||
    path.startsWith('http://tmp/') ||
    path.startsWith('https://tmp/') ||
    (!path.startsWith('http://') && !path.startsWith('https://'))
  );
}

/** 将微信头像临时路径转为可持久化 URL */
export async function resolveAvatarUrl(avatarPath) {
  if (!avatarPath || !isTempAvatar(avatarPath)) {
    return avatarPath || undefined;
  }
  return uploadAvatar(avatarPath);
}

/** 登录或资料变更后写入本地缓存 */
export function saveUserToStorage(user) {
  if (user) {
    uni.setStorageSync('user', user);
  }
}

/** 拉取并缓存最新用户资料 */
export async function fetchAndSaveProfile() {
  const user = await request({ url: '/auth/me' });
  saveUserToStorage(user);
  return user;
}

/** 同步昵称、头像到服务端 */
export async function syncProfile({ nickname, avatarUrl }) {
  const resolvedAvatar = avatarUrl !== undefined ? await resolveAvatarUrl(avatarUrl) : undefined;
  const payload = {};
  if (nickname !== undefined) payload.nickname = nickname;
  if (resolvedAvatar !== undefined) payload.avatarUrl = resolvedAvatar;
  if (!Object.keys(payload).length) {
    return uni.getStorageSync('user') || {};
  }
  const user = await request({
    url: '/auth/profile',
    method: 'PUT',
    data: payload,
  });
  saveUserToStorage(user);
  return user;
}
