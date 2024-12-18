type Worker = {
    id: number;
    name: string;
    memorySize: number; // 消耗的内存大小，以字节为单位
    enterTime: number;
    runTime:number;
    state:number;
    color:string;
};

export default Worker;