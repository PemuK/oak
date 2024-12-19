import { defineStore } from "pinia";
import { ref, watchEffect } from "vue";
import { useWorkerStoreNFA } from "@/stores/Worker-NFA";
import worker from "@/types/worker";

export const useDynamicMem = defineStore(
    "dynamicMem-nfa",
    () => {
        const totalMemory = ref<number>(parseInt(localStorage.getItem('totalMemory-nfa') || '1000'));
        const partitions = ref(initializeDynamicPartitions());
        const lastAllocation = ref<number>(parseInt(localStorage.getItem('lastAllocation-nfa') || "0"));
        const workerStore = useWorkerStoreNFA();
        const success=ref(0);
        const total=ref(0);
        const splinter=ref(0);

        watchEffect(() => {
            localStorage.setItem('totalMemory-nfa', totalMemory.value.toString());
            localStorage.setItem('dynamicPartitions-nfa', JSON.stringify(partitions.value));
        });

        const updateTotalMemory = (newMemory: number) => {
            totalMemory.value = newMemory;
        };

        const listEmpPartitionByStart = (): any => {
            // 按 start 排序
            return partitions.value
                .filter(p => p.occupiedBy === null)  // 筛选未占用的分区
                .sort((a, b) => a.start - b.start);  // 返回空闲分区
        };

        const mergePartitions = () => {
            const emptyPartitions = partitions.value
                .filter(p => p.occupiedBy === null)
                .sort((a, b) => a.start - b.start);

            let i = 0;
            while (i < emptyPartitions.length - 1) {
                const currentPartition = emptyPartitions[i];
                const nextPartition = emptyPartitions[i + 1];

                // 如果当前分区的结束位置与下一个分区的开始位置相等，说明可以合并
                if (currentPartition.end === nextPartition.start) {
                    // 合并两个分区
                    currentPartition.end = nextPartition.end;
                    // 从 partitions 中删除下一个分区
                    partitions.value = partitions.value.filter(p => p !== nextPartition);
                    // 重新排序分区
                    partitions.value.sort((a, b) => a.start - b.start);
                    // 重新获取空白分区列表
                    emptyPartitions.length = 0;  // 清空缓存的空白分区列表
                    emptyPartitions.push(...partitions.value.filter(p => p.occupiedBy === null));
                    emptyPartitions.sort((a, b) => a.start - b.start);
                    i = 0;  // 从头开始检查
                } else {
                    i++;  // 移动到下一个分区
                }
            }
        };

        const splitPartition = (partitionStart: number, splitSize: number) => {
            const partitionIndex = partitions.value.findIndex(p => p.start === partitionStart);

            if (partitionIndex !== -1) {
                const partition = partitions.value[partitionIndex];

                if (splitSize > 0 && splitSize < (partition.end - partition.start)) {
                    partitions.value.splice(partitionIndex + 1, 0, {
                        start: partition.start + splitSize,
                        end: partition.end,
                        occupiedBy: null
                    });
                    partition.end = partition.start + splitSize;
                }
            }
        };

        const releasePartitionAfterTimeout = (partitionStart: number, app: worker) => {
            const partition = partitions.value.find(p => p.start === partitionStart);
            if (partition && partition.occupiedBy && partition.occupiedBy.id === app.id) {
                // 模拟任务运行结束后释放内存
                setTimeout(() => {
                    releasePartition(partition.start, partition.end);  // 释放该任务占用的内存区
                    workerStore.activeQueue = workerStore.activeQueue.filter((p: worker) => p.id !== app.id);
                    console.log(`任务 ${app.name} 完成，已释放内存分区==>`, workerStore.activeQueue);
                }, app.runTime * 1000);  // 假设 app.runTime 是任务运行的持续时间，单位是秒
            }
        };

        const occupyPartition = (partitionStart: number, app: worker): boolean => {
            const partition = partitions.value.find(p => p.start === partitionStart);
            if (partition && !partition.occupiedBy && partition.end - partition.start >= app.memorySize) {
                partition.occupiedBy = app;
                lastAllocation.value = partition.start;
                splitPartition(partition.start, app.memorySize);
                localStorage.setItem('dynamicPartitions-nfa', JSON.stringify(partitions.value));
                localStorage.setItem('lastAllocation-nfa', lastAllocation.value.toString());

                // 确保 workerStore.activeQueue 中没有重复的任务
                if (!workerStore.activeQueue.some((p: worker) => p.id === app.id)) {
                    workerStore.activeQueue.push(app);
                }

                // 从 workQueue 中移除任务
                workerStore.workQueue = workerStore.workQueue.filter((p: worker) => p.id !== app.id);

                console.log("workQueue==>", workerStore.workQueue);
                console.log("activeQueue==>", workerStore.activeQueue);

                releasePartitionAfterTimeout(partitionStart, app);
                return true;
            }
            return false;
        };

        const releasePartition = (start: number, end: number) => {
            const partition = partitions.value.find(p => p.start === start && p.end === end);
            if (partition) {
                partition.occupiedBy = null;
                mergePartitions();
            }
        };

        function initializeDynamicPartitions(): Array<{ start: number; end: number; occupiedBy: worker | null }> {
            const storedPartitions = JSON.parse(localStorage.getItem('dynamicPartitions-nfa') || '[]');
            if (!storedPartitions || storedPartitions.length === 0) {
                return [{ start: 0, end: 1000, occupiedBy: null }];
            }
            return storedPartitions;
        }

        return {
            totalMemory,
            partitions,
            lastAllocation,
            success,
            total,
            splinter,
            methods: {
                updateTotalMemory,
                mergePartitions,
                splitPartition,
                occupyPartition,
                releasePartition,
                listEmpPartitionByStart
            }
        };
    }
);
