<template>
  <view class="page-bg">
    <image class="bg-image" src="/static/imgs/bg.png" mode="aspectFill" />
  </view>
  <view class="page-wrap execute-page" v-if="current">
    <view class="execute-progress">
      训练进度
      <view class="execute-progress__num">{{ index + 1 }}/{{ items.length }}</view>
    </view>

    <view class="execute-video-wrap">
      <video
        v-if="current.exercise.videoPlayUrl"
        class="execute-video"
        :src="current.exercise.videoPlayUrl"
        controls
        object-fit="contain"
      />
      <view v-else class="execute-video execute-video--placeholder">
        <text style="font-size: 64rpx">🎬</text>
        <view style="margin-top: 16rpx; font-size: 26rpx; color: rgba(255,255,255,0.7)">暂无示范视频</view>
      </view>
    </view>

    <view class="execute-name">{{ current.exercise.name }}</view>
    <view class="execute-sets">{{ current.setsDesc || '按组次说明完成' }}</view>

    <view class="form-section__title" style="text-align: center; color: var(--color-text-muted)">
      完成质量评分
    </view>
    <view class="rating-grid">
      <button
        v-for="r in ratings"
        :key="r.code"
        class="rating-chip"
        :class="'rating-chip--' + r.code"
        @click="rate(r.code)"
      >
        {{ r.label }}
      </button>
    </view>

    <view class="execute-actions">
      <button class="btn-ghost" @click="skip">跳过此项</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request } from '../../utils/request';

const ratings = [
  { code: 'excellent', label: '优' },
  { code: 'good', label: '良' },
  { code: 'fair', label: '中' },
  { code: 'poor', label: '评' },
  { code: 'bad', label: '差' },
];

const executionId = ref('');
const items = ref([]);
const index = ref(0);

const current = computed(() => items.value[index.value]);

onLoad(async (q) => {
  executionId.value = q.executionId;
  await load();
});

async function load() {
  const exec = await request({ url: `/executions/${executionId.value}` });
  items.value = exec.items;
  const firstPending = items.value.findIndex((i) => i.status === 'pending');
  index.value = firstPending >= 0 ? firstPending : 0;
  if (firstPending < 0) finish();
}

async function rate(code) {
  const item = current.value;
  await request({
    url: `/executions/${executionId.value}/items/${item.id}`,
    method: 'PATCH',
    data: { qualityRating: code, status: 'done' },
  });
  if (index.value < items.value.length - 1) {
    index.value += 1;
    await load();
  } else {
    await request({
      url: `/executions/${executionId.value}/complete`,
      method: 'POST',
    });
    finish();
  }
}

async function skip() {
  const item = current.value;
  await request({
    url: `/executions/${executionId.value}/items/${item.id}`,
    method: 'PATCH',
    data: { status: 'skipped', skipReason: '跳过' },
  });
  if (index.value < items.value.length - 1) {
    index.value += 1;
    await load();
  } else {
    await request({
      url: `/executions/${executionId.value}/complete`,
      method: 'POST',
    });
    finish();
  }
}

function finish() {
  uni.redirectTo({ url: `/pages/execute/summary?executionId=${executionId.value}` });
}
</script>

<style scoped>
.execute-page {
  padding-bottom: 48rpx;
}

.execute-video-wrap {
  margin-bottom: 8rpx;
}

.execute-video--placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(16, 185, 129, 0.3);
  backdrop-filter: blur(16px);
  color: rgba(255, 255, 255, 0.85);
}

.execute-actions {
  margin-top: 24rpx;
}
</style>
