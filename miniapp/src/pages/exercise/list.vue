<template>
  <view class="page-bg">
    <image class="bg-image" src="/static/imgs/bg.png" mode="aspectFill" />
  </view>
  <view class="page-wrap page-wrap--fab">
    <view class="search-bar">
      <text class="search-icon">🔍</text>
      <input v-model="keyword" placeholder="搜索动作名称" confirm-type="search" />
    </view>

    <view class="tabs">
      <view
        v-for="(label, i) in catLabels"
        :key="cats[i]"
        class="tab-item"
        :class="{ active: filterCat === cats[i] }"
        @click="filterCat = cats[i]"
      >
        {{ label }}
      </view>
    </view>

    <view v-for="e in filteredList" :key="e.id" class="swipe-cell">
      <view v-if="showDeleteActions(e.id)" class="swipe-cell__actions">
        <view class="swipe-cell__delete" @click.stop="onDelete(e)">删除</view>
      </view>
      <view
        class="list-item swipe-cell__content"
        :class="{
          'swipe-cell__content--dragging': drag?.id === e.id,
          'swipe-cell__content--revealed': showDeleteActions(e.id),
        }"
        :style="{ transform: `translateX(${cellOffset(e.id)}px)` }"
        @touchstart="onTouchStart(e.id, $event)"
        @touchmove.stop.prevent="onTouchMove"
        @touchend="onTouchEnd"
        @touchcancel="onTouchEnd"
        @click="onItemClick(e.id)"
      >
        <view class="exercise-thumb">{{ thumbEmoji(e.category) }}</view>
        <view class="list-item__body">
          <view class="list-item__title">{{ e.name }}</view>
          <view class="list-item__meta">
            <text class="tag tag--teal">{{ categoryLabel(e.category) }}</text>
            <text class="tag" :class="e.status === 1 ? 'tag--success' : 'tag--muted'" style="margin-left: 12rpx">
              {{ e.status === 1 ? '启用' : '停用' }}
            </text>
          </view>
        </view>
        <text class="menu-item__arrow">›</text>
      </view>
    </view>

    <view v-if="!filteredList.length" class="empty-state">
      <view class="empty-state__icon">💪</view>
      <view class="empty-state__title">暂无动作</view>
      <view class="empty-state__hint">点击下方按钮添加康复动作</view>
    </view>

    <view class="fab-bar">
      <button class="btn-primary btn-block" @click="edit()">+ 新增动作</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '../../utils/request';

const DELETE_WIDTH = uni.upx2px(160);
const CLOSE_ANIM_MS = 220;

const list = ref([]);
const keyword = ref('');
const filterCat = ref('all');
const cats = ['all', 'warmup', 'main', 'stretch', 'other'];
const catLabels = ['全部', '热身', '主训', '拉伸', '其他'];
const categories = { warmup: '热身', main: '主训', stretch: '拉伸', other: '其他' };
const thumbMap = { warmup: '🔥', main: '💪', stretch: '🧘', other: '📌' };

const openId = ref(null);
const closingId = ref(null);
const drag = ref(null);
let blockClick = false;
let closeTimer = null;

onShow(async () => {
  openId.value = null;
  closingId.value = null;
  drag.value = null;
  clearCloseTimer();
  list.value = await request({ url: '/exercises' });
});

const filteredList = computed(() => {
  let arr = list.value || [];
  if (filterCat.value !== 'all') {
    arr = arr.filter((e) => e.category === filterCat.value);
  }
  if (keyword.value.trim()) {
    const kw = keyword.value.trim().toLowerCase();
    arr = arr.filter((e) => e.name.toLowerCase().includes(kw));
  }
  return arr;
});

function clearCloseTimer() {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
}

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
  edit(id);
}

function onDelete(e) {
  uni.showModal({
    title: '确认删除',
    content: `确定删除动作「${e.name}」？删除后将从动作库移除，已加入训练计划中的引用不受影响。`,
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await request({ url: `/exercises/${e.id}`, method: 'DELETE' });
        list.value = list.value.filter((item) => item.id !== e.id);
        if (openId.value === e.id) openId.value = null;
        if (closingId.value === e.id) closingId.value = null;
        uni.showToast({ title: '已删除', icon: 'success' });
      } catch {
        /* request 内已 toast */
      }
    },
  });
}

function categoryLabel(c) {
  return categories[c] || c;
}

function thumbEmoji(c) {
  return thumbMap[c] || '💪';
}

function edit(id) {
  uni.navigateTo({ url: id ? `/pages/exercise/edit?id=${id}` : '/pages/exercise/edit' });
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

.swipe-cell__content--revealed {
  background: rgba(255, 255, 255, 0.96) !important;
}

.swipe-cell__content--dragging {
  transition: none;
}
</style>
