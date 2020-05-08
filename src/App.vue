<template lang="pug">
  v-app(style='background: transparent;')
    v-content
      router-view(:styleObj='styleObj')
</template>

<script>
import { remote, ipcRenderer } from 'electron'
import { gt } from 'semver'

export default {
  name: 'App',
  data: () => ({
    profile: null,
    styleObj: null,
    intervalId: null,
  }),
  beforeCreate() {
    const version = remote.app.getVersion()
    const defaultProfile = `{"name":"default","version":"${version}","colorMode":"Light","colorWhenBright":"#000","colorWhenDark":"#fff","colorUpdateRate":2,"styleObj":{"float":"right"}}`
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

      if (colorMode === 'Light') {
        ipcRenderer.on('reply-avg-color', (_, avgColor) => {
          // http://alienryderflex.com/hsp.html
          const brightness = Math.sqrt(
            0.299 * Math.pow(avgColor[0], 2) +
              0.587 * Math.pow(avgColor[1], 2) +
              0.114 * Math.pow(avgColor[2], 2)
          )
          this.styleObj.color =
            brightness > 127.5
              ? this.profile.colorWhenBright
              : this.profile.colorWhenDark
        })
        this.intervalId = setInterval(() => {
          ipcRenderer.send('get-avg-color')
        }, 1000 / this.profile.colorUpdateRate)
      }
    })

    ipcRenderer.on('suspend', () => this.$router.push('/suspended'))

    ipcRenderer.on('resume', () => this.$router.push('/'))
  },
  beforeDestroy() {
    clearInterval(this.intervalId)
    localStorage.setItem('lastUsed', this.profile.name)
  },
}
</script>

<style lang="scss">
::-webkit-scrollbar {
  display: none;
}
</style>
