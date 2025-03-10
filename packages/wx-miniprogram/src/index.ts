import { InitOptions } from "zfleaves-monitor-type";
import { isWxMiniEnv } from "zfleaves-monitor-utils";
import { setupReplace } from "./load";
import { initOptions, log } from "zfleaves-monitor-core";
import { sendTrackData, track } from "./initiative";
import { SDK_NAME, SDK_VERSION } from "zfleaves-monitor-shared";
import { MonitorVue } from "zfleaves-monitor-vue";
import { errorBoundaryReport } from "zfleaves-monitor-react";

export function init(options: InitOptions = {}) {
    if (!isWxMiniEnv) return;
    initOptions(options);
    setupReplace();
    Object.assign(wx, { monitorLog: log, SDK_NAME, SDK_VERSION });
}

export { log, sendTrackData, track, MonitorVue, errorBoundaryReport };