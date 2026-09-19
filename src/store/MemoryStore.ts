
import { RateLimitResult } from "../Interfaces/rateLimitResult";
import { RateLimiterStore } from "./RateLimiterStore";
import { getKey } from "../helperFunctions/getKey";

type MemoryBucket = {
    expireAt: number;
    [key: string]: any;
};



export class MemoryStore implements RateLimiterStore {
    private readonly store: Map<string, MemoryBucket>;
    private readonly cleanupInterval: ReturnType<typeof setInterval>;

    constructor() {
        this.store = new Map<string, MemoryBucket>();
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredBuckets();
        }, 60_000);

        if (typeof this.cleanupInterval.unref === "function") {
            this.cleanupInterval.unref();
        }
    }

    private getBucket(key: string) {
        const bucket = this.store.get(key);

        if (!bucket) {
            return undefined;
        }

        if (bucket.expireAt <= Date.now()) {
            this.store.delete(key);
            return undefined;
        }

        return bucket;
    }

    private setBucket(key: string, bucket: Omit<MemoryBucket, "expireAt">, expireAt: number) {
        this.store.set(key, {
            ...bucket,
            expireAt,
        });
    }

    private cleanupExpiredBuckets() {
        const currentTime = Date.now();

        for (const [key, bucket] of this.store.entries()) {
            if (bucket.expireAt <= currentTime) {
                this.store.delete(key);
            }
        }
    }

    private getFixedWindowExpiry(windowSizeMs: number, currentTime: number) {
        return currentTime + windowSizeMs * 2;
    }

    private getSlidingWindowExpiry(windowSizeMs: number, currentTime: number) {
        return currentTime + windowSizeMs * 2;
    }

    private getTokenBucketExpiry(capacity: number, refillRatePerSecond: number, currentTime: number) {
        if (refillRatePerSecond <= 0) {
            return currentTime + 60_000;
        }

        const refillDurationMs = Math.ceil((capacity / refillRatePerSecond) * 1000);
        return currentTime + Math.max(60_000, refillDurationMs * 2);
    }

    private getLeakyBucketExpiry(capacity: number, leakRatePerSecond: number, currentTime: number) {
        if (leakRatePerSecond <= 0) {
            return currentTime + 60_000;
        }

        const drainDurationMs = Math.ceil((capacity / leakRatePerSecond) * 1000);
        return currentTime + Math.max(60_000, drainDurationMs * 2);
    }

   

    async executeFixedWindow(identifier: string, maxRequests: number, windowSizeMs: number): Promise<RateLimitResult> {

        const key = getKey(identifier, "fixed-window");
        let currentTime = Date.now();

        let bucket = this.getBucket(key);

        if (!bucket) {
            bucket = {
                requests: 0,
                windowStart: currentTime,
                expireAt: this.getFixedWindowExpiry(windowSizeMs, currentTime),
            }

        }

        let requestsProcessed = bucket.requests;
        let lastWindowStart = bucket.windowStart;


        if (currentTime - lastWindowStart >= windowSizeMs) {
            requestsProcessed = 0;
            lastWindowStart = currentTime;
        }
        let result: RateLimitResult;
        if (requestsProcessed < maxRequests) {
            result = {
                allowed: true,
                retryAfterMs: 0,
                limit: maxRequests,
                remaining: maxRequests - (requestsProcessed+1),
            }
            this.setBucket(key, {
                requests: requestsProcessed + 1,
                windowStart: lastWindowStart,
            }, this.getFixedWindowExpiry(windowSizeMs, currentTime));

        }
        else {
            result = {
                allowed: false,
                retryAfterMs: windowSizeMs - (currentTime - lastWindowStart),
                limit: maxRequests,
                remaining: 0,
            }

            this.setBucket(key, {
                requests: requestsProcessed,
                windowStart: lastWindowStart,
            }, this.getFixedWindowExpiry(windowSizeMs, currentTime));



        }

        return result;
    }

    async executeTokenBucket(identifier: string, capacity: number, refillRatePerSecond: number): Promise<RateLimitResult> {

        const key = getKey(identifier, "token-bucket");

        let currentTime = Date.now();

        let bucket = this.getBucket(key);

        if (!bucket) {

            bucket = {
                tokens: capacity,
                lastRefill: currentTime,
                expireAt: this.getTokenBucketExpiry(capacity, refillRatePerSecond, currentTime),
            }
        }

        let tokensLeft = bucket.tokens;
        let lastRefill = bucket.lastRefill;

        const elapsedTime = currentTime - lastRefill;
        const earnedTokens = elapsedTime * refillRatePerSecond / 1000;

        tokensLeft = Math.min(capacity, tokensLeft + earnedTokens);

        lastRefill = currentTime;

        let result: RateLimitResult;

        if (tokensLeft >= 1) {   // enough tokens to process the request
            tokensLeft -= 1;

            this.setBucket(key, {
                tokens: tokensLeft,
                lastRefill: lastRefill,
            }, this.getTokenBucketExpiry(capacity, refillRatePerSecond, currentTime));

            result = {
                allowed: true,
                retryAfterMs: 0,
                limit: capacity,
                remaining: tokensLeft,
            }


        }
        else {

            this.setBucket(key, {
                tokens: tokensLeft,
                lastRefill: lastRefill,
            }, this.getTokenBucketExpiry(capacity, refillRatePerSecond, currentTime));

            const requiredTokens = 1 - tokensLeft;
            const retryAfterMs = requiredTokens / refillRatePerSecond * 1000;

            result = {
                allowed: false,
                retryAfterMs: retryAfterMs,
                limit: capacity,
                remaining: 0,


            }
        }

        return result;
    }




    async executeLeakyBucket(identifier: string, capacity: number, leakRatePerSecond: number): Promise<RateLimitResult> {

        const key =getKey(identifier, "leaky-bucket");

        let currentTime = Date.now();

        let bucket = this.getBucket(key);

        if (!bucket) {
            bucket = {
                water: 0,
                lastLeak: currentTime,
                expireAt: this.getLeakyBucketExpiry(capacity, leakRatePerSecond, currentTime),
            }
        }

        let waterLevel = bucket.water;
        let lastLeakTime = bucket.lastLeak;

        const elapsedTime = currentTime - lastLeakTime;
        const leakedWater = elapsedTime * leakRatePerSecond / 1000;

        lastLeakTime = currentTime;

        waterLevel = Math.max(0, waterLevel - leakedWater);

        // now check whether this request can be processed or not
        let result: RateLimitResult;

        if (waterLevel + 1 <= capacity) {
            waterLevel += 1;


            this.setBucket(key, {
                water: waterLevel,
                lastLeak: lastLeakTime,
            }, this.getLeakyBucketExpiry(capacity, leakRatePerSecond, currentTime));

            result = {
                allowed: true,
                retryAfterMs: 0,
                limit: capacity,
                remaining: capacity - Math.ceil(waterLevel),

            }
        }

        else {
            this.setBucket(key, {
                water: waterLevel,
                lastLeak: lastLeakTime,

            }, this.getLeakyBucketExpiry(capacity, leakRatePerSecond, currentTime));
            let requiredLeak = 1 - (capacity - waterLevel);
            let retryAfterMs = requiredLeak / leakRatePerSecond * 1000;

            result = {
                allowed: false,
                retryAfterMs: retryAfterMs,
                limit: capacity,
                remaining: 0,
            }
        }

        return result
    };


    async executeSlidingWindow(identifier: string, maxRequests: number, windowSizeMs: number): Promise<RateLimitResult> {

        const key =getKey(identifier, "sliding-window-log");

        const currentTime = Date.now();

        let bucket = this.getBucket(key);

        if (!bucket) {

            bucket = {
                timestamps: [],
                expireAt: this.getSlidingWindowExpiry(windowSizeMs, currentTime),

            }
        }

        //  remove the expire times 
        let filteredBucket = bucket.timestamps.filter((t: number) => currentTime - t < windowSizeMs);

        let result: RateLimitResult;

        if (filteredBucket.length < maxRequests) {
            //       let the request  processed 
            filteredBucket.push(currentTime);

            this.setBucket(key, {
                timestamps: filteredBucket,
            }, this.getSlidingWindowExpiry(windowSizeMs, currentTime));

            result = {
                allowed: true,
                retryAfterMs: 0,
                limit: maxRequests,
                remaining: maxRequests - filteredBucket.length
            }





        }

        else {
            // cannot proceed with this request
            this.setBucket(key, {
                timestamps: filteredBucket,
            }, this.getSlidingWindowExpiry(windowSizeMs, currentTime));
            const oldest = filteredBucket[0];
            const retryAfterMs = windowSizeMs - (currentTime - oldest);
            result = {
                allowed: false,
                retryAfterMs: retryAfterMs,
                limit: maxRequests,
                remaining: 0,
            }




        }

        return result;






    }

    async executeSlidingWindowCounter(identifier: string, maxRequests: number, windowSizeMs: number): Promise<RateLimitResult> {

        const key = getKey(identifier, "sliding-window-counter");

        const currentTime = Date.now();

        let bucket = this.getBucket(key);

        if (!bucket) {
            bucket = {
                currentWindow: 0,
                previousWindow: 0,
                windowStart: currentTime,
                expireAt: this.getSlidingWindowExpiry(windowSizeMs, currentTime),


            }
        }

        let elapsedTime = currentTime - bucket.windowStart;
        let currentWindowRequestCount = bucket.currentWindow;
        let previousWindowRequestCount= bucket.previousWindow;

        if (elapsedTime >= 2 * windowSizeMs) {
            previousWindowRequestCount = 0;
            currentWindowRequestCount = 0;
            bucket.windowStart = currentTime;
            elapsedTime = 0;
        }
        else if (elapsedTime >= windowSizeMs) {
            previousWindowRequestCount = currentWindowRequestCount;
            currentWindowRequestCount = 0;
            bucket.windowStart = currentTime;
            elapsedTime = 0;
        }
        let weight = (windowSizeMs - elapsedTime) / windowSizeMs;

        let estimatedCount = currentWindowRequestCount+ previousWindowRequestCount * weight;

        let result: RateLimitResult;

        if (estimatedCount < maxRequests) {
            this.setBucket(key, {
                currentWindow: currentWindowRequestCount + 1,
                previousWindow: previousWindowRequestCount,
                windowStart: bucket.windowStart,
            }, this.getSlidingWindowExpiry(windowSizeMs, currentTime));

            result = {
                allowed: true,
                retryAfterMs: 0,
                limit: maxRequests,
                remaining: Math.max(0, Math.floor(maxRequests - estimatedCount -1)),
            }

        }

        else {
            this.setBucket(key, {
                currentWindow:currentWindowRequestCount,
                previousWindow:previousWindowRequestCount,
                windowStart: bucket.windowStart,
            }, this.getSlidingWindowExpiry(windowSizeMs, currentTime));

            result = {
                allowed: false,
                retryAfterMs: windowSizeMs - elapsedTime,
                limit: maxRequests,
                remaining: Math.max(0, maxRequests - Math.ceil(estimatedCount))
            }


        }

        return result;
    }
}