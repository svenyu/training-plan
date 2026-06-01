<template>
  <view class="page-bg">
    <image class="bg-image" src="/static/imgs/bg.png" mode="aspectFill" />
  </view>
  <view class="page-wrap page-wrap--fab">
    <view class="form-section">
      <view class="form-section__title">计划信息</view>
      <view class="form-field">
        <text class="form-field__label">计划名称</text>
        <input v-model="form.name" placeholder="如：21天脊柱康复" />
      </view>
      <view class="form-field">
        <text class="form-field__label">计划说明（选填）</text>
        <textarea v-model="form.description" placeholder="训练目标与注意事项" />
      </view>
    </view>

    <view class="form-section">
      <view class="form-section__title">时间模式</view>
      <view class="form-field">
        <radio-group class="card-row" @change="onModeChange">
          <label style="margin-right: 40rpx">
            <radio value="days" :checked="form.timeMode === 'days'" color="#10b981" />
            固定天数
          </label>
          <label>
            <radio value="range" :checked="form.timeMode === 'range'" color="#10b981" />
            日期区间
          </label>
        </radio-group>
      </view>
      <view v-if="form.timeMode === 'days'" class="form-field">
        <text class="form-field__label">训练天数</text>
        <input type="number" v-model.number="form.totalDays" placeholder="如 21" />
      </view>
      <template v-else>
        <view class="form-field">
          <text class="form-field__label">开始日期</text>
          <picker mode="date" @change="(e) => (form.startDate = e.detail.value)">
            <view class="picker-value">{{ form.startDate || '请选择' }}</view>
          </picker>
        </view>
        <view class="form-field">
          <text class="form-field__label">结束日期</text>
          <picker mode="date" @change="(e) => (form.endDate = e.detail.value)">
            <view class="picker-value">{{ form.endDate || '请选择' }}</view>
          </picker>
        </view>
      </template>
    </view>

    <view class="form-section">
      <view class="form-section__title">训练动作（{{ selected.length }}）</view>
      <view v-if="selected.length" class="form-section__hint">按住右侧把手拖动排序</view>
      <view
        v-for="(ex, i) in selected"
        :key="ex.id"
        class="form-field exercise-sort-item"
        :class="{ 'exercise-sort-item--dragging': dragIndex === i }"
      >
        <view class="card-row exercise-row">
          <view class="exercise-index">{{ i + 1 }}</view>
          <view class="list-item__title exercise-row__name">{{ ex.name }}</view>
          <view class="exercise-actions">
            <view
              class="drag-handle"
              @touchstart.stop="onDragStart(i)"
              @touchmove.stop.prevent="onDragMove"
              @touchend.stop="onDragEnd"
              @touchcancel.stop="onDragEnd"
            >
              <text class="drag-handle__icon">⋮⋮</text>
            </view>
            <view class="exercise-actions__btn exercise-actions__btn--danger" @click="removeAt(i)">
              移除
            </view>
          </view>
        </view>
        <text class="form-field__label">组次录入</text>
        <input v-model="ex.setsDesc" placeholder="如 10次/组×3组" />
      </view>
      <button class="btn-secondary btn-block" @click="pickExercises">从动作库添加</button>
    </view>

    <view class="fab-bar">
      <button class="btn-primary btn-block" @click="save">保存并发布计划</button>
    </view>
  </view>
</template>

<script setup>
import { ref, nextTick, getCurrentInstance } from 'vue';
import { request } from '../../utils/request';
import { requestTrainSubscribe } from '../../utils/subscribe';

const instance = getCurrentInstance();

const form = ref({
  name: '',
  description: '',
  timeMode: 'days',
  totalDays: 21,
  startDate: '',
  endDate: '',
});
const selected = ref([]);
const dragIndex = ref(null);
let itemRects = [];

/** 测量各动作卡片位置，供拖拽时计算目标索引 */
function measureItems() {
  return new Promise((resolve) => {
    uni
      .createSelectorQuery()
      .in(instance.proxy)
      .selectAll('.exercise-sort-item')
      .boundingClientRect((rects) => {
        itemRects = (rects || []).filter((r) => r && r.height > 0);
        resolve(itemRects);
      })
      .exec();
  });
}

/** 根据触点纵坐标落在哪张卡片（或间隙）确定目标索引 */
function findIndexAtY(y) {
  if (!itemRects.length) return -1;
  for (let i = 0; i < itemRects.length; i++) {
    const r = itemRects[i];
    if (y >= r.top && y <= r.bottom) return i;
  }
  if (y < itemRects[0].top) return 0;
  const last = itemRects.length - 1;
  if (y > itemRects[last].bottom) return last;
  for (let i = 0; i < last; i++) {
    if (y > itemRects[i].bottom && y < itemRects[i + 1].top) {
      const mid = (itemRects[i].bottom + itemRects[i + 1].top) / 2;
      return y < mid ? i : i + 1;
    }
  }
  return -1;
}

/** 将 dragIndex 项移动到 target 位置 */
function moveItemTo(drag, target) {
  if (target < 0 || target === drag) return;
  const arr = [...selected.value];
  const [item] = arr.splice(drag, 1);
  arr.splice(target, 0, item);
  selected.value = arr;
  dragIndex.value = target;
}

async function onDragStart(i) {
  dragIndex.value = i;
  await nextTick();
  await measureItems();
}

async function onDragMove(e) {
  if (dragIndex.value === null) return;
  const y = e.touches[0].clientY;
  const target = findIndexAtY(y);
  if (target < 0 || target === dragIndex.value) return;
  moveItemTo(dragIndex.value, target);
  await nextTick();
  await measureItems();
}

function onDragEnd() {
  dragIndex.value = null;
  itemRects = [];
}

function onModeChange(e) {
  form.value.timeMode = e.detail.value;
}

function removeAt(i) {
  const ex = selected.value[i];
  uni.showModal({
    title: '确认移除',
    content: `确定从计划中移除「${ex.name}」？`,
    success(res) {
      if (res.confirm) selected.value.splice(i, 1);
    },
  });
}

async function pickExercises() {
  const all = await request({ url: '/exercises' });
  const enabled = (all || []).filter((e) => e.status === 1);
  if (!enabled.length) {
    uni.showToast({ title: '请先添加动作', icon: 'none' });
    return;
  }
  const names = enabled.map((e) => e.name);
  uni.showActionSheet({
    itemList: names.slice(0, 6),
    success(res) {
      const ex = enabled[res.tapIndex];
      if (!selected.value.find((s) => s.id === ex.id)) {
        selected.value.push({ id: ex.id, name: ex.name, setsDesc: '10次/组×3组' });
      }
    },
  });
}

async function save() {
  if (!form.value.name) {
    uni.showToast({ title: '请填写计划名称', icon: 'none' });
    return;
  }
  if (!selected.value.length) {
    uni.showToast({ title: '请至少添加一个动作', icon: 'none' });
    return;
  }
  const plan = await request({
    url: '/plans',
    method: 'POST',
    data: {
      ...form.value,
      exercises: selected.value.map((ex, i) => ({
        exerciseId: String(ex.id),
        sortOrder: i,
        setsDesc: ex.setsDesc,
      })),
    },
  });
  await requestTrainSubscribe();
  uni.redirectTo({ url: `/pages/plan/detail?id=${plan.id}` });
}
</script>

<style scoped lang="scss">
.form-section__hint {
  font-size: 24rpx;
  color: var(--color-text-muted);
  margin: -16rpx 0 20rpx;
}

.exercise-sort-item {
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.exercise-sort-item--dragging {
  box-shadow: 0 16rpx 48rpx rgba(16, 185, 129, 0.25);
  transform: scale(1.02);
  z-index: 2;
  position: relative;
}

.exercise-row {
  margin-bottom: 16rpx;
  gap: 12rpx;
}

.exercise-row__name {
  flex: 1;
  min-width: 0;
}

.exercise-actions {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex-shrink: 0;
}

.drag-handle {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(16, 185, 129, 0.12);
  border-radius: 12rpx;
  border: 1rpx solid rgba(16, 185, 129, 0.25);
}

.drag-handle__icon {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: -4rpx;
  line-height: 1;
}

.exercise-actions__btn {
  height: 52rpx;
  padding: 0 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 600;
  border-radius: 12rpx;
}

.exercise-actions__btn--danger {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border: 1rpx solid rgba(239, 68, 68, 0.25);
}
</style>
