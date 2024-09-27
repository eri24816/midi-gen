<template>
  <div id="app">
    
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'App'
})
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #e0e0e0;
  background-color: #1e1e1e;
}

body {
  margin: 0;
  padding: 0;
  background-color: #1e1e1e;
  
}
*{
  box-sizing: border-box;
  min-height: 0;
}
h2 {
  margin: 5px;
}
</style>
