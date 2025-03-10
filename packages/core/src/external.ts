import { ErrorTypes, BreadCrumbTypes } from "zfleaves-monitor-shared";
import {
    isError,
    extractErrorStack,
    getLocationHref,
    getTimestamp,
    unknownToString,
    isWxMiniEnv,
    Severity,
    getCurrentRoute,
} from "zfleaves-monitor-utils";
import { transportData } from './transportData';
import { breadcrumb } from './breadcrumb';
import { TNumStrObj } from "zfleaves-monitor-type";

interface LogTypes {
    message: TNumStrObj;
    tag?: TNumStrObj;
    level?: Severity;
    ex?: Error | any;
    type?: string;
}

export function log({
    message = 'emptyMsg',
    tag = '',
    level = Severity.Critical,
    ex = '',
    type = ErrorTypes.LOG_ERROR
}: LogTypes): void {
    let errorInfo = {};
    if (isError(ex)) {
        errorInfo = extractErrorStack(ex, level);
    }
    const error = {
       type,
       level,
       message: unknownToString(message),
       name: 'Monitor.log',
       customTag: unknownToString(tag),
       time: getTimestamp(),
       url: isWxMiniEnv ? getCurrentRoute() : getLocationHref(),
       ...errorInfo
    }
    breadcrumb.push({
       type: BreadCrumbTypes.CUSTOMER,
       category: breadcrumb.getCategory(BreadCrumbTypes.CUSTOMER),
       data: message,
       level: Severity.fromString(level.toString()), 
    })
    transportData.send(error);
}