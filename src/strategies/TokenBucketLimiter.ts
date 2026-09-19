import { RateLimiterStore } from "../store/RateLimiterStore";
import {RateLimiterStrategy} from "./RateLimiterStrategy";
import { RateLimitResult } from "../Interfaces/rateLimitResult";

export  class TokenBucketLimiter implements RateLimiterStrategy {
    constructor (
        private readonly capacity: number,
        private readonly refillRatePerSecond : number,
        private readonly store : RateLimiterStore,
    ){}

     async isAllowed(identifier: string): Promise<RateLimitResult> {
        return await this.store.executeTokenBucket(
            identifier,
            this.capacity,
            this.refillRatePerSecond
        )
    }

}
