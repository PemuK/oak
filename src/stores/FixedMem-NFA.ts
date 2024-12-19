import { defineStore } from "pinia";
import { ref, watchEffect } from "vue";
import worker from "@/types/worker";
import {useWorkerStoreFixNFA} from "@/stores/Worker-fix-NFA";

export const useFixedMem = defineStore("fixedMem", () => {
    // 从 localStorage 获取数据并解析，如果没有则使用默认值
    const totalMemory = ref<number>(parseInt(localStorage.getItem("totalMemory-fixed") || "1000"));
    const partitions = ref(initializeFixedPartitions());
    const lastAllocation = ref<number>(parseInt(localStorage.getItem('lastAllocation-fixed') || "0"));
    const workerStore = useWorkerStoreFixNFA();


    // 监听 state 变化，更新 localStorage 中的数据
    watchEffect(() => {
        localStorage.setItem("totalMemory-fixed", totalMemory.value.toString()); // 将 totalMemory 存入 localStorage
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
                return false;
            }
            partition.occupiedBy = app; // 记录占用该分区的应用
            lastAllocation.value = partition.id;
            localStorage.setItem('fixedPartitions-fixed', JSON.stringify(partitions.value));
            localStorage.setItem('lastAllocation-fixed', lastAllocation.value.toString()); // 同步到 localStorage

            if (!workerStore.activeQueue.some((p: worker) => p.id === app.id)) {
                workerStore.activeQueue.push(app);
            }

            // 从 workQueue 中移除任务
            workerStore.workQueue = workerStore.workQueue.filter((p: worker) => p.id !== app.id);

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
                workerStore.activeQueue = workerStore.activeQueue.filter((p: worker) => p.id !== app.id);
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
        const storedPartitions = JSON.parse(localStorage.getItem("fixedPartitions-fixed") || "null");

        // 如果本地存储中没有数据，返回默认值
        if (!storedPartitions) {
            // 生成默认分区数据，确保所有分区的 end 最大为 1000
            const defaultPartitions = [
                // 前 20 个大小为 10 的分区
                ...Array.from({ length: 20 }, (_, i) => ({
                    id: i + 1,
                    start: i * 10,
                    end: Math.min((i + 1) * 10 - 1, 999), // 确保 end 不超过 1000
                    size: 10,
                    occupiedBy: null,
                })),

                // 接下来的 20 个大小为 30 的分区
                ...Array.from({ length: 20 }, (_, i) => ({
                    id: i + 21,
                    start: (i + 20) * 30,
                    end: Math.min((i + 21) * 30 - 1, 999), // 确保 end 不超过 1000
                    size: 30,
                    occupiedBy: null,
                })),

                // 剩下的大分区，确保 total end 不超过 1000
                {
                    id: 41,
                    start: 600,
                    end: Math.min(899, 999), // 确保 end 不超过 1000
                    size: 200,
                    occupiedBy: null,
                },
                {
                    id: 42,
                    start: 800,
                    end: Math.min(1399, 999), // 确保 end 不超过 1000
                    size: 200,
                    occupiedBy: null,
                },
            ];

            // 将默认值存储到 localStorage
            localStorage.setItem("fixedPartitions-fixed", JSON.stringify(defaultPartitions));

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
        localStorage.setItem("fixedPartitions-fixed", JSON.stringify(partitions));
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
