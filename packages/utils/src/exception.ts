import { voidFun } from "zfleaves-monitor-shared";

export function nativeTryCatch(fn: voidFun, errorFn?: (err: unknown) => void): void {
    try {
        fn();
    } catch (err) {
        if (errorFn) {
            errorFn(err);
        } else {
            console.error('An error occurred:', err);
        }
    }
}
