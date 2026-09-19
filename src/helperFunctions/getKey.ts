export const getKey=(identifier: string, strategy: string)=> {

        if (strategy === "token-bucket") {
            return `token-bucket:${identifier}`;

        }
        else if (strategy === "leaky-bucket") {
            return `leaky-bucket:${identifier}`
        }
        else if (strategy === "sliding-window-log") {
            return `sliding-window-log:${identifier}`;
        }
        else if (strategy === "sliding-window-counter") {
            return `sliding-window-counter:${identifier}`;
        }

        else if (strategy === "fixed-window") {
            return `fixed-window:${identifier}`;
        }

        else {
            return `default:${identifier}`;
        }



    }