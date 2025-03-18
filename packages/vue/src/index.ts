import { EventTypes } from "zfleaves-monitor-shared";
import { VueInstance, ViewModel } from "./types";
import { handleVueError } from "./helper";
import { utils } from "zfleaves-monitor-tools";
const { getFlag, setFlag, silentConsoleScope, Severity } = utils;

const hasConsole = typeof console !== 'undefined';

const MonitorVue = {
    install(Vue: VueInstance): void {
        if (getFlag(EventTypes.VUE) || !Vue || !Vue.config) return;
        setFlag(EventTypes.VUE, true);
        // vue 提供 warnHandler errorHandler报错信息
        Vue.config.errorHandler = function (err: Error, vm: ViewModel, info: string): void {
            handleVueError.apply(null, [err, vm, info, Severity.Normal, Severity.Error, Vue]);
            if (hasConsole && !Vue.config.silent) {
                silentConsoleScope(() => {
                    console.error('Error in ' + info + ': "' + err.toString() + '"', vm);
                    console.error(err); 
                })
            }
        };
    }
}

export { MonitorVue };