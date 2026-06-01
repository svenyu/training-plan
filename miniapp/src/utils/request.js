import { API_BASE } from '../config';

export function request(options) {
  const token = uni.getStorageSync('token');
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${API_BASE}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.header,
      },
      success(res) {
        const body = res.data;
        if (body.code === 0) {
          resolve(body.data);
        } else if (res.statusCode === 401) {
          uni.removeStorageSync('token');
          uni.reLaunch({ url: '/pages/login/index' });
          reject(body);
        } else {
          uni.showToast({ title: body.message || '请求失败', icon: 'none' });
          reject(body);
        }
      },
      fail: reject,
    });
  });
}
