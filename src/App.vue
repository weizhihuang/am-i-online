<template lang="pug">
  v-app(style='background: transparent;')
    v-content
      router-view
</template>

<script>
export default {
  name: 'App',
}
</script>

<style lang="scss">
::-webkit-scrollbar {
  display: none;
}
</style>
