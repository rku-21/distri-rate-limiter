import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTestIdentifier, getTestRedisStore, setupRedisLifeCycle } from "./helpers/redisHelper";
import { RateLimiterStore } from "../store/RateLimiterStore";

describe("RedisStore - Sliding Window Log", () => {
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

    it("allows the requests till the maximum limit", async () => {
        const maxRequests = 3;
        const windowSizeMs = 1000;

        const first = await store.executeSlidingWindow(getTestIdentifier("user-1"), maxRequests, windowSizeMs);
        const second = await store.executeSlidingWindow(getTestIdentifier("user-1"), maxRequests, windowSizeMs);
        const third = await store.executeSlidingWindow(getTestIdentifier("user-1"), maxRequests, windowSizeMs);

        expect(first.allowed).toBe(true);
        expect(first.remaining).toBe(2);
        expect(second.allowed).toBe(true);
        expect(second.remaining).toBe(1);
        expect(third.allowed).toBe(true);
        expect(third.remaining).toBe(0);
    });

    it("rejects requests once the window reaches its limit", async () => {
        const maxRequests = 3;
        const windowSizeMs = 1000;

        for (let i = 0; i < maxRequests; i++) {
            await store.executeSlidingWindow(getTestIdentifier("user-2"), maxRequests, windowSizeMs);
        }

        const rejected = await store.executeSlidingWindow(getTestIdentifier("user-2"), maxRequests, windowSizeMs);

        expect(rejected.allowed).toBe(false);
        expect(rejected.remaining).toBe(0);
        expect(rejected.retryAfterMs).toBeGreaterThan(0);
    });

    it("allows the request once the window moves forward", async () => {
        const maxRequests = 3;
        const windowSizeMs = 1000;

        for (let i = 0; i < maxRequests; i++) {
            await store.executeSlidingWindow(getTestIdentifier("user-3"), maxRequests, windowSizeMs);
        }

        const rejected = await store.executeSlidingWindow(getTestIdentifier("user-3"), maxRequests, windowSizeMs);

        expect(rejected.allowed).toBe(false);

        vi.advanceTimersByTime(windowSizeMs);

        const allowedAgain = await store.executeSlidingWindow(getTestIdentifier("user-3"), maxRequests, windowSizeMs);

        expect(allowedAgain.allowed).toBe(true);
    });

    it("keeps identifiers isolated", async () => {
        const maxRequests = 1;
        const windowSizeMs = 1000;

        const userOne = await store.executeSlidingWindow(getTestIdentifier("user-one"), maxRequests, windowSizeMs);
        const userTwo = await store.executeSlidingWindow(getTestIdentifier("user-two"), maxRequests, windowSizeMs);

        expect(userOne.allowed).toBe(true);
        expect(userTwo.allowed).toBe(true);
    });
});
