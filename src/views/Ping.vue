<template lang="pug">
  span(:style='styleObj' ref='ping') {{ ping }}
</template>

<script>
import { ipcRenderer } from 'electron'
import { ping } from 'tcp-ping'

export default {
  name: 'ping',
  props: ['styleObj'],
  data: () => ({
    ping: 'initializing',
    intervalId: null,
  }),
  mounted() {
    this.handleWindow()
    addEventListener('load', this.handleWindow)
    this.intervalId = setInterval(
      () =>
        ping({ address: '8.8.8.8', port: 53, attempts: 1 }, (err, { avg }) => {
          this.ping = isNaN(avg) ? 'timeout' : (~~avg).toString()
        }),
      1000
    )
  },
  beforeDestroy() {
    clearInterval(this.intervalId)
  },
  methods: {
    handleWindow() {
      const { offsetWidth, offsetHeight } = this.$refs.ping
      ipcRenderer.send('set-window', { offsetWidth, offsetHeight })
    },
  },
}
</script>
