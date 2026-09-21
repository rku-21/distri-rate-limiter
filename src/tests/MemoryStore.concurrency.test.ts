import {describe, expect, it,vi} from "vitest";
import { MemoryStore } from "../store/MemoryStore";
import { RateLimitResult } from "../Interfaces/rateLimitResult";

describe("MemoryStore -  Concurrency", ()=>{

    it("should not allow more requests than the configured limit", async ()=>{

        const store=new MemoryStore();

        const limit = 100;
        const totalRequests = 1000;

        const requests = Array.from(
            {
                length : totalRequests
            },
            ()=>{
                 return store.executeFixedWindow("concurrent-user", limit, 10_000);
            }
        );

        const results = await Promise.all(requests);

        const allowedRequests = results.filter((result)=> result.allowed).length;
        const rejectedRequests = results.filter((result)=> !result.allowed).length;

        expect(allowedRequests).toBe(limit);
        expect(rejectedRequests).toBe(totalRequests - limit);

    });

    it("should keep the concurrent users isolated", async ()=>{
        const store = new MemoryStore();

        const limit = 10; 

        const totalRequestsPerUser=100;

        const user1Requests = Array.from(
            {
                length : totalRequestsPerUser
            },
            ()=> {
                return store.executeFixedWindow(
                    "user-1",
                    limit,
                    10_000,
                )
            }

        );

        const user2Requests = Array.from(
            {
                length : totalRequestsPerUser
            },
            ()=>{
                return store.executeFixedWindow(
                    "user-2",
                    limit, 
                    10_000,
                )
            }
        );

        const results = await Promise.all([...user1Requests, ...user2Requests]);

        const user1Allowed =results.slice(0,totalRequestsPerUser).filter((result)=> result.allowed).length;
        const user2Allowed=results.slice(totalRequestsPerUser).filter((result)=> result.allowed).length;
        
        expect(user1Allowed).toBe(limit);
        expect(user2Allowed).toBe(limit);

    })





})