<template>
  <view class="page-bg">
    <image class="bg-image" src="/static/imgs/bg.png" mode="aspectFill" />
  </view>
  <view class="page-wrap">
    <view class="form-section">
      <view class="form-section__title">基本信息</view>
      <view class="form-field">
        <text class="form-field__label">动作名称</text>
        <input v-model="form.name" placeholder="如：猫式伸展" />
      </view>
      <view class="form-field">
        <text class="form-field__label">分类</text>
        <picker :range="catLabels" @change="onCatChange">
          <view class="picker-value">{{ catLabels[catIndex] }}</view>
        </picker>
      </view>
    </view>

    <view class="form-section">
      <view class="form-section__title">动作说明</view>
      <view class="form-field">
        <text class="form-field__label">要点 / 呼吸 / 禁忌（脊柱侧弯注意事项）</text>
        <textarea
          v-model="form.description"
          placeholder="描述动作要点、呼吸节奏与禁忌事项"
          :maxlength="2000"
        />
      </view>
    </view>

    <view class="form-section">
      <view class="form-section__title">示范视频</view>
      <view
        class="video-upload"
        :class="{ 'video-upload--done': form.videoUrl }"
        @click="pickVideo"
      >
        <template v-if="form.videoUrl">
          <video :src="form.videoUrl" controls />
          <view class="video-upload__replace">点击更换视频</view>
        </template>
        <template v-else>
          <text style="font-size: 48rpx">📹</text>
          <view style="margin-top: 16rpx">点击上传 mp4 示范视频</view>
        </template>
      </view>
    </view>

    <view class="form-section">
      <view class="form-field card-row">
        <view>
          <text class="form-field__label" style="margin-bottom: 0">启用状态</text>
          <view style="font-size: 24rpx; color: var(--color-text-muted); margin-top: 8rpx">
            停用后不会出现在计划选择中
          </view>
        </view>
        <switch :checked="form.status === 1" color="#10b981" @change="onStatusChange" />
      </view>
    </view>

    <button class="btn-primary btn-block" style="margin-top: 16rpx" @click="save">保存</button>
    <button v-if="id" class="btn-ghost btn-block btn-delete" @click="remove">删除动作</button>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request } from '../../utils/request';
import { uploadVideo } from '../../utils/upload';

const cats = ['warmup', 'main', 'stretch', 'other'];
const catLabels = ['热身', '主训', '拉伸', '其他'];
const catIndex = ref(1);
const id = ref('');
const form = ref({ name: '', category: 'main', description: '', videoUrl: '', status: 1 });

onLoad(async (q) => {
  if (q.id) {
    id.value = q.id;
    const e = await request({ url: `/exercises/${q.id}` });
    form.value = {
      name: e.name,
      category: e.category,
      description: e.description || '',
      videoUrl: e.videoUrl || '',
      status: e.status ?? 1,
    };
    catIndex.value = Math.max(0, cats.indexOf(e.category));
  }
});

function onCatChange(e) {
  catIndex.value = Number(e.detail.value);
  form.value.category = cats[catIndex.value];
}

function onStatusChange(e) {
  form.value.status = e.detail.value ? 1 : 0;
}

async function pickVideo() {
  try {
    form.value.videoUrl = await uploadVideo();
    uni.showToast({ title: '上传成功' });
  } catch (e) {
    const msg = e?.errMsg || e?.message || '';
    if (String(msg).includes('cancel')) return;
    uni.showToast({ title: '上传失败', icon: 'none' });
  }
}

function buildPayload() {
  return {
    name: form.value.name,
    category: form.value.category,
    description: form.value.description || undefined,
    videoUrl: form.value.videoUrl || undefined,
    status: form.value.status,
  };
}

async function save() {
  if (!form.value.name) {
    uni.showToast({ title: '请填写名称', icon: 'none' });
    return;
  }
  const data = buildPayload();
  if (id.value) {
    await request({
      url: `/exercises/${id.value}`,
      method: 'PUT',
      data,
    });
  } else {
    await request({ url: '/exercises', method: 'POST', data });
  }
  uni.navigateBack();
}

function remove() {
  uni.showModal({
    title: '确认删除',
    content: `确定删除动作「${form.value.name || '未命名'}」？`,
    success: async (res) => {
      if (!res.confirm) return;
      await request({ url: `/exercises/${id.value}`, method: 'DELETE' });
      uni.showToast({ title: '已删除', icon: 'success' });
      uni.navigateBack();
    },
  });
}
</script>

<style scoped lang="scss">
.btn-delete {
  margin-top: 24rpx;
  color: #ef4444 !important;
  border-color: rgba(239, 68, 68, 0.35) !important;
}
</style>
