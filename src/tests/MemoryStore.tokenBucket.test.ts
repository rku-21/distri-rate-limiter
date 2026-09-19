import {afterEach , beforeEach, describe, expect , it ,vi} from "vitest";
import { MemoryStore } from "../store/MemoryStore";


describe("MemoryStore - Token Bucket", ()=>{
    let store :MemoryStore;

    beforeEach(()=>{
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026,0,1));

        store = new MemoryStore();

    });

    afterEach(() => {
        vi.useRealTimers();
    });



    it("starts with a full bucket and consumes one token per request", async()=>{
        const capacity = 3;
        const refillRate = 1;

        const first = await store.executeTokenBucket(
            "user-1",
            capacity, 
            refillRate,
        );

        const second = await store.executeTokenBucket(
            "user-1",
            capacity, 
            refillRate,
        )

        const third = await store.executeTokenBucket(
            "user-1",
            capacity, 
            refillRate,
        )

        expect(first.allowed).toBe(true);
        expect(first.remaining).toBe(2);

        expect(second.allowed).toBe(true);
        expect(second.remaining).toBe(1);

        expect(third.allowed).toBe(true);
        expect(third.remaining).toBe(0);
    });


    it("rejects when there is not enough token", async () => {
        const capacity=2;
        const refillRate=1;

        await store.executeTokenBucket("user-2", capacity, refillRate);
        await store.executeTokenBucket("user-2", capacity, refillRate);
        const rejected = await store.executeTokenBucket("user-2", capacity, refillRate);

        expect(rejected.allowed).toBe(false);
        expect(rejected.remaining).toBe(0);
        expect(rejected.retryAfterMs).toBeGreaterThan(0);
    });

    it("refills tokens over time",  async ()=>{

        const capacity=2;
        const refillRate=1;

        await store.executeTokenBucket("user-3", capacity, refillRate);
        await store.executeTokenBucket("user-3", capacity, refillRate);
        const rejected=await store.executeTokenBucket("user-3", capacity, refillRate);

        expect(rejected.allowed).toBe(false);

        vi.advanceTimersByTime(1000);

        const allowedAgain =await store.executeTokenBucket("user-3", capacity , refillRate);

        expect(allowedAgain.allowed).toBe(true);
        expect(allowedAgain.remaining).toBe(0);



    });

    it("never exceeds bucket capacity", async () => {
        const capacity = 3;
        const refillRate = 10;

        const first = await store.executeTokenBucket(
            "user-4",
            capacity,
            refillRate,
        );

        vi.advanceTimersByTime(10_000);

        const second = await store.executeTokenBucket(
            "user-4",
            capacity,
            refillRate,
        );

        expect(first.remaining).toBe(2);
        expect(second.remaining).toBe(2);
        expect(second.remaining).toBeLessThanOrEqual(capacity);
    });


})