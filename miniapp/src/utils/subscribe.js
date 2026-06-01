import { SUBSCRIBE_TEMPLATE_ID } from '../config';
import { request } from './request';

/** 请求一次性订阅授权，成功后通知后端增加额度 */
export function requestTrainSubscribe() {
  if (!SUBSCRIBE_TEMPLATE_ID) {
    uni.showToast({ title: '请先配置订阅模板 ID', icon: 'none' });
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    uni.requestSubscribeMessage({
      tmplIds: [SUBSCRIBE_TEMPLATE_ID],
      success: async (res) => {
        if (res[SUBSCRIBE_TEMPLATE_ID] === 'accept') {
          await request({ url: '/subscribe/confirm', method: 'POST' });
          uni.showToast({ title: '订阅成功，可提醒 1 次', icon: 'success' });
          resolve(true);
        } else {
          resolve(false);
        }
      },
      fail: () => resolve(false),
    });
  });
}
