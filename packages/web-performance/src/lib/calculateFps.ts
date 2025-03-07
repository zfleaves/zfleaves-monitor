import { roundToDigits } from "../utils";

/**
 * 计算指定次数内的平均帧率 (FPS)
 * @param count - 需要收集的帧率数据的数量
 * @returns 返回一个 Promise，该 Promise 会 resolve 平均帧率，结果保留两位小数
 */
const calculateFps = (count: number): Promise<number> => {
    return new Promise((resolve, reject) => {
        let frame = 0;
        let lastFrameTime = +new Date();
        const fpsQueue: number[] = [];
        // 存储 requestAnimationFrame 返回的 ID，用于取消动画帧请求
        let timerId: number | null = null;
        /**
         * 计算帧率的递归函数
         */
        const calculate = () => {
            const now = +new Date();

            frame = frame + 1;
            if (now > lastFrameTime + 1000) {
                // 计算这一秒内的帧率
                const fps = Math.round(frame / ((now - lastFrameTime) / 1000));
                fpsQueue.push(fps);
                frame = 0;
                lastFrameTime = +new Date();
                // 检查是否已经收集到足够的帧率数据
                if (fpsQueue.length > count) {
                    // 如果已经收集到足够的数据，取消动画帧请求
                    if (timerId) {
                        cancelAnimationFrame(timerId);
                    }
                    // 计算平均帧率
                    const averageFps = fpsQueue.reduce((sum, fps) => sum + fps, 0) / fpsQueue.length;
                    // 将平均帧率保留两位小数并 resolve 出去
                    resolve(roundToDigits(averageFps, 2));
                } else {
                    // 如果还没有收集到足够的数据，继续请求下一帧动画
                    timerId = requestAnimationFrame(calculate);
                }
            } else {
                // 如果未过去 1 秒，继续请求下一帧动画
                timerId = requestAnimationFrame(calculate);
            }
        }
        // 启动帧率计算
        calculate();
    })
}

export default calculateFps;