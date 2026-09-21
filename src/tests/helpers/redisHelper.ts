import { RedisStore } from "../../store/redisStore";
import { afterAll, beforeAll } from "vitest";

let sharedStore : RedisStore  | null = null;
const testRunId = Math.random().toString(36).slice(2);

export function getTestRedisStore() : RedisStore {
    if(!sharedStore){
        sharedStore= new RedisStore("localhost", 6379);
    }
    return sharedStore;
}

export function getTestIdentifier(identifier: string): string {
    return `${testRunId}-${identifier}`;
}

export function setupRedisLifeCycle (){
    beforeAll(async ()=>{
        getTestRedisStore();

    });

    afterAll(async ()=>{
        if(sharedStore){
            await sharedStore.disconnect();
        }
    })



}


