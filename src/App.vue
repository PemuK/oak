<template>
  <DynamicFFA/>
  <DynamicNFA/>
  <DynamicBFA/>
  <FixAllocation/>
<!--  <FixAllocationNFA/>-->

  <el-button @click="allocate">测试</el-button>
</template>

<script setup lang="ts">
// import AppSelector from "@/components/AppSelector.vue";
// import AppShower from "@/components/AppShower.vue";
import {FfaAllocator} from "@/utils/Allocator-FFA";
import {NfaAllocator} from "@/utils/Allocator-NFA";
import {BfaAllocator} from "@/utils/Allocator-BFA";

import FixAllocation from "@/components/FixAllocation.vue";
import {useWorkerStore} from "@/stores/worker";
// import {useWorkerStore} from "@/stores/Worker-NFA";
// import MethodSelector from "@/components/MethodSelector.vue";
import DynamicFFA from "@/components/Dynamic-FFA.vue";
import DynamicNFA from "@/components/Dynamic-NFA.vue";
import DynamicBFA from "@/components/Dynamic-BFA.vue";
import {FfaAllocatorFixed} from "@/utils/Allocator-Fix-FFA";
import {generateRandomQueue} from "@/utils/util/generateRandomQueue";
import {useWorkerStoreNFA} from "@/stores/Worker-NFA";
import {useWorkerStoreBFA} from "@/stores/Worker-BFA";
import {useWorkerStoreFixFFA} from "@/stores/Worker-fix-FFA";
import FixAllocationNFA from "@/components/FixAllocation-NFA.vue";

const workers = useWorkerStore();
const workersNFA = useWorkerStoreNFA();
const workersBFA =useWorkerStoreBFA();
const workerFixFFA=useWorkerStoreFixFFA();
const ffaAllocation = new FfaAllocator(0);

const nfaAllocation = new NfaAllocator(0);
const bfaAllocator = new BfaAllocator(0);
const ffaAllocatorFixed = new FfaAllocatorFixed(0);
console.log("queue==>", workers.workQueue);

// mem.methods.releasePartition(6)

const apps = generateRandomQueue(500);

workers.generateRandomQueue(apps);
workersNFA.generateRandomQueue(apps);
workersBFA.generateRandomQueue(apps);
workerFixFFA.generateRandomQueue(apps);


const allocate = async () => {
  // 使用 Promise.all 并行执行两个异步操作
  await Promise.all([
    ffaAllocation.FFA(),  // 启动 FFA 分配
    nfaAllocation.NFA(),   // 启动 NFA 分配
    bfaAllocator.BFA(),
    ffaAllocatorFixed.FFA()
  ]);
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
  width: 300px;
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

.func-box-static{
  width: 250px;
  margin-top: 10px;
  margin-left: 10px;
  max-height: 190px;
  overflow: hidden;
  overflow-y: auto;
}
.func-box-static .header{
  font-size: 15px;
}
</style>
