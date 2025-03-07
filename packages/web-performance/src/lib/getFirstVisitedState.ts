import { onPageChange } from "./onPageChange";

let firstVisitedState = true;
onPageChange(() => {
    firstVisitedState = false;
});

export const getFirstVisitedState = () => {
    return {
        get state() {
            return firstVisitedState;
        },
    };
}

export default getFirstVisitedState;