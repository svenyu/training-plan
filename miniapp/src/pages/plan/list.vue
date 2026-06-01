<template>
  <view class="page-bg">
    <image class="bg-image" src="/static/imgs/bg.png" mode="aspectFill" />
  </view>
  <view class="page-wrap page-wrap--fab">
    <view v-for="p in list" :key="p.id" class="swipe-cell">
      <view v-if="showDeleteActions(p.id)" class="swipe-cell__actions">
        <view class="swipe-cell__delete" @click.stop="onDelete(p)">删除</view>
      </view>
      <view
        class="card swipe-cell__content"
        :class="{
          'swipe-cell__content--dragging': drag?.id === p.id,
          'swipe-cell__content--revealed': showDeleteActions(p.id),
        }"
        :style="{ transform: `translateX(${cellOffset(p.id)}px)` }"
        @touchstart="onTouchStart(p.id, $event)"
        @touchmove.stop.prevent="onTouchMove"
        @touchend="onTouchEnd"
        @touchcancel="onTouchEnd"
        @click="onItemClick(p.id)"
      >
        <view class="card-row">
          <view style="flex: 1; min-width: 0">
            <view class="card-title-sm">{{ p.name }}</view>
            <view class="card-meta-sm">{{ timeLabel(p) }}</view>
          </view>
          <text class="tag" :class="statusClass(p.status)">{{ statusLabel(p.status) }}</text>
        </view>
        <view class="progress-bar">
          <view class="progress-bar__fill" :style="{ width: progressPercent(p) + '%' }" />
        </view>
        <view class="card-meta-sm" style="margin-top: 12rpx">
          {{ p.exercises?.length || 0 }} 个动作
          <text> · 已练 {{ p.trainedDays ?? 0 }}/{{ p.totalPlanDays ?? p.totalDays ?? 21 }} 天</text>
        </view>
      </view>
    </view>

    <view v-if="!list.length" class="empty-state">
      <view class="empty-state__icon">📅</view>
      <view class="empty-state__title">还没有训练计划</view>
      <view class="empty-state__hint">创建计划，为孩子安排每日康复训练</view>
    </view>

    <view class="fab-bar">
      <button class="btn-primary btn-block" @click="edit()">+ 创建计划</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '../../utils/request';

const DELETE_WIDTH = uni.upx2px(160);
const CLOSE_ANIM_MS = 220;
const list = ref([]);
const openId = ref(null);
const closingId = ref(null);
const drag = ref(null);
let blockClick = false;
let closeTimer = null;

const statusMap = {
  draft: { label: '草稿', cls: 'tag--muted' },
  active: { label: '进行中', cls: 'tag--success' },
  paused: { label: '已暂停', cls: 'tag--warning' },
  finished: { label: '已结束', cls: 'tag--muted' },
};

onShow(async () => {
  openId.value = null;
  closingId.value = null;
  drag.value = null;
  clearCloseTimer();
  list.value = await request({ url: '/plans' });
});

function clearCloseTimer() {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
}

/** 仅在滑出/展开/收起动画期间挂载删除按钮，避免毛玻璃透出红色 */
function showDeleteActions(id) {
  if (openId.value === id || closingId.value === id) return true;
  if (drag.value?.id === id && drag.value.offset < -4) return true;
  return false;
}

function scheduleCloseActions(id) {
  closingId.value = id;
  clearCloseTimer();
  closeTimer = setTimeout(() => {
    if (closingId.value === id) closingId.value = null;
    closeTimer = null;
  }, CLOSE_ANIM_MS);
}

function cellOffset(id) {
  if (drag.value?.id === id) return drag.value.offset;
  if (openId.value === id) return -DELETE_WIDTH;
  return 0;
}

function onTouchStart(id, e) {
  const startOffset = openId.value === id ? -DELETE_WIDTH : 0;
  if (openId.value && openId.value !== id) {
    scheduleCloseActions(openId.value);
    openId.value = null;
  }
  drag.value = {
    id,
    startX: e.touches[0].clientX,
    startY: e.touches[0].clientY,
    startOffset,
    offset: startOffset,
    lockAxis: null,
    moved: false,
  };
}

function onTouchMove(e) {
  if (!drag.value) return;
  const dx = e.touches[0].clientX - drag.value.startX;
  const dy = e.touches[0].clientY - drag.value.startY;
  if (!drag.value.lockAxis) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    drag.value.lockAxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
  }
  if (drag.value.lockAxis !== 'x') return;
  drag.value.moved = true;
  drag.value.offset = Math.min(0, Math.max(-DELETE_WIDTH, drag.value.startOffset + dx));
}

function onTouchEnd() {
  if (!drag.value) return;
  const { id, offset, moved, lockAxis } = drag.value;
  if (moved && lockAxis === 'x') {
    const willOpen = offset < -DELETE_WIDTH / 2;
    if (willOpen) {
      clearCloseTimer();
      closingId.value = null;
      openId.value = id;
    } else if (openId.value === id || offset < -4) {
      openId.value = null;
      scheduleCloseActions(id);
    } else {
      openId.value = null;
    }
    blockClick = true;
  }
  drag.value = null;
}

function onItemClick(id) {
  if (blockClick) {
    blockClick = false;
    return;
  }
  if (openId.value === id) {
    openId.value = null;
    scheduleCloseActions(id);
    return;
  }
  if (openId.value) {
    scheduleCloseActions(openId.value);
    openId.value = null;
    return;
  }
  detail(id);
}

function onDelete(p) {
  uni.showModal({
    title: '确认删除',
    content: `确定删除计划「${p.name}」？删除后不可恢复。`,
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await request({ url: `/plans/${p.id}`, method: 'DELETE' });
        list.value = list.value.filter((item) => item.id !== p.id);
        if (openId.value === p.id) openId.value = null;
        if (closingId.value === p.id) closingId.value = null;
        uni.showToast({ title: '已删除', icon: 'success' });
      } catch {
        /* request 内已 toast */
      }
    },
  });
}

function statusLabel(s) {
  return statusMap[s]?.label || s;
}

function statusClass(s) {
  return statusMap[s]?.cls || 'tag--muted';
}

function timeLabel(p) {
  if (p.timeMode === 'days') return `${p.totalDays || 21} 天模式`;
  return `${formatDate(p.startDate)} ~ ${formatDate(p.endDate)}`;
}

function formatDate(d) {
  if (!d) return '';
  return String(d).slice(0, 10);
}

function progressPercent(p) {
  if (typeof p.progressPercent === 'number') return p.progressPercent;
  if (p.status === 'finished') return 100;
  return 0;
}

function detail(id) {
  uni.navigateTo({ url: `/pages/plan/detail?id=${id}` });
}

function edit() {
  uni.navigateTo({ url: '/pages/plan/edit' });
}
</script>

<style scoped lang="scss">
.swipe-cell {
  position: relative;
  margin-bottom: 24rpx;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.swipe-cell__actions {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 160rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-right: 12rpx;
  box-sizing: border-box;
  background: rgba(248, 250, 252, 0.98);
}

.swipe-cell__delete {
  width: 120rpx;
  height: calc(100% - 40rpx);
  border-radius: 16rpx;
  background: linear-gradient(180deg, #f87171 0%, #ef4444 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 20rpx rgba(239, 68, 68, 0.35);
}

.swipe-cell__content {
  position: relative;
  z-index: 1;
  margin-bottom: 0 !important;
  transition: transform 0.2s ease;
}

/* 滑出时提高不透明度，避免半透明卡片叠在删除区上发虚 */
.swipe-cell__content--revealed {
  background: rgba(255, 255, 255, 0.96) !important;
}

.swipe-cell__content--dragging {
  transition: none;
}
</style>
