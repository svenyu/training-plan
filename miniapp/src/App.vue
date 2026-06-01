<script setup>
import { onLaunch } from '@dcloudio/uni-app';

onLaunch(() => {
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.reLaunch({ url: '/pages/login/index' });
  }
});
</script>

<style lang="scss">
@use './styles/theme';
@use './styles/common';
</style>
