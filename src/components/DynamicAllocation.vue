<template>
  <div id="group">
    <el-card class="func-box">
      <div class="header">
        动态分区
      </div>
      <div class="memory-container">
        <div
            v-for="partition in partitions"
            :key="partition.start"
            class="memory-block"
            :style="{ width: partition.width + '%', backgroundColor: partition.occupiedBy ? '#f88' : 'rgba(129,129,129,0.3)' }"
        >
          <!--      <div class="abs pat">(分区{{ partition.id }})</div>-->
          <div class="abs size">{{ totalSize(partition.start) }}kb</div>
          <div
              v-if="partition.occupiedBy"
              class="occupiedBy"
              :style="{
          width: occupiedWidth(partition.start) + '%',
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
          :row-key="getRowKeys"
          :expand-row-keys="expands"
          v-loading="tableLoading"
          @expand-change="handleExpandChange"
      >
        <el-table-column prop="start" label="起始地址"/>
        <el-table-column prop="end" label="终止地址"/>
        <el-table-column prop="size" label="大小"/>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {computed, ref, watchEffect} from "vue";
import {useWorkerStore} from "@/stores/worker";
import {useDynamicMem} from "@/stores/DynamicMem";
import worker from "@/types/worker";

// 动态切换 Pinia 状态
const dynamicMem = useDynamicMem(); // 初始绑定到固定分区
const partitions = ref([]);
const mem = ref(dynamicMem);


console.log("dynamicMem==>", mem.value.partitions);
const workers = useWorkerStore();


// 动态监听 mem.value 和 mem.value.partitions 的变化
watchEffect(() => {
  if (!mem.value || !mem.value.partitions || mem.value.partitions.length === 0) {
    partitions.value = [];
    return;
  }

  // 重新计算每个分区的宽度
  partitions.value = mem.value.partitions.map((partition) => ({
    ...partition,
    width: ((partition.end - partition.start) / mem.value.totalMemory) * 100,
  }));
  console.log("dynamic更新后的分区数据:", partitions.value);
});

// 计算每个分区的总大小（累加到当前分区）
const totalSize = (partitionStart: number) => {
  return partitions.value
      .filter(part => part.start <= partitionStart)
      .reduce((acc, part) => acc + (part.end - part.start), 0);
};

// 计算每个分区占用的宽度
const occupiedWidth = (partitionStart: number) => {
  const partition = partitions.value.find(part => part.start === partitionStart);
  if (partition && partition.occupiedBy) {
    console.log("width=>", partition.occupiedBy.memorySize / partition.size * 100);  // 计算占用宽度
    return (partition.occupiedBy.memorySize / (partition.end - partition.start)) * 100; // 计算占用宽度
  }
  return 0; // 如果没有找到 partition 或 occupiedBy，返回 0
};

const nullPartitions = computed(() => {
  return partitions.value.filter(p => p.occupiedBy === null);
});

// 假设占用分区操作
// mem.value.methods.occupyPartition(0, workers.workers[0]);
// mem.value.methods.occupyPartition(40, workers.workers[4]);
// mem.value.methods.occupyPartition(190, workers.workers[2]);


// mem.value.methods.releasePartition(350,400);
// 释放分区操作
// mem.value.methods.releasePartition(3);
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
</style>
