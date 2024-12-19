import { useDynamicMem } from "@/stores/DynamicMem-NFA";
import Worker from "@/types/worker";
import { watch } from "vue";
import { useWorkerStoreNFA } from "@/stores/Worker-NFA";

// 创建 MemoryAllocator 类
class NfaAllocator {
    private mem;
    private queue;

    constructor(type: number) {
        // 初始化内存管理方式和工作队列
        this.mem = useDynamicMem();
        this.queue = useWorkerStoreNFA();

        // 监视队列的变化
        watch(
            () => this.queue.activeQueue,
            (newVal: Worker[], oldVal: Worker[]) => {
                // 确保队列的有效性
                if (!this.queue.clogQueue || !this.queue.workQueue) {
                    console.error("clogQueue or workQueue is undefined");
                    return;
                }

                // 检查 activeQueue 中是否有相同的任务
                const taskIds = new Set();
                const duplicateTasks = [];

                for (const worker of newVal) {
                    if (taskIds.has(worker.id)) {
                        // 记录重复的任务
                        duplicateTasks.push(worker);
                    } else {
                        taskIds.add(worker.id);
                    }
                }

                // 如果存在重复的任务，打印信息
                if (duplicateTasks.length > 0) {
                    console.log("+++++++++++++++++++++++++++++++++++++++++++Duplicate tasks in activeQueue:", duplicateTasks);
                }
                // 获取空闲的内存分区
                const emptyPartitions = this.mem.methods.listEmpPartitionByStart();

                // 判断队列减少的情况
                if (newVal.length < oldVal.length) {
                    if (this.queue.clogQueue.length > 0) {
                        console.log("Less workers in the queue:", newVal);

                        for (const partition of emptyPartitions) {
                            // 筛选出符合条件的 workers
                            const eligibleWorkers = this.queue.clogQueue.filter(worker =>
                                partition.end - partition.start >= worker.memorySize
                            );

                            // 如果有符合条件的 workers
                            if (eligibleWorkers.length > 0) {
                                // 只处理队首的 worker
                                const workerToAdd = eligibleWorkers[0];

                                // 移除已分配的 worker
                                this.queue.clogQueue = this.queue.clogQueue.filter(worker =>
                                    worker.id !== workerToAdd.id
                                );

                                // 将队首的 worker 加入到 workQueue
                                if (!this.queue.workQueue.some(p => p.id === workerToAdd.id)) {
                                    console.log(`Adding worker ${workerToAdd.id} to workQueue`);
                                    this.queue.workQueue.push(workerToAdd);
                                }

                                // 如果只处理一个 worker，可以跳出循环，避免处理其他 workers
                                break;
                            }
                        }

                        // 执行内存分配等操作
                        console.log("Memory allocation completed.");
                    }
                }
            },
            { deep: true }
        );
    }



    public async NFA(): Promise<boolean> {
        // 用来模拟任务分配的延迟
        while (this.queue.workQueue.length > 0 || this.queue.clogQueue.length > 0) {
            // 遍历工作队列中的任务
            for (const worker of this.queue.workQueue) {
                // 模拟延迟，延迟时间为任务的 `enterTime`
                await this.delay(worker.enterTime);

                // 获取所有空闲内存分区
                const emptyPartitions = this.mem.methods.listEmpPartitionByStart();
                let partitionAssigned = false; // 标记任务是否成功分配

                // 使用上一次分配的起始位置来优化分配路径
                const lastAlloc = this.mem.lastAllocation;

                // 如果 lastAllocation 存在，尝试从上次分配的位置开始分配
                let startIdx = 0;
                if (lastAlloc !== undefined) {
                    startIdx = emptyPartitions.findIndex((p: any) => p.start >= lastAlloc);
                }

                // 尝试将任务分配到内存分区（NFA模拟多路径分配）
                // 第一次尝试：从上次分配的地方开始
                for (let i = startIdx; i < emptyPartitions.length; i++) {
                    const partition = emptyPartitions[i];
                    if(partition && partition.end !== undefined &&partition.end - partition.start<10){
                        this.mem.splinter++;
                    }
                    if (partition && partition.end !== undefined && partition.end - partition.start >= worker.memorySize) {  // 判断内存分区是否足够
                        partitionAssigned = this.mem.methods.occupyPartition(partition.start, worker);
                        if (partitionAssigned) {
                            this.mem.total++;
                            this.mem.success++;
                            break;  // 找到合适的分区后跳出循环
                        }
                    }
                }

                // 如果第一次尝试没有找到合适的分区，重新从表头开始查找
                if (!partitionAssigned) {
                    for (let i = 0; i < startIdx; i++) {
                        const partition = emptyPartitions[i];
                        if (partition && partition.end !== undefined && partition.end - partition.start >= worker.memorySize) {
                            partitionAssigned = this.mem.methods.occupyPartition(partition.start, worker);
                            if (partitionAssigned) {
                                this.mem.total++;
                                this.mem.success++;
                                break;
                            }
                        }
                    }
                }

                // 如果依然没有找到合适的分区，返回分配失败
                if (!partitionAssigned) {
                    worker.enterTime = 0.1;  // 重置进入时间
                    this.mem.total++;

                    // 删除后验证是否确实删除了
                    const initialLength = this.queue.workQueue.length;
                    this.queue.workQueue = this.queue.workQueue.filter(p => p.id !== worker.id);
                    const newLength = this.queue.workQueue.length;

                    if (newLength < initialLength) {
                        console.log('删除成功');
                    } else {
                        console.log('未找到匹配的 worker');
                    }


                    // 检查任务是否已经存在于 clogQueue 中，避免重复添加
                    if (!this.queue.clogQueue.some(p => p.id === worker.id)) {
                        this.queue.clogQueue.push(worker);  // 将任务重新加入阻塞队列
                        console.log("clogQueue==>", this.queue.clogQueue);
                    }
                }
            }

            // 更新队列状态，确保队列中的任务正确更新
            await this.delay(1);  // 等待1秒后再次检查队列状态
        }

        // 如果所有任务都分配成功
        return true;
    }

    // 模拟延迟的辅助函数，基于秒
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms * 1000));
    }
}

export { NfaAllocator };