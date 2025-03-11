import { WxPerformanceItemType, Listener } from '../types/index';

export class Event {
    events: Map<WxPerformanceItemType | string, Listener[]>;
    constructor() {
        this.events = new Map();
    }

    on(event: WxPerformanceItemType | string, listener: (...args: any[]) => void): this {
        let ls = this.events.get(event) || [];
        if (!ls.includes(listener)) {
            ls.push(listener);
            this.events.set(event, ls);
        }
        return this;
    }

    emit(event: WxPerformanceItemType | string, ...args: any[]): boolean {
        if (!this.events.has(event)) return false;
        let ls = this.events.get(event) || [];
        ls.forEach((fn) => fn.apply(this, args));
        return true;
    }

    remove(event: WxPerformanceItemType | string, listener: (...args: any[]) => void): this {
        const ls = this.events.get(event) || [];
        const es = ls.filter((f) => f !== listener);
        this.events.set(event, es);
        return this;
    }

    removeAll(event: WxPerformanceItemType): this {
        this.events.delete(event);
        return this;
    }
    /**
     * 为指定事件添加一个一次性监听器，该监听器在事件首次触发后会自动移除
     * @param event - 要监听的事件名称，可以是预定义的性能指标类型或自定义字符串
     * @param listener - 事件触发时执行的回调函数，可接受任意数量的参数
     * @returns 当前的 Event 实例，支持链式调用
     */
    once(event: WxPerformanceItemType | string, listener: (...args: any[]) => void): this {
        const fn = (...arg: any[]) => {
            listener.apply(this, arg);
            this.remove(event, fn);
        };
        return this.on(event, fn);
    }
}

export default Event;