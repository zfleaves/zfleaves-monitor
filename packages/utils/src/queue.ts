import { voidFun } from "zfleaves-monitor-shared";
import { _global } from "./global";

/**
 * 一个任务队列，允许将函数添加并异步执行。
 */
export class Queue {
    // 用于调度微任务的 Promise
    private micro: Promise<void>;
    // 存储待执行函数的栈
    private stack: voidFun[];
    // 标记队列是否正在刷新
    private isFlushing = false;

    /**
     * 构造函数，初始化队列
     */
    constructor() {
        if (!('Promise' in _global)) return;
        this.micro = Promise.resolve();
        this.stack = [];
    }

    /**
     * 向队列中添加一个函数
     * @param fn - 要添加的函数
     */
    addFn(fn: voidFun): void {
        if (typeof fn !== 'function') return;
        if (!('Promise' in _global)) {
            fn();
            return;
        }
        this.stack.push(fn);
        if (!this.isFlushing) {
            this.isFlushing = true;
            this.micro.then(() => this.flushStack());
        }
    }

    /**
     * 清空队列
     */
    clear(): void {
        this.stack = [];
    }

    /**
     * 获取队列中当前的函数栈
     * @returns 函数栈
     */
    getStack(): voidFun[] {
        return this.stack; 
    }

    /**
     * 刷新队列，执行栈中的所有函数
     */
    flushStack(): void {
        const temp = this.stack.slice(0);
        this.stack.length = 0; 
        this.isFlushing = false;
        for (let i = 0; i < temp.length; i++) {
            try {
                temp[i]();
            } catch (error) {
                console.error('执行队列中的函数时出错:', error);
            }
        }
    }
}