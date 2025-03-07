import { QUANTILE_AT_VALUE } from '../utils/math';
import scoreDefaultConfig from '../config/scoreDefaultConfig';
import { IScoreConfig } from '../types';

/**
 * 根据给定的指标名称、指标值和配置信息计算得分。
 * 
 * @param metricsName - 指标的名称，用于从配置中查找对应的指标配置。
 * @param value - 指标的具体数值，用于计算得分。
 * @param config - 自定义的指标得分配置，默认为空对象。
 * @returns 如果找到对应的指标配置，则返回计算得到的得分；否则返回 null。
 */
const calcScore = (
    metricsName: string,
    value: number,
    config: IScoreConfig = {},
): number | null => {
    const mergeConfig = { ...scoreDefaultConfig, ...config };

    const metricsConfig = mergeConfig[metricsName];

    if (metricsConfig) {
        return QUANTILE_AT_VALUE(metricsConfig, value);
    }

    return null;
};

export default calcScore;