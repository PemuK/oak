<template>
  <div class="box">
    <el-button @click="clickToAllocate"></el-button>
    <el-button @click="selectDynamic">动态分区</el-button>
  </div>

</template>

<script setup lang="ts">
import { defineEmits } from 'vue';
const emit = defineEmits(['selectMethod']);

const selectFix=()=>{
  emit("selectMethod","fix");
}

const selectDynamic=()=>{
  emit("selectMethod","dynamic");
}

</script>

<style scoped>
.box{
  margin-top: 1vh;
}
</style>