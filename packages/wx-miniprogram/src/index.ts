import { setupReplace } from "./load";
import { sendTrackData, track } from "./initiative";
import { SDK_NAME, SDK_VERSION } from "zfleaves-monitor-shared";
import { MonitorVue } from "zfleaves-monitor-vue";
import { errorBoundaryReport } from "zfleaves-monitor-react";
import { core, utils, types } from "zfleaves-monitor-tools";
const { initOptions, log } = core;
const { isWxMiniEnv } = utils;

export function init(options: types.InitOptions = {}) {
    if (!isWxMiniEnv) return;
    initOptions(options);
    setupReplace();
    Object.assign(wx, { monitorLog: log, SDK_NAME, SDK_VERSION });
}

export { log, sendTrackData, track, MonitorVue, errorBoundaryReport };