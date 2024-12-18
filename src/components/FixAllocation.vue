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
            :style="{ width: partition.width + '%', backgroundColor: partition.occupied ? '#f88' : 'rgba(129,129,129,0.3)' }"
        >
          <div class="abs pat">(分区{{ partition.id }})</div>
          <div class="abs size">{{ totalSize(partition.id) }}kb</div>
          <div
              v-if="partition.occupiedBy"
              class="occupiedBy"
              :style="{
          width: partition.occupiedBy ?occupiedWidth(partition.id) + '%':'0',
          backgroundColor: partition.occupiedBy.color
        }"
          >
        <span class="pppp">
          {{ partition.occupiedBy.name }}占用
        </span>
          </div>
          <!--      <span>she</span>-->
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
          class="table"
      >
        <el-table-column prop="start" label="起始地址"/>
        <el-table-column prop="end" label="终止地址"/>
        <el-table-column prop="size" label="大小"/>
      </el-table>
    </el-card>
  </div>

</template>

<script setup lang="ts">
import {useFixedMem} from "@/stores/FixedMem";
import {computed, ref, watchEffect} from "vue";
import {useWorkerStore} from "@/stores/worker";

// 动态切换 Pinia 状态
const fixMem = useFixedMem(); // 初始绑定到固定分区
const partitions = ref();
const mem = ref(fixMem);
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
    width: (partition.size / mem.value.totalMemory) * 100,
  }));
  console.log("更新后的分区数据:", partitions.value);
});

// 计算每个分区的总大小（累加到当前分区）。
const totalSize = (partitionId) => {
  return partitions.value
      .filter(part => part.id <= partitionId)
      .reduce((acc, part) => acc + part.size, 0);
};

const occupiedWidth = (partitionId) => {
  const partition = partitions.value.find(part => part.id === partitionId);  // 使用 find 获取单个对象
  if (partition && partition.occupiedBy) {  // 确保 partition 和 occupiedBy 存在

    console.log("width=>", partition.occupiedBy.memorySize / partition.total * 100)  // 计算占用宽度
    return (partition.occupiedBy.memorySize / partition.size) * 100;  // 计算占用宽度
  }
  return 0;  // 如果没有找到 partition 或 occupiedBy，返回 0
};


// console.log(workers.workers[0]);

// mem.value.methods.occupyPartition(1,)

// mem.value.methods.releasePartition(6)

// console.log("color-map-fixed==>", mem.value.colorMap);

const nullPartitions = computed(() => {
  return partitions.value.filter(p => p.occupiedBy === null);
});

</script>

<style scoped>
.memory-container {
  display: flex;
  width: 900px;
  height: 100px;
  border: 1px solid #ccc;
  user-select: none;
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
  right: 0; /* 确保覆盖整个容器 */
  color: #e6e6e6;
  display: flex;
  font-size: 13px;
  align-items: center;
  justify-content: center; /* 使文本在水平方向上居中 */
  background-color: rgba(0, 0, 0, 0); /* 使背景透明 */
  border: none; /* 移除边框 */
  z-index: 0; /* 确保在其他元素之上 */
  transition: width 0.3s;
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
</style>
