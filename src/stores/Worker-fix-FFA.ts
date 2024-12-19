import {defineStore} from 'pinia';
import {ref} from 'vue';
import Worker from '@/types/worker';
import {generateRandomColor} from "@/utils/util/RandomColor";

export const useWorkerStoreFixFFA = defineStore('worker-fix-ffa', () => {
    const workQueue = ref<Worker[]>(initWorkerQueue());
    const clogQueue = ref<Worker[]>(initClogQueue());
    const activeQueue=ref<Worker[]>([]);
    // 初始化工作队列
    function initWorkerQueue(): Worker[] {
        let workQueueStorage: Worker[] = [];

        // 尝试从 localStorage 获取工作队列数据
        try {
            workQueueStorage = JSON.parse(localStorage.getItem('worker-queue-fix-ffa') || '[]');
        } catch (e) {
            // 如果解析出错，则返回一个空数组
            workQueueStorage = [];
        }

        // 如果 workQueueStorage 为空，生成一个默认的工作队列
        if (!workQueueStorage || workQueueStorage.length === 0) {
            const defaultQueue: Worker[] = [
                { id: 1, name: '任务1', enterTime: generateRandomEnterTime(), memorySize: 300,state:0, runTime: Math.floor(Math.random() * 2) + 1, color: generateRandomColor() },
                { id: 2, name: '任务2', enterTime: generateRandomEnterTime(), memorySize: 620,state:0, runTime: Math.floor(Math.random() * 2) + 1, color: generateRandomColor() },
                { id: 3, name: '任务3', enterTime: generateRandomEnterTime(), memorySize: 212,state:0, runTime: Math.floor(Math.random() * 2) + 1, color: generateRandomColor() },
                { id: 4, name: '任务4', enterTime: generateRandomEnterTime(), memorySize: 321,state:0, runTime: Math.floor(Math.random() * 2) + 1, color: generateRandomColor() },
                { id: 5, name: '任务5', enterTime: generateRandomEnterTime(), memorySize: 332,state:0, runTime: Math.floor(Math.random() * 2) + 1, color: generateRandomColor() }
            ];

            defaultQueue.sort((a, b) => a.enterTime - b.enterTime);
            // 对默认队列按照 enterTime 排序
            defaultQueue.sort((a, b) => a.enterTime - b.enterTime);

            localStorage.setItem('worker-queue-fix-ffa', JSON.stringify(defaultQueue));
            return defaultQueue;
        }

        // 如果有存储的队列，按 enterTime 排序
        workQueueStorage.sort((a, b) => a.enterTime - b.enterTime);
        return workQueueStorage;
    }

    function initClogQueue(): Worker[] {
        let clogQueueStorage: Worker[]=[];

        // 尝试从 localStorage 获取工作队列数据
        try {
            const storedData = localStorage.getItem('clog-queue-fix-ffa');
            if (storedData) {
                clogQueueStorage = JSON.parse(storedData);
            }
        } catch (e) {
            // 如果解析出错，则返回一个空数组
            clogQueueStorage =[];
        }

        return clogQueueStorage;
    }



    // 生成一个 0 到 300 之间的随机进入时间
    function generateRandomEnterTime(): number {
        return Math.floor(Math.random() * 2); // 0 到 200 秒之间
    }

    // 添加工作队列中的任务
    function addWorkerToQueue(newWorker: Worker) {
        newWorker.color = generateRandomColor(); // 为新工作队列任务生成颜色
        newWorker.enterTime = generateRandomEnterTime(); // 为新任务生成一个随机进入时间
        workQueue.value.push(newWorker);

        // 按照 enterTime 排序
        workQueue.value.sort((a, b) => a.enterTime - b.enterTime);

        localStorage.setItem('worker-queue-fix-ffa', JSON.stringify(workQueue.value));
    }

    // 删除工作队列中的任务
    function removeFromWorkQueue(workerId: number) {
        workQueue.value = workQueue.value.filter(worker => worker.id !== workerId);
        localStorage.setItem('worker-queue-fix-ffa', JSON.stringify(workQueue.value)); // 更新到 localStorage
    }

    // 修改工作队列中的任务
    function updateWorkerInQueue(workerId: number, updatedWorker: Partial<Worker>) {
        const index = workQueue.value.findIndex(worker => worker.id === workerId);
        if (index !== -1) {
            workQueue.value[index] = { ...workQueue.value[index], ...updatedWorker };
            // 如果没有修改 color，则保留原来的 color 值
            if (!updatedWorker.color) {
                workQueue.value[index].color = workQueue.value[index].color || generateRandomColor();
            }
            localStorage.setItem('worker-queue-fix-ffa', JSON.stringify(workQueue.value));
        }
    }

    // 随机生成一个工作队列
    function generateRandomQueue(apps:Worker[]) {
        workQueue.value = [...apps]; // 将生成的工作队列添加到现有队列中
        localStorage.setItem('worker-queue-fix-ffa', JSON.stringify(workQueue.value)); // 更新到 localStorage
    }

    // 更新工作队列
    function updateWorkQueue(updatedQueue: Worker[]) {
        workQueue.value = updatedQueue;
        localStorage.setItem('worker-queue-fix-ffa', JSON.stringify(workQueue.value)); // 更新到 localStorage
    }

    function addToClogQueue(worker: Worker) {
        clogQueue.value.push(worker);
    }

    // 从队列中移除队首任务
    function dequeueClogQueue(): Worker | undefined {
        const worker = clogQueue.value.shift();
        if (worker) {
            localStorage.setItem('clog-queue-fix-ffa', JSON.stringify(clogQueue.value));
        }
        return worker;
    }

    // 从队列中移除队首任务
    function popClogQueue(): Worker | undefined {
        return clogQueue.value[0];
    }

    // 判断队列是否为空
    function isClogQueueEmpty(): boolean {
        return clogQueue.value.length===0;
    }


    // 判断队列是否为空
    function isWorkerQueueEmpty(): boolean {
        return workQueue.value.length===0;
    }

    // 获取队列的大小
    function clogQueueSize(): number {
        return clogQueue.value.length;
    }



    return {
        workQueue,
        clogQueue,
        activeQueue,
        addWorkerToQueue,
        removeFromWorkQueue,
        updateWorkerInQueue,
        generateRandomQueue,
        updateWorkQueue,
        addToClogQueue,
        popClogQueue,
        dequeueClogQueue,
        isClogQueueEmpty,
        clogQueueSize,
        isWorkerQueueEmpty
    };
});
