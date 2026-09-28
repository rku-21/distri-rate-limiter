import { RateLimiterStore } from "../store/RateLimiterStore"
import { handler } from "../types/customHandler"
import { keyGenerator } from "../types/keyGenerator"
import { FixedWindowOptions } from "./FixedWindowOptions"
import { LeakyBucketOptions } from "./LeakyBucketOptions"
import { SlidingWindowCounterOptions } from "./SlidingWindowCounterOptions"
import { SlidingWindowLogOptions } from "./SlidingWindowLogOptions"
import { TokenBucketOptions } from "./TokenBucketOptions"


export interface RateLimitOptions {
    store?:RateLimiterStore
    keyGenerator?:keyGenerator,
    handler?:handler,
    failureMode?: "open" | "closed";
}

export type RateLimiterOptions =
    RateLimitOptions & (
    SlidingWindowCounterOptions | 
    SlidingWindowLogOptions | 
    TokenBucketOptions | 
    FixedWindowOptions |
    LeakyBucketOptions


    )