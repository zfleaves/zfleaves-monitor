import { types } from "zfleaves-monitor-tools";

export interface VueInstance {
    config?: VueConfiguration;
    mixin(hooks: { [key: string]: () => void }): void;
    util: {
        warn(...input: any): void;
    },
    version: string;
}

export interface VueConfiguration {
    silent: boolean;
    errorHandler(err: Error, vm: ViewModel, info: string): void;
    warnHandler(msg: string, vm: ViewModel, trace: string): void;
    ignoredElements: (string | RegExp)[];
    keyCodes: { [key: string]: number | number[] };
    async: boolean;
}

/**
 * 表示一个 Vue.js 视图模型对象。
 */
export interface ViewModel {
    /**
     * 允许对象包含任意数量的属性，属性名可以是任意字符串，属性值可以是任意类型。
     */
    [key: string]: any;
    /**
     * 对根 Vue 实例的引用。
     */
    $root: Record<string, unknown>;
    /**
     * Vue 实例的选项对象。
     */
    $options: {
        /**
         * 允许对象包含任意数量的属性，属性名可以是任意字符串，属性值可以是任意类型。
         */
        [key: string]: any;
        /**
         * 组件的可选名称。
         */
        name?: string;
        /**
         * 传递给组件 props 的可选数据（特定于 Vue 2.6）。
         */
        propsData?: types.IAnyObject;
        /**
         * 组件的可选标签名。
         */
        _componentTag?: string;
        /**
         * 组件定义所在的可选文件路径。
         */
        __file?: string;
        /**
         * 定义组件 props 的可选对象。
         */
        props?: types.IAnyObject;
    };
    /**
     * 包含传递给组件的所有 props 的对象。
     */
    $props: Record<string, unknown>;
}
