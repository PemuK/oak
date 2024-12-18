class Queue<T> {
    private items: T[] = [];

    // 入队操作
    enqueue(item: T): void {
        this.items.push(item);
    }

    // 出队操作
    dequeue(): T | undefined {
        return this.items.shift();
    }

    // 查看队列头部元素
    peek(): T | undefined {
        return this.items[0];
    }

    // 判断队列是否为空
    isEmpty(): boolean {
        return this.items.length === 0;
    }

    // 获取队列长度
    size(): number {
        return this.items.length;
    }

    // 清空队列
    clear(): void {
        this.items = [];
    }

    // 打印队列中的所有元素
    print(): void {
        console.log(this.items);
    }
}

// 使用示例：
const queue = new Queue<number>();

