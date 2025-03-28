import { BreadCrumbTypes, ErrorTypes } from "zfleaves-monitor-shared";
import { utils, core, types } from 'zfleaves-monitor-tools' ;
const { isError, extractErrorStack, Severity } = utils;
const { breadcrumb, transportData } = core;

/**
 * 收集react ErrorBoundary中的错误对象
 * 需要用户手动在componentDidCatch中设置
 * 函数式组件中无法使用 可以用高阶组件类型组件包裹
 * @param ex ErrorBoundary中的componentDidCatch的一个参数error
 */
export function errorBoundaryReport(ex: any): void {
    if (!isError(ex)) {
        console.warn('传入的react error不是一个object Error');
        return;
    }
    const error = extractErrorStack(ex, Severity.Normal) as types.ReportDataType;
    error.type = ErrorTypes.REACT_ERROR;
    breadcrumb.push({
        type: BreadCrumbTypes.REACT,
        category: breadcrumb.getCategory(BreadCrumbTypes.REACT),
        data: `${error.name}: ${error.message}`,
        level: Severity.Normal
    })
    transportData.send(error);
}
