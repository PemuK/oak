import { defineStore } from "pinia";
import { ref, watchEffect } from "vue";
import { generateRandomColor } from "@/utils/RandomColor";
import worker from "@/types/worker";
import { ElMessage } from 'element-plus';

export const useFixedMem = defineStore("fixedMem", () => {
    // 从 localStorage 获取数据并解析，如果没有则使用默认值
    const totalMemory = ref<number>(parseInt(localStorage.getItem("totalMemory") || "1000"));
    const partitions = ref(initializeFixedPartitions());
    const lastAllocation = ref<number>(parseInt(localStorage.getItem('lastAllocation') || "0"));

    // 监听 state 变化，更新 localStorage 中的数据
    watchEffect(() => {
        localStorage.setItem("totalMemory", totalMemory.value.toString()); // 将 totalMemory 存入 localStorage
        savePartitions(partitions.value); // 将 fixedPartitions 存入 localStorage
    });

    // 更新总内存大小的方法
    const updateTotalMemory = (newMemory: number) => {
        totalMemory.value = newMemory;
    };

    // 更新某个分区大小的方法
    const updatePartitionSize = (partitionId: number, newSize: number) => {
        const partition = partitions.value.find((p) => p.id === partitionId);
        if (partition) {
            partition.size = newSize;
        }
    };

    // 添加新分区的方法
    const addPartition = (newPartition: { id: number; size: number; occupiedBy: worker | null }) => {
        partitions.value.push(newPartition);
    };

    // 删除分区的方法
    const removePartition = (partitionId: number) => {
        partitions.value = partitions.value.filter((p) => p.id !== partitionId);
    };

    // 合并两个相邻分区的方法
    const mergePartitions = (firstPartitionId: number, secondPartitionId: number) => {
        const firstIndex = partitions.value.findIndex((p) => p.id === firstPartitionId);
        const secondIndex = partitions.value.findIndex((p) => p.id === secondPartitionId);

        // 确保两个分区是相邻的
        if (firstIndex !== -1 && secondIndex !== -1 && Math.abs(firstIndex - secondIndex) === 1) {
            const firstPartition = partitions.value[firstIndex];
            const secondPartition = partitions.value[secondIndex];

            // 合并分区大小
            firstPartition.size += secondPartition.size;
            firstPartition.occupiedBy = null; // 合并后释放占用状态

            // 删除第二个分区
            partitions.value.splice(secondIndex, 1);
        }
    };

    // 切割分区的方法
    const splitPartition = (partitionId: number, splitSize: number) => {
        const partitionIndex = partitions.value.findIndex((p) => p.id === partitionId);

        if (partitionIndex !== -1) {
            const partition = partitions.value[partitionIndex];

            // 确保切割大小合法
            if (splitSize > 0 && splitSize < partition.size) {
                const newPartitionId = Math.max(...partitions.value.map(p => p.id)) + 1; // 确保 ID 唯一

                // 原分区更新大小
                partition.size -= splitSize;

                // 添加新分区
                partitions.value.splice(partitionIndex + 1, 0, {
                    id: newPartitionId,
                    size: splitSize,
                    occupiedBy: null, // 新分区默认未被占用
                });
            }
        }
    };

    // 更新后的 occupyPartition 方法
    const occupyPartition = (partitionId: number, app: worker):boolean => {
        const partition = partitions.value.find((p) => p.id === partitionId);

        if (partition && !partition.occupiedBy) {
            if (partition.size < app.memorySize) {
                ElMessage.warning("该分区内存空间不足");
                return false;
            }
            partition.occupiedBy = app; // 记录占用该分区的应用
            lastAllocation.value = partition.id;
            localStorage.setItem('lastAllocation', lastAllocation.value.toString()); // 同步到 localStorage
            releasePartitionAfterTimeout(partitionId,app)
        }
        return true; // 返回对应的颜色
    };

    const releasePartitionAfterTimeout = (partitionId: number, app: worker) => {
        const partition = partitions.value.find(p => p.id === partitionId);
        if (partition && partition.occupiedBy && partition.occupiedBy.id === app.id) {
            // 模拟任务运行结束后释放内存
            setTimeout(() => {
                releasePartition(partition.id);  // 释放该任务占用的内存区
                console.log(`任务 ${app.name} 完成，已释放内存分区`);
            }, app.runTime * 1000);  // 假设 app.runTime 是任务运行的持续时间，单位是秒
        }
    };

    // 释放分区的方法
    const releasePartition = (partitionId: number) => {
        const partition = partitions.value.find((p) => p.id === partitionId);
        if (partition) {
            partition.occupiedBy = null; // 清空占用状态
        }
    };


    // 定义初始化逻辑的函数
    function initializeFixedPartitions(): Array<{ id: number; size: number; occupiedBy: worker | null }> {
        // 从 localStorage 获取数据
        const storedPartitions = JSON.parse(localStorage.getItem("fixedPartitions") || "null");

        // 如果本地存储中没有数据，返回默认值
        if (!storedPartitions) {
            const defaultPartitions = [
                { id: 1, start: 0, end: 99, size: 100, occupiedBy: null },
                { id: 2, start: 100, end: 199, size: 100, occupiedBy: null },
                { id: 3, start: 200, end: 349, size: 150, occupiedBy: null },
                { id: 4, start: 350, end: 549, size: 200, occupiedBy: null },
                { id: 5, start: 550, end: 749, size: 200, occupiedBy: null },
                { id: 6, start: 750, end: 999, size: 250, occupiedBy: null },
            ];
            // 将默认值存储到 localStorage
            localStorage.setItem("fixedPartitions", JSON.stringify(defaultPartitions));
            return defaultPartitions;
        }

        // 如果有存储数据，返回解析后的数据
        return storedPartitions;
    }

    // 保存 colorMap 到 localStorage
    function saveColorMap(colorMap: Map<number, string>) {
        localStorage.setItem("colorMap", JSON.stringify(Array.from(colorMap.entries())));
    }

    // 保存 partitions 到 localStorage
    function savePartitions(partitions: Array<{ id: number; size: number; occupiedBy: worker | null }>) {
        localStorage.setItem("fixedPartitions", JSON.stringify(partitions));
    }

    // 返回封装好的数据和方法
    return {
        totalMemory,
        partitions,
        lastAllocation,
        methods: {
            updateTotalMemory,
            updatePartitionSize,
            addPartition,
            removePartition,
            mergePartitions,
            splitPartition,
            occupyPartition,
            releasePartition,
        },
    };
});
