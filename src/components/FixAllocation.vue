<template>
  <div id="group">
    <el-card class="func-box">
      <div class="header">
        固定分区
      </div>
      <div class="memory-container">
        <div
            v-for="partition in partitions"
            :key="partition.id"
        class="memory-block"
        :style="{ width: partition.width + '%', backgroundColor: 'rgba(129,129,129,0.3)' }"
        >
        <div class="abs size">{{ totalSize(partition.id) }}kb</div>
        <div
            v-if="partition.occupiedBy"
            class="occupiedBy"
            :style="{
          width: occupiedWidth(partition.id) + '%',
          backgroundColor: partition.occupiedBy.color
        }"
        >
            <span class="pppp">
              {{ partition.occupiedBy.name }}占用
            </span>
        </div>
      </div>
  </div>
  </el-card>
  <el-card class="func-box-table">
    <el-table
        :data="nullPartitions"
        class="table"
    >
      <el-table-column prop="id" label="分区ID"/>
      <el-table-column prop="size" label="大小"/>
    </el-table>
  </el-card>
    <el-card class="func-box-table">
      <div class="header">
        活动队列，当前任务数{{workers.activeQueue.length}}个
      </div>
      <el-table
          :data="workers.activeQueue"
          class="table"
      >
        <el-table-column prop="name" label="名称"/>
        <el-table-column prop="memorySize" label="占用内存"/>
        <el-table-column prop="runTime" label="运行时间"/>
      </el-table>
    </el-card>
    <el-card class="func-box-table">
      <div class="header">
        就绪队列，当前等待数{{workers.workQueue.length}}个
      </div>
      <el-table
          :data="workers.workQueue"
          class="table"
      >
        <el-table-column prop="name" label="名称"/>
        <el-table-column prop="memorySize" label="占用内存"/>
        <el-table-column prop="runTime" label="运行时间"/>
      </el-table>
    </el-card>

    <el-card class="func-box-table">
      <div class="header">
        阻塞队列，当前阻塞数{{workers.clogQueue.length}}个
      </div>
      <el-table
          :data="workers.clogQueue"
          class="table"
      >
        <el-table-column prop="name" label="名称"/>
        <el-table-column prop="memorySize" label="占用内存"/>
        <el-table-column prop="runTime" label="运行时间"/>
      </el-table>
    </el-card>
    <el-card class="func-box-static">
<!--      <div class="header">-->
<!--        产生碎片次数 {{ mem.splinter }}-->
<!--      </div>-->
      <div class="header">
        分配成功率{{ ((mem.success / mem.total) * 100).toFixed(2) }}%
      </div>
      <div class="header">
        内存利用率 {{ memoryUsage }} %
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
import { useWorkerStoreFixFFA } from "@/stores/Worker-fix-FFA";
import {useFixedMem} from "@/stores/FixedMem";

// 动态切换 Pinia 状态
const dynamicMem = useFixedMem(); // 初始绑定到固定分区
const partitions = ref([]);
const workers=useWorkerStoreFixFFA()
const mem = ref(dynamicMem);

console.log("dynamicMemNFA=========================>", mem.value.partitions);

// 动态监听 mem.value 和 mem.value.partitions 的变化
watchEffect(() => {
  if (!mem.value || !mem.value.partitions || mem.value.partitions.length === 0) {
    partitions.value = [];
    return;
  }
  console.log("dynamicMemNFA==>", mem.value.partitions);

  // 重新计算每个分区的宽度
  partitions.value = mem.value.partitions.map((partition) => ({
    ...partition,
    width: ((partition.size) / mem.value.totalMemory) * 100,
  }));
  console.log("dynamic更新后的分区数据:", partitions.value);
});

// 计算每个分区的总大小（累加到当前分区）
const totalSize = (partitionId: number) => {
  return partitions.value
      .filter(part => part.id <= partitionId)
      .reduce((acc, part) => acc + part.size, 0);
};

// 计算每个分区占用的宽度
const occupiedWidth = (partitionId: number) => {
  const partition = partitions.value.find(part => part.id === partitionId);
  if (partition && partition.occupiedBy) {
    console.log("width=>", partition.occupiedBy.memorySize / partition.size * 100);  // 计算占用宽度
    return (partition.occupiedBy.memorySize / partition.size) * 100; // 计算占用宽度
  }
  return 0; // 如果没有找到 partition 或 occupiedBy，返回 0
};

const nullPartitions = computed(() => {
  return partitions.value.filter(p => p.occupiedBy === null);
});

// 计算内存利用率
const memoryUsage = computed(() => {
  const totalMemory = partitions.value.reduce((acc, partition) => acc + (partition.end - partition.start), 0);
  const usedMemory = partitions.value.reduce((acc, partition) => {
    return acc + (partition.occupiedBy ? (partition.end - partition.start) : 0);
  }, 0);
  return totalMemory > 0 ? ((usedMemory / totalMemory) * 100).toFixed(2) : '0';
});
</script>

<style scoped>
.memory-container {
  display: flex;
  width: 900px;
  height: 100px;
  border: 1px solid #ccc;
  user-select: none;
  background-color: rgba(234, 234, 234, 0.3);
}

.memory-block {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #0b275a;
  color: #333;
}

.memory-block:last-child {
  border-right: none;
}

.abs {
  font-size: 10px;
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: 58px;
  transform: translate(-50%, -50%);
  z-index: 1;
}

.pat {
  color: #090909;
}

.occupiedBy {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  color: #e6e6e6;
  display: flex;
  font-size: 13px;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0);
  border: none;
  z-index: 0;
  transition: width 0.3s ease-in-out;
}

#selector button {
  margin-top: 20px;
  margin-right: 10px;
}

.size {
  margin-top: 60px;
  margin-left: 50%;
}

#group {
  display: flex;
  justify-content: flex-start;
}

.table{
  min-height: 200px;
}

.func-box-table{
  min-height: 200px;
  overflow: hidden;
  overflow-y: auto;
}
</style>
