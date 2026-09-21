import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTestIdentifier, getTestRedisStore, setupRedisLifeCycle } from "./helpers/redisHelper";
import { RateLimiterStore } from "../store/RateLimiterStore";

describe("RedisStore - Token Bucket", () => {
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

    it("starts with a full bucket and consumes one token per request", async () => {
        const capacity = 3;
        const refillRate = 1;

        const first = await store.executeTokenBucket(getTestIdentifier("user-1"), capacity, refillRate);
        const second = await store.executeTokenBucket(getTestIdentifier("user-1"), capacity, refillRate);
        const third = await store.executeTokenBucket(getTestIdentifier("user-1"), capacity, refillRate);

        expect(first.allowed).toBe(true);
        expect(first.remaining).toBe(2);
        expect(second.allowed).toBe(true);
        expect(second.remaining).toBe(1);
        expect(third.allowed).toBe(true);
        expect(third.remaining).toBe(0);
    });

    it("rejects when there is not enough token", async () => {
        const capacity = 2;
        const refillRate = 1;

        await store.executeTokenBucket(getTestIdentifier("user-2"), capacity, refillRate);
        await store.executeTokenBucket(getTestIdentifier("user-2"), capacity, refillRate);
        const rejected = await store.executeTokenBucket(getTestIdentifier("user-2"), capacity, refillRate);

        expect(rejected.allowed).toBe(false);
        expect(rejected.remaining).toBe(0);
        expect(rejected.retryAfterMs).toBeGreaterThan(0);
    });

    it("refills tokens over time", async () => {
        const capacity = 2;
        const refillRate = 1;

        await store.executeTokenBucket(getTestIdentifier("user-3"), capacity, refillRate);
        await store.executeTokenBucket(getTestIdentifier("user-3"), capacity, refillRate);
        const rejected = await store.executeTokenBucket(getTestIdentifier("user-3"), capacity, refillRate);

        expect(rejected.allowed).toBe(false);

        vi.advanceTimersByTime(1000);

        const allowedAgain = await store.executeTokenBucket(getTestIdentifier("user-3"), capacity, refillRate);

        expect(allowedAgain.allowed).toBe(true);
        expect(allowedAgain.remaining).toBe(0);
    });

    it("keeps identifiers isolated", async () => {
        const capacity = 1;
        const refillRate = 1;

        const userOne = await store.executeTokenBucket(getTestIdentifier("user-one"), capacity, refillRate);
        const userTwo = await store.executeTokenBucket(getTestIdentifier("user-two"), capacity, refillRate);

        expect(userOne.allowed).toBe(true);
        expect(userTwo.allowed).toBe(true);
    });
});
