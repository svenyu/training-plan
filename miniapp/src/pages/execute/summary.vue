<template>
  <view class="page-bg">
    <image class="bg-image" src="/static/imgs/bg.png" mode="aspectFill" />
  </view>
  <view class="page-wrap">
    <view class="summary-hero">
      <view class="summary-hero__icon">🎉</view>
      <view class="summary-hero__title">本次训练完成</view>
      <view class="summary-hero__rate">{{ completionRate }}%</view>
      <view class="summary-hero__meta">完成率 · 共 {{ items.length }} 项动作</view>
    </view>

    <view class="summary-stat-row">
      <view class="summary-stat">
        <view class="summary-stat__val">{{ doneCount }}</view>
        <view class="summary-stat__label">已完成</view>
      </view>
      <view class="summary-stat">
        <view class="summary-stat__val">{{ skipCount }}</view>
        <view class="summary-stat__label">已跳过</view>
      </view>
      <view class="summary-stat">
        <view class="summary-stat__val">{{ excellentCount }}</view>
        <view class="summary-stat__label">优秀项</view>
      </view>
    </view>

    <view class="form-section__title" style="padding-left: 0; margin-bottom: 16rpx">动作评分</view>
    <view v-for="it in items" :key="it.id" class="list-item">
      <view class="list-item__body">
        <view class="list-item__title">{{ it.exercise.name }}</view>
        <view class="list-item__meta">{{ it.setsDesc || '' }}</view>
      </view>
      <text class="tag" :class="ratingTagClass(it)">{{ label(it) }}</text>
    </view>

    <button class="btn-primary btn-block" style="margin-top: 40rpx" @click="goHome">
      保存并返回首页
    </button>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request } from '../../utils/request';

const items = ref([]);
const map = {
  excellent: '优',
  good: '良',
  fair: '中',
  poor: '评',
  bad: '差',
  skipped: '跳过',
};

const doneCount = computed(() =>
  items.value.filter((i) => i.status === 'done').length,
);
const skipCount = computed(() =>
  items.value.filter((i) => i.status === 'skipped').length,
);
const excellentCount = computed(() =>
  items.value.filter((i) => i.qualityRating === 'excellent').length,
);
const completionRate = computed(() => {
  if (!items.value.length) return 0;
  const done = items.value.filter((i) => i.status !== 'pending').length;
  return Math.round((done / items.value.length) * 100);
});

onLoad(async (q) => {
  const exec = await request({ url: `/executions/${q.executionId}` });
  items.value = exec.items;
});

function label(it) {
  if (it.status === 'skipped') return '跳过';
  return map[it.qualityRating] || '—';
}

function ratingTagClass(it) {
  if (it.status === 'skipped') return 'tag--muted';
  const m = {
    excellent: 'tag--rating-excellent',
    good: 'tag--rating-good',
    fair: 'tag--rating-fair',
    poor: 'tag--rating-poor',
    bad: 'tag--rating-bad',
  };
  return m[it.qualityRating] || 'tag--muted';
}

function goHome() {
  uni.switchTab({ url: '/pages/home/index' });
}
</script>
