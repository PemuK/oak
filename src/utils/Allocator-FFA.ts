import {useDynamicMem} from "@/stores/DynamicMem";
import Worker from "@/types/worker";
import {watch} from "vue";
import {useWorkerStore} from "@/stores/worker";

// 创建 MemoryAllocator 类
class FfaAllocator {
    private mem;
    private queue;

    constructor(type: number) {
        // 根据内存类型选择内存管理方式
        this.mem = useDynamicMem();
        this.queue = useWorkerStore();
        watch(
            () => this.queue.activeQueue,  // 监视 activeQueue
            (newVal: Worker[], oldVal: Worker[]) => {
                // 你可以在这里执行你需要的操作
                const emptyPartitions = this.mem.methods.listEmpPartitionByStart();
                if (newVal.length < oldVal.length) {
                    if (this.queue.clogQueue.length > 0) {
                        console.log("less workers in the queue:", newVal);
                        for (const partition of emptyPartitions) {
                            // 获取符合内存大小的所有 workers
                            const eligibleWorkers = this.queue.clogQueue.filter(worker => partition.end - partition.start >= worker.memorySize);

                            // 如果有符合条件的 workers
                            if (eligibleWorkers.length > 0) {
                                // 先移除已经分配的 workers
                                this.queue.clogQueue = this.queue.clogQueue.filter(worker => !eligibleWorkers.includes(worker));

                                // 将这些符合条件的 workers 加入到 workQueue
                                for (const worker of eligibleWorkers) {
                                    if (!this.queue.workQueue.find(p => p.id === worker.id)) {
                                        this.queue.workQueue.push(worker);
                                    }
                                }
                            }
                        }

                        // 执行内存分配等操作
                    }
                }
            }, {deep: true}
        );
    }

    public async FFA(): Promise<boolean> {
        // 用来模拟任务分配的延迟
        while (this.queue.workQueue.length > 0 || this.queue.clogQueue.length > 0) {
            // 遍历工作队列中的任务
            for (const worker of this.queue.workQueue) {
                // 模拟延迟，延迟时间为任务的 `enterTime`
                await this.delay(worker.enterTime);

                // 获取所有空闲内存分区
                const emptyPartitions = this.mem.methods.listEmpPartitionByStart();
                let partitionAssigned = false; // 标记任务是否成功分配

                // 尝试将任务分配到内存分区
                for (const partition of emptyPartitions) {
                    if(partition.end - partition.start<10){
                        this.mem.splinter++;
                    }
                    if (partition.end - partition.start >= worker.memorySize) {  // 判断内存分区是否足够
                        partitionAssigned = this.mem.methods.occupyPartition(partition.start, worker);
                        if (partitionAssigned) {
                            this.mem.total++;
                            this.mem.success++;
                            break;  // 找到合适的分区后跳出循环
                        }
                    }
                }

                if (!partitionAssigned) {
                    worker.enterTime = 0.1;  // 重置进入时间

                    // 更新 workQueue：移除已处理的任务
                    this.queue.workQueue = this.queue.workQueue.filter(p => p.id !== worker.id);
                    this.mem.total++;

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

export {FfaAllocator};
