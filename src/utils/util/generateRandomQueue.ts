import Worker from "@/types/worker";
import { generateRandomColor } from "@/utils/util/RandomColor";

// 随机生成一个工作队列
function generateRandomQueue(count: number): Worker[] {
    const newQueue: Worker[] = [];
    const uniqueIds = new Set<number>();  // 用于确保ID唯一性

    for (let i = 0; i < count; i++) {
        // 确保 ID 唯一
        let id;
        do {
            id = Date.now() + Math.floor(Math.random() * 1000); // 当前时间戳 + 随机数
        } while (uniqueIds.has(id)); // 如果ID已存在，则重新生成
        uniqueIds.add(id);

        // 将 newWorker 改为 const，因为它不会再被重新赋值
        const newWorker = {
            id: id,
            name: `任务 ${Math.floor(Math.random() * 1000)}`, // 随机生成工作任务名称
            memorySize: Math.floor(Math.random() * 200) + 10, // 随机生成内存大小，范围 10-500
            runTime: Math.floor(Math.random() * 30) + 1, // 随机生成运行时间，范围 1-60
            color: generateRandomColor(), // 随机生成颜色
            state: 0,
            enterTime: generateRandomEnterTime() // 添加随机进入时间
        };

        newQueue.push(newWorker);
    }

    // 按照 enterTime 排序
    newQueue.sort((a, b) => a.enterTime - b.enterTime);

    return newQueue;
}

// 生成一个 0 到 300 之间的随机进入时间
function generateRandomEnterTime(): number {
    return Math.floor(Math.random() * 2); // 生成 0 到 300 秒之间的随机数
}

export { generateRandomQueue, generateRandomEnterTime };
