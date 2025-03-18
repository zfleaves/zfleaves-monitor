import { core, utils, types } from "zfleaves-monitor-tools";
const { transportData } = core;
const { generateUUID, getTimestamp } = utils;

export function track(actionType: types.EActionType, param: types.ITrackBaseParam) {
    const data = {
        ...param,
        // rewrite actionType
        actionType,
    };

    sendTrackData(data);
    return data;
}

/**
 * 手动发送埋点数据到服务端
 * @param data 埋点上报的数据，必须含有actionType属性
 */
export function sendTrackData(data: types.TrackReportData) {
    const id = generateUUID();
    const trackTime = getTimestamp();
    transportData.send({
        id,
        trackTime,
        ...data,
    });
}