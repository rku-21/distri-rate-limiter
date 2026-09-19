import { describe } from "node:test";
import { beforeEach, afterEach, expect, vi, it } from "vitest";
import { MemoryStore } from "../store/MemoryStore";

describe("MemoryStore -  sliding Window log", async ()=>{

    let store : MemoryStore;

    beforeEach(()=>{
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026,0,1));
    })

    afterEach(()=>{
        vi.useRealTimers();
    })

    store = new MemoryStore();

    it("allow the requests till the maximum limit", async()=>{
        const maxRequests=3;
        const windowSizeMs=1000;

        const first=await store.executeSlidingWindow("user-1", maxRequests, windowSizeMs);
        const second=await store.executeSlidingWindow("user-1", maxRequests, windowSizeMs);
        const third=await store.executeSlidingWindow("user-1", maxRequests, windowSizeMs);
        
        expect(first.allowed).toBe(true);
        expect(first.remaining).toBe(2);

        expect(second.allowed).toBe(true);
        expect(second.remaining).toBe(1);

        expect(third.allowed).toBe(true);
        expect(third.remaining).toBe(0);
    });

    it("reject the requests once the window have allowed enough requests in this window", async ()=>{

        const maxRequests=3;
        const windowSizeMs=1000;

        for(let i=0; i<maxRequests; i++){
            await store.executeSlidingWindow("user-2",maxRequests, windowSizeMs);

        }

        const rejected=await store.executeSlidingWindow("user-2", maxRequests, windowSizeMs);

        expect(rejected.allowed).toBe(false);
        expect(rejected.remaining).toBe(0);
        expect(rejected.retryAfterMs).toBeGreaterThan(0);
    });

    it("allow the request once the window moves forward and have processed request count  < maxRequests", async ()=>{
        const maxRequests=3;
        const windowSizeMs=1000;
        
        for(let i=0; i<maxRequests; i++){
            await store.executeSlidingWindow("user-3", maxRequests, windowSizeMs);
        }

        const rejected=await store.executeSlidingWindow("user-3", maxRequests, windowSizeMs);

        expect(rejected.allowed).toBe(false);
        
        vi.advanceTimersByTime(1000);

        const allowedAgain=await store.executeSlidingWindow("user-3", maxRequests, windowSizeMs);

        expect(allowedAgain.allowed).toBe(true);
    })

    it("keeps the identifiers isolated", async ()=> {

       const maxRequests=1;
       const windowSizeMs=1000;

        const userOne=await store.executeSlidingWindow("user-one",maxRequests,windowSizeMs);
        const userTwo=await store.executeSlidingWindow("user-Two", maxRequests, windowSizeMs);

        expect(userOne.allowed).toBe(true);
        expect(userTwo.allowed).toBe(true);
    });
});

