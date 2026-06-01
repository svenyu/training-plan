<template>
  <view class="page-bg">
    <image class="bg-image" src="/static/imgs/bg.png" mode="aspectFill" />
  </view>
  <view class="page-wrap" v-if="plan">
    <view class="plan-hero">
      <view class="plan-hero__title">{{ plan.name }}</view>
      <view class="plan-hero__meta">
        {{ timeLabel(plan) }}
        <text v-if="plan.exercises?.length"> · {{ plan.exercises.length }} 个动作</text>
      </view>
      <view v-if="plan.description" class="plan-hero__meta" style="margin-top: 16rpx; opacity: 0.85">
        {{ plan.description }}
      </view>
    </view>

    <view class="card card-row">
      <view>
        <view class="card-title-sm">今日训练</view>
        <view class="card-meta-sm">{{ todayStatus }}</view>
        <view v-if="todaySessionCount > 0" class="card-meta-sm" style="margin-top: 8rpx">
          今日第 {{ todaySessionCount }} 次 · 计划进度按天统计
        </view>
      </view>
      <text class="tag" :class="todayTagClass">{{ todayTagLabel }}</text>
    </view>

    <view class="form-section__title" style="padding-left: 0; margin-bottom: 16rpx">动作清单</view>
    <view
      v-for="(pe, i) in plan.exercises"
      :key="pe.id"
      class="list-item"
    >
      <view class="exercise-index">{{ i + 1 }}</view>
      <view class="list-item__body">
        <view class="list-item__title">{{ pe.exercise?.name || pe.exerciseName }}</view>
        <view class="list-item__meta">{{ pe.setsDesc || '按说明完成' }}</view>
      </view>
      <text class="tag tag--teal">必做</text>
    </view>

    <button class="btn-primary btn-block" style="margin-top: 32rpx" @click="start">
      {{ primaryBtnText }}
    </button>
    <button
      v-if="todaySessionCount > 0"
      class="btn-secondary btn-block"
      style="margin-top: 20rpx"
      @click="goRecords"
    >
      查看训练记录
    </button>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { request } from '../../utils/request';

const plan = ref(null);
const todayDone = ref(false);
const todayInProgress = ref(false);
const todaySessionCount = ref(0);
let planId = '';

const todayStatus = ref('按计划完成今日康复训练');

const todayTagLabel = computed(() => {
  if (todayInProgress.value) return '进行中';
  if (todayDone.value) return '已练';
  return '待完成';
});

const todayTagClass = computed(() => {
  if (todayInProgress.value) return 'tag--warning';
  if (todayDone.value) return 'tag--success';
  return 'tag--warning';
});

const primaryBtnText = computed(() => {
  if (todayInProgress.value) return '继续训练';
  if (todayDone.value) return '再次训练';
  return '开始训练';
});

onLoad(async (q) => {
  planId = q.id;
  await loadPlan();
  if (q.start === '1' && !todayInProgress.value) start();
});

onShow(() => {
  if (planId) checkToday();
});

async function loadPlan() {
  plan.value = await request({ url: `/plans/${planId}` });
  await checkToday();
}

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function checkToday() {
  try {
    const list = await request({ url: `/executions?planId=${planId}` });
    const today = todayKey();
    const todayExecs = (list || []).filter(
      (e) => String(e.trainDate).slice(0, 10) === today,
    );
    todaySessionCount.value = todayExecs.length;
    todayInProgress.value = todayExecs.some((e) => e.status === 'in_progress');
    todayDone.value = todayExecs.some((e) => e.status === 'completed');

    if (todayInProgress.value) {
      todayStatus.value = '今日训练进行中，可继续完成';
    } else if (todayDone.value) {
      todayStatus.value = '今日已完成训练，可再次开练（进度仍按天累计）';
    } else {
      todayStatus.value = '今日尚未完成训练';
    }
  } catch {
    todayDone.value = false;
    todayInProgress.value = false;
    todaySessionCount.value = 0;
  }
}

function timeLabel(p) {
  if (p.timeMode === 'days') return `${p.totalDays || 21} 天计划`;
  return `${formatDate(p.startDate)} ~ ${formatDate(p.endDate)}`;
}

function formatDate(d) {
  if (!d) return '';
  return String(d).slice(0, 10);
}

async function start() {
  const exec = await request({
    url: '/executions',
    method: 'POST',
    data: { planId },
  });
  uni.navigateTo({ url: `/pages/execute/index?executionId=${exec.id}` });
}

function goRecords() {
  uni.switchTab({ url: '/pages/record/list' });
}
</script>
