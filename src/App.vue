<template>
  <FixAllocation/>
  <DynamicAllocation/>
  <FixAllocation/>
  <DynamicAllocation/>

  <el-button @click="allocate">测试</el-button>
</template>

<script setup lang="ts">
// import AppSelector from "@/components/AppSelector.vue";
// import AppShower from "@/components/AppShower.vue";
import {MemoryAllocator} from "@/utils/allocate";
import FixAllocation from "@/components/FixAllocation.vue";
import {useFixedMem} from "@/stores/FixedMem";
import {useWorkerStore} from "@/stores/worker";
// import MethodSelector from "@/components/MethodSelector.vue";
import DynamicAllocation from "@/components/DynamicAllocation.vue";

const mem = useFixedMem();
const workers = useWorkerStore();
const allocation=new MemoryAllocator(0);

console.log("queue==>",workers.workQueue);

// mem.methods.releasePartition(6)

workers.generateRandomQueue(200);

const allocate = () => {
    allocation.FFA();
}
//
// const reset = () => {
//   for (let i = 0; i < 7; i++) {
//     mem.methods.releasePartition(i);
//   }
// }


</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 10px;
}

.func-box {
  width: 950px;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
}

.func-box-table {
  width: 350px;
  margin-top: 10px;
  margin-left: 10px;
  max-height: 190px;
  overflow: hidden;
  overflow-y: auto;
}

.header {
  display: flex;
  font-size: 14px;
  padding-bottom: 10px
}

.filter-section {
  display: flex;
  align-items: center;
}

.aside {
  margin-right: 200px;
}
</style>
