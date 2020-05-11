<template lang="pug">
  v-app(style='background: transparent;')
    v-content
      router-view(:styleObj='styleObj')
</template>

<script>
import { remote, ipcRenderer } from 'electron'
import { gt } from 'semver'
import { reduce, inRange } from 'lodash'

export default {
  name: 'App',
  data: () => ({
    profile: null,
    styleObj: null,
    intervalId: null,
    suspend: false,
  }),
  beforeCreate() {
    const version = remote.app.getVersion()
    const defaultProfile = `{"name":"default","version":"${version}","colorMode":"Brightness","colorWhenBright":"#000","colorWhenDark":"#fff","colorUpdateRate":2,"styleObj":{"float":"right"}}`
    const profiles = JSON.parse(localStorage.getItem('profiles'))
    if (!profiles) {
      localStorage.setItem('profiles', `{"default":${defaultProfile}}`)
    } else if (gt(version, profiles.default.version)) {
      profiles.default = JSON.parse(defaultProfile)
      localStorage.setItem('profiles', JSON.stringify(profiles))
    }
  },
  created() {
    this.profile = JSON.parse(localStorage.getItem('profiles'))[
      localStorage.getItem('lastUsed') || 'default'
    ]
    this.styleObj = this.profile.styleObj

    ipcRenderer.on('window-is-ready', () => {
      const { colorMode } = this.profile

      if (colorMode === 'Brightness') {
        ipcRenderer.on('reply-avg-color', (_, avgColor) => {
          // http://alienryderflex.com/hsp.html
          const brightness = Math.sqrt(
            reduce(
              [0.299, 0.587, 0.114],
              (result, value, key) =>
                result + value * Math.pow(avgColor[key], 2),
              0
            )
          )
          if (!inRange(brightness, 112, 144))
            this.styleObj.color =
              brightness > 128
                ? this.profile.colorWhenBright
                : this.profile.colorWhenDark
        })
        this.intervalId = setInterval(() => {
          if (!this.suspend) ipcRenderer.send('get-avg-color')
        }, 1000 / this.profile.colorUpdateRate)
      }
    })

    ipcRenderer.on('suspend', () => (this.suspend = true))

    ipcRenderer.on('resume', () => (this.suspend = false))
  },
  beforeDestroy() {
    clearInterval(this.intervalId)
    localStorage.setItem('lastUsed', this.profile.name)
  },
  watch: {
    suspend(val) {
      if (val) this.$router.push('/suspended')
      else this.$router.push('/')
    },
  },
}
</script>

<style lang="scss">
::-webkit-scrollbar {
  display: none;
}
</style>
