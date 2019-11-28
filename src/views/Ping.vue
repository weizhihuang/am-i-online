<template lang="pug">
  span(ref='ping') 5000
</template>

<script>
import { ipcRenderer } from 'electron'

export default {
  name: 'ping',
  mounted() {
    this.handleWindow()
  },
  methods: {
    handleWindow() {
      const { offsetWidth, offsetHeight } = this.$refs.ping
      ipcRenderer.send('set-ping-window', { offsetWidth, offsetHeight })
    },
  },
}
</script>
