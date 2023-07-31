import { Room } from "colyseus.js";

export class Utils {
    public static room: Room;


    static waitForConditionAsync(conditionFunction, timerInMs?: number, timeout?: number) {
        var isExpired = false;
        const poll = async resolve => {
            if (isExpired || await conditionFunction()) resolve();
            else setTimeout(_ => poll(resolve), timerInMs ? timerInMs : 100);
        }

        if (timeout) {
            setTimeout(() => isExpired = true, timeout);
        }

        return new Promise(poll);
    }
}