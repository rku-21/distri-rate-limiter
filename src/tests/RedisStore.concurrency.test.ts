import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTestIdentifier, getTestRedisStore, setupRedisLifeCycle } from "./helpers/redisHelper";
import { RateLimiterStore } from "../store/RateLimiterStore";

describe("RedisStore - Concurrency", () => {
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

    it("does not allow more requests than the configured limit", async () => {
        const limit = 100;
        const totalRequests = 1000;
        const requests = Array.from(
            { length: totalRequests },
            () => store.executeFixedWindow(
                getTestIdentifier("concurrent-user"),
                limit,
                10_000,
            ),
        );

        const results = await Promise.all(requests);
        const allowedRequests = results.filter((result) => result.allowed).length;
        const rejectedRequests = results.filter((result) => !result.allowed).length;

        expect(allowedRequests).toBe(limit);
        expect(rejectedRequests).toBe(totalRequests - limit);
    });

    it("keeps concurrent users isolated", async () => {
        const limit = 10;
        const totalRequestsPerUser = 100;

        const userOneRequests = Array.from(
            { length: totalRequestsPerUser },
            () => store.executeFixedWindow(
                getTestIdentifier("concurrent-user-one"),
                limit,
                10_000,
            ),
        );
        const userTwoRequests = Array.from(
            { length: totalRequestsPerUser },
            () => store.executeFixedWindow(
                getTestIdentifier("concurrent-user-two"),
                limit,
                10_000,
            ),
        );

        const results = await Promise.all([...userOneRequests, ...userTwoRequests]);
        const userOneAllowed = results
            .slice(0, totalRequestsPerUser)
            .filter((result) => result.allowed).length;
        const userTwoAllowed = results
            .slice(totalRequestsPerUser)
            .filter((result) => result.allowed).length;

        expect(userOneAllowed).toBe(limit);
        expect(userTwoAllowed).toBe(limit);
    });
});
