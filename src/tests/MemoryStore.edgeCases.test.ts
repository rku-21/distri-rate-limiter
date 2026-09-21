import {describe, expect , it ,vi} from "vitest"
import { MemoryStore } from "../store/MemoryStore"

describe("MemoryStore -  Edge Cases", ()=>{
    
    describe("fixed window", ()=>{

        it("handles a limit of 1 correctly", async ()=>{
            const store= new MemoryStore();

            const first=await store.executeFixedWindow("user-1",1,1000);
            const second=await store.executeFixedWindow("user-1",1,1000);

            expect(first.allowed).toBe(true);
            expect(first.remaining).toBe(0);

            expect(second.allowed).toBe(false);
            expect(second.remaining).toBe(0);
        })

        it("resets correctly at the exact window boundary", async () => {
      vi.useFakeTimers();

      try {
        const store = new MemoryStore();

        const first = await store.executeFixedWindow(
          "user-1",
          1,
          1000
        );

        expect(first.allowed).toBe(true);

        vi.advanceTimersByTime(999);

        const beforeBoundary = await store.executeFixedWindow(
          "user-1",
          1,
          1000
        );

        expect(beforeBoundary.allowed).toBe(false);

        vi.advanceTimersByTime(1);

        const atBoundary = await store.executeFixedWindow(
          "user-1",
          1,
          1000
        );

        expect(atBoundary.allowed).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });
     it("never returns a negative remaining value", async () => {
      const store = new MemoryStore();

      await store.executeFixedWindow("user-1", 2, 1000);
      await store.executeFixedWindow("user-1", 2, 1000);

      const third = await store.executeFixedWindow(
        "user-1",
        2,
        1000
      );

      const fourth = await store.executeFixedWindow(
        "user-1",
        2,
        1000
      );

      expect(third.allowed).toBe(false);
      expect(third.remaining).toBeGreaterThanOrEqual(0);

      expect(fourth.allowed).toBe(false);
      expect(fourth.remaining).toBeGreaterThanOrEqual(0);
    });

});
    describe("Token Bucket", () => {
    it("handles a capacity of 1 correctly", async () => {
      const store = new MemoryStore();

      const first = await store.executeTokenBucket(
        "user-1",
        1,
        1
      );

      const second = await store.executeTokenBucket(
        "user-1",
        1,
        1
      );

      expect(first.allowed).toBe(true);
      expect(first.remaining).toBe(0);

      expect(second.allowed).toBe(false);
      expect(second.remaining).toBe(0);
    });

    it("never exceeds capacity after refill", async () => {
      vi.useFakeTimers();

      try {
        const store = new MemoryStore();

        const first = await store.executeTokenBucket(
          "user-1",
          2,
          1
        );

        expect(first.allowed).toBe(true);

        vi.advanceTimersByTime(5000);

        const second = await store.executeTokenBucket(
          "user-1",
          2,
          1
        );

        expect(second.allowed).toBe(true);
        expect(second.remaining).toBeLessThanOrEqual(1);
      } finally {
        vi.useRealTimers();
      }
    });

    it("handles zero refill rate without creating new tokens", async () => {
      const store = new MemoryStore();

      const first = await store.executeTokenBucket(
        "user-1",
        1,
        0
      );

      const second = await store.executeTokenBucket(
        "user-1",
        1,
        0
      );

      expect(first.allowed).toBe(true);
      expect(second.allowed).toBe(false);
    });
  });

  describe("Leaky Bucket", () => {
    it("handles a capacity of 1 correctly", async () => {
      const store = new MemoryStore();

      const first = await store.executeLeakyBucket(
        "user-1",
        1,
        1
      );

      const second = await store.executeLeakyBucket(
        "user-1",
        1,
        1
      );

      expect(first.allowed).toBe(true);
      expect(second.allowed).toBe(false);
    });

    it("never exceeds capacity", async () => {
      const store = new MemoryStore();

      await store.executeLeakyBucket(
        "user-1",
        2,
        1
      );

      await store.executeLeakyBucket(
        "user-1",
        2,
        1
      );

      const third = await store.executeLeakyBucket(
        "user-1",
        2,
        1
      );

      expect(third.allowed).toBe(false);
    });
  });

  describe("Sliding Window Log", () => {
    it("handles a limit of 1 correctly", async () => {
      const store = new MemoryStore();

      const first = await store.executeSlidingWindow(
        "user-1",
        1,
        1000
      );

      const second = await store.executeSlidingWindow(
        "user-1",
        1,
        1000
      );

      expect(first.allowed).toBe(true);
      expect(second.allowed).toBe(false);
      expect(second.remaining).toBe(0);
    });

    it("removes a request exactly at the window boundary", async () => {
      vi.useFakeTimers();

      try {
        const store = new MemoryStore();

        const first = await store.executeSlidingWindow(
          "user-1",
          1,
          1000
        );

        expect(first.allowed).toBe(true);

        vi.advanceTimersByTime(999);

        const beforeBoundary = await store.executeSlidingWindow(
          "user-1",
          1,
          1000
        );

        expect(beforeBoundary.allowed).toBe(false);

        vi.advanceTimersByTime(1);

        const atBoundary = await store.executeSlidingWindow(
          "user-1",
          1,
          1000
        );

        expect(atBoundary.allowed).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("Sliding Window Counter", () => {
    it("handles a limit of 1 correctly", async () => {
      const store = new MemoryStore();

      const first = await store.executeSlidingWindowCounter(
        "user-1",
        1,
        1000
      );

      const second = await store.executeSlidingWindowCounter(
        "user-1",
        1,
        1000
      );

      expect(first.allowed).toBe(true);
      expect(second.allowed).toBe(false);
      expect(second.remaining).toBe(0);
    });


   


})

});