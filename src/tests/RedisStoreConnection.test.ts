import  {describe, expect, vi, it } from "vitest";
import { getTestRedisStore, setupRedisLifeCycle } from "./helpers/redisHelper";

describe("Redis Connection", ()=>{
     setupRedisLifeCycle();

     it("connects to redis and responds to ping", async ()=>{
          const store=getTestRedisStore();
          const result=await store.ping();

          expect(result).toBe("PONG");
     })
})

