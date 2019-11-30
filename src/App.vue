<template lang="pug">
  v-app(style='background: transparent;')
    v-content
      router-view(:profile='profile')
</template>

<script>
import { remote } from 'electron'

export default {
  name: 'App',
  data: () => ({
    profile: null,
  }),
  beforeCreate() {
    if (!localStorage.getItem('profiles')) {
      localStorage.setItem(
        'profiles',
        `{"default":{"name":"default","version":"${remote.app.getVersion()}","styleObj":{"color":"#ffffff","float":"right"}}}`
      )
    }
  },
  created() {
    this.profile = JSON.parse(localStorage.getItem('profiles'))[
      localStorage.getItem('lastUsed') || 'default'
    ]
  },
  beforeDestroy() {
    localStorage.setItem('lastUsed', this.profile.name)
  },
}
</script>

<style lang="scss">
::-webkit-scrollbar {
  display: none;
}
</style>
