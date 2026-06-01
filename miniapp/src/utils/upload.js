import { API_BASE } from '../config';

/** 经后端 multipart 上传（微信原生支持，无需配置 MinIO 域名） */
function uploadViaServer(filePath, contentType, filename) {
  const token = uni.getStorageSync('token');
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${API_BASE}/upload/file`,
      filePath,
      name: 'file',
      formData: {
        contentType,
        filename: filename || filePath.split('/').pop() || 'file',
      },
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        let body;
        try {
          body = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
        } catch {
          reject(new Error('上传响应解析失败'));
          return;
        }
        if (res.statusCode === 401) {
          uni.removeStorageSync('token');
          uni.reLaunch({ url: '/pages/login/index' });
          reject(body);
          return;
        }
        if (body.code === 0) {
          resolve(body.data);
          return;
        }
        uni.showToast({ title: body.message || '上传失败', icon: 'none' });
        reject(body);
      },
      fail: reject,
    });
  });
}

/** 选择视频 → 后端上传 MinIO → 返回 objectKey（loading 须在选完文件后再显示，否则会挡住系统选视频界面） */
export async function uploadVideo() {
  const choose = await new Promise((resolve, reject) => {
    uni.chooseVideo({
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      success: resolve,
      fail: reject,
    });
  });

  uni.showLoading({ title: '上传中', mask: true });
  try {
    const filename = choose.tempFilePath.split('/').pop() || 'video.mp4';
    const result = await uploadViaServer(choose.tempFilePath, 'video/mp4', filename);
    return result.objectKey;
  } finally {
    uni.hideLoading();
  }
}

/** 上传微信头像临时文件，返回可访问 URL */
export async function uploadAvatar(tempFilePath) {
  const filename = tempFilePath.split('/').pop() || 'avatar.jpg';
  const contentType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const result = await uploadViaServer(tempFilePath, contentType, filename);
  return result.publicUrl || result.playUrl;
}
