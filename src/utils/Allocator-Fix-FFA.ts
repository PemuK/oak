import { useFixedMem } from "@/stores/FixedMem";
import Worker from "@/types/worker";
import { watch } from "vue";
import { useWorkerStoreFixFFA } from "@/stores/Worker-fix-FFA";

// 创建 MemoryAllocator 类
class FfaAllocatorFixed {
    private mem;
    private queue;

    constructor(type: number) {
        this.mem = useFixedMem();
        this.queue = useWorkerStoreFixFFA();

        // 监视 activeQueue 变化
        watch(
            () => this.queue.activeQueue,
            (newVal: Worker[], oldVal: Worker[]) => this.handleQueueChange(newVal, oldVal),
            { deep: true }
        );
    }

    /**
     * 处理队列变化
     * 当 activeQueue 的大小减少时，检查是否有符合条件的 worker
     */
    private handleQueueChange(newVal: Worker[], oldVal: Worker[]) {
        const emptyPartitions = this.mem.partitions
            .filter(p => p.occupiedBy == null)  // 只考虑空闲的内存分区
            .sort((a, b) => a.id - b.id);      // 按照内存分区 ID 排序

        // 如果队列中的 worker 数量减少，检查是否有符合条件的 worker 可以分配
        if (newVal.length < oldVal.length && this.queue.clogQueue.length > 0) {
            for (const partition of emptyPartitions) {
                const eligibleWorkers = this.queue.clogQueue.filter(worker => partition.size >= worker.memorySize);

                // 如果有符合条件的 worker
                if (eligibleWorkers.length > 0) {
                    // 从 clogQueue 中移除已分配的 worker
                    this.queue.clogQueue = this.queue.clogQueue.filter(worker => !eligibleWorkers.includes(worker));

                    // 将符合条件的 worker 加入 workQueue
                    eligibleWorkers.forEach(worker => {
                        if (!this.queue.workQueue.find(p => p.id === worker.id)) {
                            this.queue.workQueue.push(worker);
                        }
                    });
                }
            }
        }
    }

    /**
     * 执行内存分配的主要逻辑
     */
    public async FFA(): Promise<boolean> {
        while (this.queue.workQueue.length > 0 || this.queue.clogQueue.length > 0) {
            // 遍历工作队列中的任务
            for (const worker of this.queue.workQueue) {
                // 模拟任务延迟，延迟时间由 worker.enterTime 决定
                await this.delay(worker.enterTime);

                const emptyPartitions = this.mem.partitions
                    .filter(p => p.occupiedBy == null)  // 过滤掉已占用的分区
                    .sort((a, b) => a.id - b.id);      // 按照分区 ID 升序排序

                let partitionAssigned = false;  // 标记任务是否成功分配

                // 尝试将任务分配到空闲的内存分区
                for (const partition of emptyPartitions) {
                    if (partition.size >= worker.memorySize) {  // 判断内存分区大小是否足够

                        if(partition.size<10){
                            this.mem.splinter++;
                        }
                        partitionAssigned = this.mem.methods.occupyPartition(partition.id, worker);
                        if (partitionAssigned)
                        {
                            this.mem.total++;
                            this.mem.success++;
                            break;
                        }  // 如果分配成功，跳出循环
                    }
                }

                if (!partitionAssigned) {
                    this.mem.total++;
                    this.handleRequeue(worker);  // 如果分配失败，重试任务
                }
            }

            // 等待 1 秒后再次检查队列状态
            await this.delay(1);
        }

        // 如果所有任务都成功分配
        return true;
    }

    /**
     * 将 worker 移回 clogQueue，重置进入时间
     */
    private handleRequeue(worker: Worker) {
        worker.enterTime = 0.1;  // 重置进入时间

        // 从 workQueue 中移除已处理的 worker
        this.queue.workQueue = this.queue.workQueue.filter(p => p.id !== worker.id);

        // 如果 worker 不在 clogQueue 中，则将其加入
        if (!this.queue.clogQueue.some(p => p.id === worker.id)) {
            this.queue.clogQueue.push(worker);
            console.log("clogQueue==>", this.queue.clogQueue);
        }
    }

    /**
     * 模拟延迟的辅助函数
     * @param ms 延迟的时间，单位：秒
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms * 1000));
    }
}

export { FfaAllocatorFixed };
