<template>
  <view class="home-page">
    <view class="home-bg">
      <image class="bg-image" src="/static/imgs/bg.png" mode="aspectFill" />
    </view>
    
    <view class="home-header">
      <view class="header-top">
        <view class="header-left">
          <view class="greeting">Hi，{{ userName }}</view>
          <view class="date-str">今天是 {{ dateStr }}</view>
        </view>
        <view class="header-right">
          <view class="icon-bell-btn" @click="goRemind">
            <view class="icon-bell" />
          </view>
        </view>
      </view>
    </view>

    <view class="home-content">
      <view class="today-card" v-if="heroPlan" @click="goPlan(heroPlan.id)">
        <view class="today-card__header">
          <view class="card-title-bar">
            <view class="title-indicator"></view>
            <text class="card-title">今日待训练</text>
          </view>
        </view>
        <view class="today-card__inner">
          <view class="today-card__left">
            <image class="card-icon" src="/static/imgs/df.png" mode="aspectFit" />
          </view>
          <view class="today-card__right">
            <view class="plan-name">{{ heroPlan.name || '轻度侧弯纠正计划' }}</view>
            <view class="day-progress">
              <text class="day-label">第 </text>
              <text class="day-current">{{ heroPlan.currentDay ?? 0 }}</text>
              <text class="day-sep"> / </text>
              <text class="day-total">{{ heroPlan.totalPlanDays || heroPlan.totalDays || 21 }}</text>
              <text class="day-label"> 天</text>
            </view>
            <view class="status-tag" :class="heroPlan.status === 'completed' ? 'tag--done' : 'tag--pending'">
              {{ heroPlan.status === 'completed' ? '已完成' : '未练习' }}
            </view>
            <view class="weekly-progress">
              <text class="weekly-label">本周进度</text>
              <view class="weekly-bar">
                <view class="weekly-bar__fill" :style="{ width: weeklyPercent + '%' }"></view>
              </view>
              <text class="weekly-text">{{ heroPlan.weeklyProgress ?? 0 }}/7 天</text>
            </view>
          </view>
        </view>
      </view>

      <view class="reminder-banner" @click="goRemind">
        <text class="reminder-icon">🔔</text>
        <text class="reminder-text">开启训练提醒</text>
        <text class="reminder-link">不再错过训练 →</text>
      </view>

      <view class="plans-section">
        <view class="section-header">
          <view class="section-title-bar">
            <view class="title-indicator"></view>
            <text class="section-title">进行中计划</text>
          </view>
          <text class="section-link" @click="goAllPlans">全部计划 →</text>
        </view>

        <view v-if="activePlans.length" class="plan-list">
          <view v-for="plan in activePlans" :key="plan.id" class="plan-item" @click="goPlan(plan.id)">
            <view class="plan-item__info">
              <view class="plan-item__name">{{ plan.name }}</view>
              <view class="plan-item__meta">
                <text class="plan-duration">{{ plan.totalDays || 21 }}天计划</text>
                <text class="plan-remaining">剩余 {{ getRemainingDays(plan) }}天</text>
              </view>
            </view>
            <view class="plan-item__action" @click.stop="startTrain(plan.id)">
              开始训练
            </view>
          </view>
        </view>

        <view v-if="!activePlans.length" class="empty-hint">
          暂无进行中的计划
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '../../utils/request';
import { fetchAndSaveProfile } from '../../utils/profile';

const activePlans = ref([]);
const user = ref(uni.getStorageSync('user') || {});

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return '早上好';
  if (h < 18) return '下午好';
  return '晚上好';
});

/** 有昵称展示昵称，否则用时段问候 */
const userName = computed(() => {
  const n = user.value.nickname?.trim();
  return n || greeting.value;
});

const dateStr = computed(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weeks = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return `${year}年${month}月${day}日 ${weeks[now.getDay()]}`;
});

const heroPlan = computed(() => {
  const plan = activePlans.value[0];
  if (!plan) return null;
  return {
    ...plan,
    currentDay: plan.trainedDays ?? plan.currentDay ?? 0,
    weeklyProgress: plan.weeklyTrainedDays ?? 0,
  };
});

const weeklyPercent = computed(() => {
  if (!heroPlan.value) return 0;
  return Math.min(100, ((heroPlan.value.weeklyProgress ?? 0) / 7) * 100);
});

onShow(load);

async function load() {
  try {
    user.value = await fetchAndSaveProfile();
  } catch {
    user.value = uni.getStorageSync('user') || {};
  }
  const plans = await request({ url: '/plans' });
  activePlans.value = (plans || []).filter((p) => p.status === 'active');
}

function getRemainingDays(plan) {
  const total = plan.totalPlanDays || plan.totalDays || 21;
  const trained = plan.trainedDays ?? plan.currentDay ?? 0;
  return Math.max(0, total - trained);
}

function goPlan(id) {
  uni.navigateTo({ url: `/pages/plan/detail?id=${id}` });
}

function startTrain(id) {
  uni.navigateTo({ url: `/pages/plan/detail?id=${id}&start=1` });
}

function goRemind() {
  uni.switchTab({ url: '/pages/mine/index' });
}

function goAllPlans() {
  uni.switchTab({ url: '/pages/plan/list' });
}
</script>

<style scoped>
.home-page {
  position: relative;
  min-height: 100vh;
  z-index: 1;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.home-bg {
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

.home-header {
  position: relative;
  padding: 60rpx 48rpx 32rpx;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-top: env(safe-area-inset-top);
}

.header-left {
  flex: 1;
}

.greeting {
  font-size: 40rpx;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12rpx;
}

.date-str {
  font-size: 26rpx;
  font-weight: 500;
  color: #374151;
  text-shadow: 0 1rpx 4rpx rgba(255, 255, 255, 0.8);
}

.header-right {
  display: flex;
  gap: 24rpx;
  align-items: center;
}

.icon-bell-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.72);
  border: 1rpx solid rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.1);
}

.icon-bell {
  width: 38rpx;
  height: 38rpx;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23059669' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9'/%3E%3Cpath d='M13.73 21a2 2 0 0 1-3.46 0'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.home-content {
  position: relative;
  padding: 0 32rpx;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
  padding-top: 32rpx;
  z-index: 1;
}

.today-card {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-radius: 32rpx;
  padding: 8rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
}

.today-card__header {
  padding: 24rpx 24rpx 0;
}

.card-title-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.title-indicator {
  width: 8rpx;
  height: 36rpx;
  background: linear-gradient(180deg, #10b981 0%, #34d399 100%);
  border-radius: 4rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2937;
}

.today-card__inner {
  display: flex;
  padding: 24rpx;
  gap: 24rpx;
}

.today-card__left {
  width: 180rpx;
  height: 180rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon {
  width: 140rpx;
  height: 140rpx;
}

.today-card__right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.plan-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12rpx;
}

.day-progress {
  display: flex;
  align-items: baseline;
  margin-bottom: 12rpx;
}

.day-label {
  font-size: 26rpx;
  color: #6b7280;
}

.day-current {
  font-size: 48rpx;
  font-weight: 800;
  color: #10b981;
  margin: 0 4rpx;
}

.day-sep,
.day-total {
  font-size: 28rpx;
  color: #6b7280;
}

.status-tag {
  display: inline-block;
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
  width: fit-content;
}

.tag--pending {
  background: rgba(251, 191, 36, 0.25);
  color: #d97706;
}

.tag--done {
  background: rgba(16, 185, 129, 0.25);
  color: #10b981;
}

.weekly-progress {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.weekly-label {
  font-size: 22rpx;
  color: #6b7280;
  white-space: nowrap;
}

.weekly-bar {
  flex: 1;
  height: 8rpx;
  background: rgba(16, 185, 129, 0.25);
  border-radius: 4rpx;
  overflow: hidden;
}

.weekly-bar__fill {
  height: 100%;
  background: #10b981;
  border-radius: 4rpx;
}

.weekly-text {
  font-size: 22rpx;
  color: #10b981;
  white-space: nowrap;
}

.reminder-banner {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-radius: 20rpx;
  padding: 24rpx 28rpx;
  margin-top: 24rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.reminder-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.reminder-text {
  flex: 1;
  font-size: 28rpx;
  color: #1f2937;
  font-weight: 500;
}

.reminder-link {
  font-size: 24rpx;
  color: #10b981;
}

.plans-section {
  margin-top: 32rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2937;
}

.section-link {
  font-size: 24rpx;
  color: #10b981;
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.plan-item {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-radius: 24rpx;
  padding: 28rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1rpx solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.plan-item__info {
  flex: 1;
}

.plan-item__name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 10rpx;
}

.plan-item__meta {
  display: flex;
  gap: 16rpx;
}

.plan-duration {
  font-size: 24rpx;
  color: #6b7280;
}

.plan-remaining {
  font-size: 24rpx;
  color: #10b981;
}

.plan-item__action {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 600;
  padding: 16rpx 28rpx;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(16, 185, 129, 0.3);
}

.empty-hint {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-radius: 24rpx;
  text-align: center;
  padding: 60rpx;
  font-size: 28rpx;
  color: #6b7280;
  border: 1rpx solid rgba(255, 255, 255, 0.15);
}
</style>
