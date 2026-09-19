import {beforeEach , describe, expect, it ,vi} from "vitest";
import { MemoryStore } from "../store/MemoryStore";
import { afterEach } from "node:test";

//  Have to understand file fully 

describe("MemoryStore - Fixed Window", () => {

    let store : MemoryStore;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026,0,1));
        store = new MemoryStore();
    });

    afterEach(() => {
        vi.useRealTimers();
    })

    it("allows requests until the limit is reached", async()=> {
        const limit=3;
        const WindowSizeMs= 1000;


        const first = await store.executeFixedWindow("user-1", limit, WindowSizeMs);

        const second = await store.executeFixedWindow("user-1", limit, WindowSizeMs);

        const third = await store.executeFixedWindow("user-1", limit, WindowSizeMs);

        expect(first.allowed).toBe(true);
        expect(first.remaining).toBe(2);

        expect(second.allowed).toBe(true);
        expect(second.remaining).toBe(1);

        expect(third.allowed).toBe(true);
        expect(third.remaining).toBe(0);

    });

        it("rejects requests after the limit is reached", async () => {
        const limit = 3;
        const windowSizeMs = 1000;

        for (let i = 0; i < limit; i++) {
            await store.executeFixedWindow(
                "user-2",
                limit,
                windowSizeMs,
            );
        }

        const rejected = await store.executeFixedWindow(
            "user-2",
            limit,
            windowSizeMs,
        );

        expect(rejected.allowed).toBe(false);
        expect(rejected.remaining).toBe(0);
        expect(rejected.retryAfterMs).toBeGreaterThan(0);
    });

     it("allows requests again after the window expires", async () => {
        const limit = 2;
        const windowSizeMs = 1000;

        await store.executeFixedWindow(
            "user-3",
            limit,
            windowSizeMs,
        );

        await store.executeFixedWindow(
            "user-3",
            limit,
            windowSizeMs,
        );

        const rejected = await store.executeFixedWindow(
            "user-3",
            limit,
            windowSizeMs,
        );

        expect(rejected.allowed).toBe(false);

        vi.advanceTimersByTime(windowSizeMs);

        const allowedAgain = await store.executeFixedWindow(
            "user-3",
            limit,
            windowSizeMs,
        );

        expect(allowedAgain.allowed).toBe(true);
        expect(allowedAgain.remaining).toBe(1);
    });

    it("keeps identifiers isolated", async () => {
        const limit = 1;
        const windowSizeMs = 1000;

        const userOne = await store.executeFixedWindow(
            "user-one",
            limit,
            windowSizeMs,
        );

        const userTwo = await store.executeFixedWindow(
            "user-two",
            limit,
            windowSizeMs,
        );

        expect(userOne.allowed).toBe(true);
        expect(userTwo.allowed).toBe(true);
    });
  });


