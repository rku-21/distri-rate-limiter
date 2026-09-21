import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTestIdentifier, getTestRedisStore, setupRedisLifeCycle } from "./helpers/redisHelper";
import { RateLimiterStore } from "../store/RateLimiterStore";

describe("RedisStore - Leaky Bucket", () => {
    setupRedisLifeCycle();

    let store: RateLimiterStore;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 0, 1));
        store = getTestRedisStore();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("starts with the full bucket and consumes one token per request", async () => {
        const capacity = 3;
        const leakRatePerSecond = 1;

        const first = await store.executeLeakyBucket(getTestIdentifier("user-1"), capacity, leakRatePerSecond);
        const second = await store.executeLeakyBucket(getTestIdentifier("user-1"), capacity, leakRatePerSecond);
        const third = await store.executeLeakyBucket(getTestIdentifier("user-1"), capacity, leakRatePerSecond);

        expect(first.allowed).toBe(true);
        expect(first.remaining).toBe(2);
        expect(second.allowed).toBe(true);
        expect(second.remaining).toBe(1);
        expect(third.allowed).toBe(true);
        expect(third.remaining).toBe(0);
    });

    it("rejects the request when the bucket is full", async () => {
        const capacity = 3;
        const leakRatePerSecond = 1;

        for (let i = 0; i < capacity; i++) {
            await store.executeLeakyBucket(getTestIdentifier("user-2"), capacity, leakRatePerSecond);
        }

        const rejected = await store.executeLeakyBucket(getTestIdentifier("user-2"), capacity, leakRatePerSecond);

        expect(rejected.allowed).toBe(false);
        expect(rejected.remaining).toBe(0);
        expect(rejected.retryAfterMs).toBeGreaterThan(0);
    });

    it("allows the request again after the bucket has space", async () => {
        const capacity = 3;
        const leakRatePerSecond = 1;

        for (let i = 0; i < capacity; i++) {
            await store.executeLeakyBucket(getTestIdentifier("user-3"), capacity, leakRatePerSecond);
        }

        const rejected = await store.executeLeakyBucket(getTestIdentifier("user-3"), capacity, leakRatePerSecond);

        expect(rejected.allowed).toBe(false);

        vi.advanceTimersByTime(1000);

        const allowedAgain = await store.executeLeakyBucket(getTestIdentifier("user-3"), capacity, leakRatePerSecond);

        expect(allowedAgain.allowed).toBe(true);
        expect(allowedAgain.remaining).toBe(0);
    });

    it("keeps identifiers isolated", async () => {
        const capacity = 1;
        const leakRatePerSecond = 1;

        const userOne = await store.executeLeakyBucket(getTestIdentifier("user-one"), capacity, leakRatePerSecond);
        const userTwo = await store.executeLeakyBucket(getTestIdentifier("user-two"), capacity, leakRatePerSecond);

        expect(userOne.allowed).toBe(true);
        expect(userTwo.allowed).toBe(true);
    });
});
