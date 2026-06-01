<template>
  <view class="page-bg">
    <image class="bg-image" src="/static/imgs/bg.png" mode="aspectFill" />
  </view>
  <view class="page-wrap page-wrap--tab">
    <view class="mine-header">
      <button class="mine-avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
        <image
          v-if="displayAvatar"
          class="mine-avatar mine-avatar--img"
          :src="displayAvatar"
          mode="aspectFill"
        />
        <view v-else class="mine-avatar">{{ avatarText }}</view>
      </button>
      <view class="mine-header__info">
        <input
          class="mine-name-input"
          type="nickname"
          :value="nickname"
          placeholder="点击填写微信昵称"
          @blur="onNicknameBlur"
          @input="onNicknameInput"
        />
        <view class="mine-role">家长 · 康复训练管理员</view>
        <view v-if="!hasProfile" class="mine-profile-tip" @click="onSyncProfile">
          同步微信头像与昵称
        </view>
      </view>
    </view>

    <view class="card">
      <view class="card-row">
        <view>
          <view class="card-title-sm">训练提醒</view>
          <view class="card-meta-sm">订阅剩余 {{ status.subscribeQuota ?? 0 }} 次</view>
        </view>
        <button class="btn-secondary btn-sm" @click="onSubscribe">获取提醒</button>
      </view>
    </view>

    <view class="menu-list">
      <view class="menu-item">
        <text>每日提醒</text>
        <switch :checked="remindEnabled" color="#10b981" @change="onSwitch" />
      </view>
      <picker mode="time" :value="remindTime" @change="onTime">
        <view class="menu-item">
          <text>提醒时间</text>
          <text style="color: var(--color-text-secondary)">{{ remindTime }} ›</text>
        </view>
      </picker>
    </view>

    <view class="menu-list">
      <view class="menu-item" @click="goExercise">
        <text>动作库管理</text>
        <text class="menu-item__arrow">›</text>
      </view>
      <view class="menu-item" @click="goPlans">
        <text>训练计划</text>
        <text class="menu-item__arrow">›</text>
      </view>
      <view class="menu-item">
        <text>关于我们</text>
        <text class="menu-item__arrow">›</text>
      </view>
    </view>

    <view style="text-align: center; margin-top: 48rpx; font-size: 24rpx; color: var(--color-text-muted)">
      脊柱康复训练 v1.0
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '../../utils/request';
import { requestTrainSubscribe } from '../../utils/subscribe';
import { fetchAndSaveProfile, syncProfile } from '../../utils/profile';

const status = ref({});
const remindEnabled = ref(false);
const remindTime = ref('09:00');
const user = ref({});
const nickname = ref('');
const localAvatar = ref('');

const userName = computed(() => nickname.value || user.value.nickname || '微信用户');
const avatarText = computed(() => (userName.value[0] || '用').toUpperCase());
const displayAvatar = computed(() => localAvatar.value || user.value.avatarUrl || '');
const hasProfile = computed(() => !!(user.value.nickname && user.value.avatarUrl));

onShow(load);

async function load() {
  try {
    user.value = await fetchAndSaveProfile();
  } catch {
    user.value = uni.getStorageSync('user') || {};
  }
  nickname.value = user.value.nickname || '';
  localAvatar.value = '';
  status.value = await request({ url: '/user/subscribe-status' });
  remindEnabled.value = status.value.remindEnabled;
  remindTime.value = status.value.remindTime || '09:00';
}

async function onChooseAvatar(e) {
  const path = e.detail.avatarUrl;
  if (!path) return;
  localAvatar.value = path;
  await persistProfile();
}

function onNicknameInput(e) {
  nickname.value = e.detail.value?.trim() || '';
}

async function onNicknameBlur(e) {
  const value = e.detail.value?.trim() || '';
  if (value === (user.value.nickname || '')) return;
  nickname.value = value;
  await persistProfile();
}

async function onSyncProfile() {
  if (!nickname.value && !localAvatar.value && !user.value.avatarUrl) {
    uni.showToast({ title: '请先选择头像或填写昵称', icon: 'none' });
    return;
  }
  await persistProfile();
}

async function persistProfile() {
  uni.showLoading({ title: '保存中' });
  try {
    user.value = await syncProfile({
      nickname: nickname.value || undefined,
      avatarUrl: localAvatar.value || user.value.avatarUrl || undefined,
    });
    nickname.value = user.value.nickname || '';
    localAvatar.value = '';
  } catch {
    uni.showToast({ title: '资料同步失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
}

async function onSubscribe() {
  await requestTrainSubscribe();
  await load();
}

async function onSwitch(e) {
  remindEnabled.value = e.detail.value;
  await saveRemind();
}

async function onTime(e) {
  remindTime.value = e.detail.value;
  await saveRemind();
}

async function saveRemind() {
  if (remindEnabled.value && !status.value.subscribeQuota) {
    uni.showToast({ title: '请先订阅消息授权', icon: 'none' });
    return;
  }
  await request({
    url: '/user/remind',
    method: 'PUT',
    data: { enabled: remindEnabled.value, remindTime: remindTime.value },
  });
}

function goExercise() {
  uni.navigateTo({ url: '/pages/exercise/list' });
}

function goPlans() {
  uni.switchTab({ url: '/pages/plan/list' });
}
</script>
