import { RateLimitOptions } from "./RateLimitOptions";

export interface FixedWindowOptions extends RateLimitOptions {
    strategy: "fixed-window",
    capacity:number,
    windowSizeMs:number,

}