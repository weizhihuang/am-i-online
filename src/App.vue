<template lang="pug">
  v-app(style='background: transparent;')
    v-content
      router-view(:styleObj='styleObj')
</template>

<script>
import { remote, ipcRenderer } from 'electron'
import { map } from 'lodash'
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
    const defaultProfile = `{"name":"default","version":"${version}","colorMode":"Color","colorUpdateRate":0.0002,"styleObj":{"float":"right"}}`
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

      if (colorMode !== 'None') {
        const { colorUpdateRate } = this.profile

        if (colorMode === 'Color') {
          this.intervalId = setInterval(() => {
            const avgColor = ipcRenderer.sendSync('get-avg-color')
            this.styleObj.color = `rgb(${map(avgColor, c => 255 - c)})`
          }, 1 / colorUpdateRate)
        } else if (colorMode === 'Light') {
          this.intervalId = setInterval(() => {
            const avgColor = ipcRenderer.sendSync('get-avg-color')
            const brightness = Math.sqrt(
              0.299 * Math.pow(avgColor[0], 2) +
                0.587 * Math.pow(avgColor[1], 2) +
                0.114 * Math.pow(avgColor[2], 2)
            )
            this.styleObj.color =
              brightness > 127.5
                ? this.profile.styleObj.lightColor
                : this.profile.styleObj.darkColor
          }, 1 / colorUpdateRate)
        }
      }
    })
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
