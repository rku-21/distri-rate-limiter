import Redis from "ioredis";
import fs from "fs";
import path from "path";
import { RateLimiterStore } from "./RateLimiterStore";
import { getKey } from "../helperFunctions/getKey";

import { Bucket } from "../models/Bucket";
import { RateLimitResult } from "../Interfaces/rateLimitResult";

export class RedisStore implements RateLimiterStore {

    private readonly redis : Redis;
    private readonly tokenBucketLua : string;
    private readonly slidingWindowLogLua : string;
    private readonly slidingWindowCounterLua : string;
    private readonly fixedWindowLua:string;
    private readonly leakyBucketLua:string

    constructor(host : string ,port :number){
        this.redis=new Redis({
            host,
            port,
        })
    

         this.tokenBucketLua=fs.readFileSync(
            path.join(__dirname,"../scripts/token_bucket.lua"),
            "utf-8",
         )
         this.slidingWindowLogLua=fs.readFileSync(
            path.join(__dirname, "../scripts/sliding_window_log.lua"),
            "utf-8",
         )
         this.slidingWindowCounterLua=fs.readFileSync(
            path.join(__dirname,"../scripts/sliding_window_counter.lua"),
            "utf-8",
         )
         this.fixedWindowLua=fs.readFileSync(
            path.join(__dirname,"../scripts/fixed_window.lua"),
         "utf-8"
            
         )

         this.leakyBucketLua=fs.readFileSync(
            path.join(__dirname,"../scripts/leaky_bucket.lua"),
            "utf-8"
         )
    } 
    async executeTokenBucket(identifier: string, capacity: number, refillRatePerSecond: number): 
    Promise<RateLimitResult> {

        const key=getKey(identifier,"token-bucket");

        const result=await this.redis.eval(
            this.tokenBucketLua,
            1,
            key,
            capacity,
            refillRatePerSecond,
            Date.now(),
        ) as number[];

        return {
            allowed : result[0]===1,
            retryAfterMs : result[1],
            limit: result[2],
            remaining: result[3],
        };
        

    }
    
     async executeSlidingWindow(identifier: string, maxRequests: number, windowSizeMs: number):
     Promise<RateLimitResult> {

        const key=getKey(identifier,"sliding-window-log");

        const result= await this.redis.eval(
            this.slidingWindowLogLua,
            1,
            key,
            maxRequests,
            windowSizeMs,
            Date.now(),

        ) as number[];

        return {
            allowed : result[0]===1,
            retryAfterMs : result[1],
            limit: result[2],
            remaining: result[3],

        }
    }
    async executeSlidingWindowCounter(identifier: string, maxRequests: number, windowSizeMs: number):
     Promise<RateLimitResult> {


        const key=getKey(identifier,"sliding-window-counter");

        const result=await this.redis.eval(
            this.slidingWindowCounterLua,
            1,
            key,
            maxRequests,
            windowSizeMs,
            Date.now()
        ) as number[]

        return {
            allowed : result[0]===1,
            retryAfterMs : result[1],
            limit: result[2],
            remaining: result[3],
        }

        
    }

   

    


    async executeFixedWindow(identifier:string, maxRequests:number,windowSizeMs:number){
      
        const key=getKey(identifier,"fixed-window");
        const result=await this.redis.eval(
            this.fixedWindowLua,
            1,
            key,
            maxRequests,
            windowSizeMs,
            Date.now()
        ) as number[]

        return {
            allowed: result[0]===1,
            retryAfterMs: result[1],
            limit: result[2],
            remaining: result[3],
        }


    }
     
     async executeLeakyBucket(identifier:string, capacity:number,leakRatePerSecond:number){
        const key=getKey(identifier,"leaky-bucket")

        const result=await this.redis.eval(
            this.leakyBucketLua,
            1,
            key,
            capacity,
            leakRatePerSecond,
            Date.now(),
        ) as number[]

        return {
            allowed:result[0]==1,
            retryAfterMs:result[1],
            limit:result[2],
            remaining:result[3]
        }

    }

     async ping():Promise<string> {
        return await this.redis.ping();
    }

    async disconnect(): Promise<void> {
        await this.redis.quit();
    }
}