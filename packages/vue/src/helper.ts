import { utils, core, types } from "zfleaves-monitor-tools";
import { ErrorTypes, BreadCrumbTypes } from "zfleaves-monitor-shared";
import { ViewModel, VueInstance } from "./types";
const {
    getBigVersion,
    getLocationHref,
    getTimestamp,
    variableTypeDetection,
} = utils;
const { breadcrumb, transportData } = core;

export function handleVueError(
    err: Error,
    vm: ViewModel,
    info: string,
    level: utils.Severity,
    breadcrumbLevel: utils.Severity,
    Vue: VueInstance
): void {
    const version = Vue?.version;
    let data: types.ReportDataType = {
        type: ErrorTypes.VUE_ERROR,
        message: `${err.message}(${info})`,
        level: level,
        url: getLocationHref(),
        name: err.name,
        stack: err.stack || [],
        time: getTimestamp(),
    }
    if (variableTypeDetection.isString(version)) {
        switch (getBigVersion(version)) {
            case 2:
                data = { ...data, ...vue2VmHandler(vm) };
                break;
            case 3:
                data = { ...data, ...vue3VmHandler(vm) };
                break;
            default:
                return;
                break;
        }
    }
    breadcrumb.push({
        type: BreadCrumbTypes.VUE,
        category: breadcrumb.getCategory(BreadCrumbTypes.VUE),
        data,
        level: breadcrumbLevel,
    });
    transportData.send(data);
}

/**
 * 处理 Vue 2 实例的视图模型，提取组件名称和 props 数据
 * @param {ViewModel} vm - Vue 2 实例的视图模型
 * @returns {Object} - 包含组件名称和 props 数据的对象
 */

function vue2VmHandler(vm: ViewModel) {
    // 初始化组件名称为空字符串
    let componentName = '';
    // 检查当前实例是否为根实例
    if (vm.$root === vm) {
        // 如果是根实例，将组件名称设置为 'root'
        componentName = 'root';
    } else {
        // 如果不是根实例，获取组件名称
        const name = vm._isVue
            // 如果是 Vue 实例，尝试从 $options 中获取 name 或 _componentTag
            ? (vm.$options && vm.$options.name) || (vm.$options && vm.$options._componentTag)
            // 如果不是 Vue 实例，直接使用 vm.name
            : vm.name;
        // 生成最终的组件名称
        componentName =
            // 如果有组件名称，将其包装在 < > 中，否则显示为 'anonymous component'
            (name ? 'component <' + name + '>' : 'anonymous component') +
            // 如果组件有 __file 属性，显示组件所在的文件路径
            (vm._isVue && vm.$options && vm.$options.__file
                ? ' at ' + (vm.$options && vm.$options.__file)
                : '');
    }
    // 返回包含组件名称和 props 数据的对象
    return {
        // 组件名称
        componentName,
        // 从 $options 中获取的 props 数据，如果 $options 存在则返回 propsData，否则返回 undefined
        propsData: vm.$options && vm.$options.propsData,
    }
}

function vue3VmHandler(vm: ViewModel) {
    let componentName = '';
    if (vm.$root === vm) {
        componentName = 'root';
    } else {
        const name = vm.$options && vm.$options.name;
        componentName = name ? 'component <' + name + '>' : 'anonymous component';
    }
    return {
        componentName,
        propsData: vm.$props,
    }
}