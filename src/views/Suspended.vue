<template lang="pug">
  span(:style='styleObj') suspended
</template>

<script>
export default {
  name: 'suspended',
  props: ['styleObj'],
}
</script>
