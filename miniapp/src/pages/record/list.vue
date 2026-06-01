<template>
  <view class="page-bg">
    <image class="bg-image" src="/static/imgs/bg.png" mode="aspectFill" />
  </view>
  <view class="page-wrap page-wrap--tab">
    <view v-if="list.length" class="form-section__title" style="padding-left: 0; margin-bottom: 24rpx">
      共 {{ list.length }} 次训练记录
    </view>

    <view v-for="e in list" :key="e.id" class="timeline-item">
      <view class="timeline-dot" :class="statusDotClass(e.status)" />
      <view class="card" style="flex: 1; margin-bottom: 0" @click="goDetail(e)">
        <view class="card-row">
          <view style="flex: 1; min-width: 0">
            <view class="card-title-sm">{{ e.plan?.name || '训练计划' }}</view>
            <view class="card-meta-sm">{{ formatExecutionTime(e) }}</view>
          </view>
          <text class="tag" :class="statusTagClass(e.status)">{{ statusLabel(e.status) }}</text>
        </view>
        <view v-if="e.items?.length" class="card-meta-sm" style="margin-top: 12rpx">
          {{ doneItems(e) }}/{{ e.items.length }} 项完成
        </view>
      </view>
    </view>

    <view v-if="!list.length" class="empty-state">
      <view class="empty-state__icon">📋</view>
      <view class="empty-state__title">暂无训练记录</view>
      <view class="empty-state__hint">完成一次训练后，记录将显示在这里</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '../../utils/request';
import { formatExecutionTime } from '../../utils/datetime';

const list = ref([]);
const statusMap = {
  completed: { label: '已完成', cls: 'tag--success', dot: 'dot--success' },
  in_progress: { label: '进行中', cls: 'tag--warning', dot: 'dot--warning' },
  abandoned: { label: '已放弃', cls: 'tag--muted', dot: 'dot--muted' },
};

onShow(async () => {
  const data = await request({ url: '/executions' });
  list.value = (data || []).sort(
    (a, b) =>
      new Date(b.startedAt || b.trainDate).getTime() -
      new Date(a.startedAt || a.trainDate).getTime(),
  );
});

function statusLabel(s) {
  return statusMap[s]?.label || s;
}

function statusTagClass(s) {
  return statusMap[s]?.cls || 'tag--muted';
}

function statusDotClass(s) {
  return statusMap[s]?.dot || '';
}

function doneItems(e) {
  return (e.items || []).filter((i) => i.status === 'done').length;
}

function goDetail(e) {
  if (e.status === 'completed') {
    uni.navigateTo({ url: `/pages/execute/summary?executionId=${e.id}` });
  }
}
</script>

<style scoped>
.timeline-dot.dot--success {
  background: var(--color-success);
}
.timeline-dot.dot--warning {
  background: var(--color-warning);
}
.timeline-dot.dot--muted {
  background: var(--color-text-muted);
}
</style>
