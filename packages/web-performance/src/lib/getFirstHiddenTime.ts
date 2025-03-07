import { onHidden } from "./onHidden";

/**
 * 初始化首次隐藏时间，若页面初始状态为隐藏，则设为 0，否则设为无穷大
 */
let firstHiddenTime = document.visibilityState === 'hidden' ? 0 : Infinity;
/**
 * 获取页面首次隐藏的时间戳
 * @returns 包含首次隐藏时间戳的对象，可通过 timeStamp 属性访问
 */
const getFirstHiddenTime = () => {
    onHidden((e: Event) => {
        firstHiddenTime = Math.min(firstHiddenTime, e.timeStamp);
    }, true);

    return {
        get timeStamp() {
           return firstHiddenTime; 
        }
    }
}

export default getFirstHiddenTime;