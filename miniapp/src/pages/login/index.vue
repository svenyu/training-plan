<template>
  <view class="login-page">
    <view class="login-bg">
      <image class="bg-image" src="/static/imgs/bg.png" mode="aspectFill" />
    </view>
    <view class="login-glass-panel">
      <view class="login-logo-wrapper">
        <image class="login-logo" src="/static/imgs/logo.png" mode="aspectFit" />
      </view>
      <view class="login-title">脊柱康复训练</view>
      <view class="login-desc">科学训练 · 改善体态 · 健康生活</view>
      
      <view class="btn-wechat btn-block" :disabled="!agreed" @click="onLogin">
        <text class="wechat-icon">💬</text>
        <text>微信一键登录</text>
      </view>
      
      <view class="login-features">
        <view class="login-feature">
          <view class="feature-icon-wrap">
            <image class="feature-icon" src="/static/imgs/home.png" mode="aspectFit" />
          </view>
          <view class="feature-body">
            <view class="feature-title">在家科学康复</view>
            <view class="feature-desc">无需器械，随时随地开启训练</view>
          </view>
        </view>
        <view class="login-feature">
          <view class="feature-icon-wrap">
            <image class="feature-icon" src="/static/imgs/video.png" mode="aspectFit" />
          </view>
          <view class="feature-body">
            <view class="feature-title">专业动作库</view>
            <view class="feature-desc">由康复专家设计，安全有效</view>
          </view>
        </view>
        <view class="login-feature">
          <view class="feature-icon-wrap">
            <image class="feature-icon" src="/static/imgs/date.png" mode="aspectFit" />
          </view>
          <view class="feature-body">
            <view class="feature-title">个性化训练计划</view>
            <view class="feature-desc">循序渐进，陪伴你每一步进步</view>
          </view>
        </view>
      </view>
    </view>
    
    <view class="login-agree-wrapper">
      <view class="login-agree" @click="agreed = !agreed">
        <view class="login-agree-row">
          <view class="checkbox" :class="{ checked: agreed }">
            <text v-if="agreed">✓</text>
          </view>
          <view class="agree-text-wrapper">
            <text class="agree-text">
              我已阅读并同意
              <text class="agree-link">《用户协议》</text>
              与
              <text class="agree-link">《隐私政策》</text>
            </text>
            <text class="agree-text">并授权脊柱康复训练使用您的微信信息。</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { request } from '../../utils/request';
import { saveUserToStorage } from '../../utils/profile';

const agreed = ref(false);

async function onLogin() {
  if (!agreed.value) {
    uni.showToast({ title: '请先同意用户协议', icon: 'none' });
    return;
  }
  uni.showLoading({ title: '登录中' });
  try {
    const loginRes = await new Promise((resolve, reject) => {
      uni.login({ provider: 'weixin', success: resolve, fail: reject });
    });
    const data = await request({
      url: '/auth/wechat',
      method: 'POST',
      data: { code: loginRes.code },
    });
    uni.setStorageSync('token', data.accessToken);
    saveUserToStorage(data.user);
    uni.switchTab({ url: '/pages/home/index' });
  } finally {
    uni.hideLoading();
  }
}
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  padding: 0 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
  box-sizing: border-box;
}

.login-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.bg-image {
  width: 100%;
  height: 100%;
}

.login-glass-panel {
  box-sizing: border-box;
  width: calc(100% - 24rpx);
  padding: 64rpx 48rpx;
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-radius: 40rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.05);
  animation: fade-up 0.6s ease-out 0.1s both;
}

.login-logo-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 32rpx;
}

.login-logo {
  width: 160rpx;
  height: 160rpx;
}

.login-title {
  text-align: center;
  font-size: 44rpx;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 16rpx;
}

.login-desc {
  text-align: center;
  font-size: 26rpx;
  color: #6b7280;
  margin-bottom: 40rpx;
}

.btn-wechat {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  background: linear-gradient(135deg, #07c160 0%, #10b981 50%, #34d399 100%) !important;
  color: #fff !important;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 700;
  height: 96rpx;
  line-height: 96rpx;
  box-shadow: 0 12rpx 36rpx rgba(7, 193, 96, 0.35);
  border: none !important;
}

.btn-wechat::after {
  border: none;
}

.btn-wechat.disabled {
  opacity: 0.5;
}

.wechat-icon {
  font-size: 40rpx;
}

.btn-block {
  width: 100%;
}

.login-features {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
  margin-top: 48rpx;
}

.login-feature {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 16rpx;
}

.feature-icon-wrap {
  flex-shrink: 0;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-icon {
  width: 100%;
  height: 100%;
}

.feature-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.feature-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.4;
}

.feature-desc {
  font-size: 24rpx;
  color: #6b7280;
  line-height: 1.5;
}

.login-agree-wrapper {
  box-sizing: border-box;
  width: calc(100% - 24rpx);
  padding: 32rpx 0;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  margin-top: 32rpx;
}

.login-agree {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-radius: 16rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.5);
}

.login-agree-row {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
}

.checkbox {
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid #d1d5db;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #fff;
  background: #fff;
  flex-shrink: 0;
  margin-top: 2rpx;
}

.checkbox.checked {
  background: #10b981;
  border-color: #10b981;
}

.agree-text-wrapper {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.agree-text {
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.65;
}

.agree-link {
  color: #059669;
  font-weight: 600;
}

.agree-sub {
  display: block;
  font-size: 24rpx;
  color: #9ca3af;
  line-height: 1.55;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(32rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
