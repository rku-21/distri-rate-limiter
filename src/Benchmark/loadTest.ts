import { ModuleResolutionKind } from "typescript";
import {MemoryStore} from "../store/MemoryStore";




type Scenario = {
   name : string;
   limit : number;
   users : number;

};

type Result = {
    allowed : number;
    rejected :number;
    durationMs : number;
    throughput :number;
    p50 :number;
    p90 : number;
    p95 : number;
    p99 : number;
}

const LOADS =[10_000, 50_000, 100_000];

const SCENARIOS: Scenario[] = [
  {
    name: "All Allowed",
    limit: Number.MAX_SAFE_INTEGER,
    users: 100,
  },
  {
    name: "Heavy Rejection",
    limit: 100,
    users: 1,
  },
  {
    name: "Multiple Users",
    limit: 100,
    users: 1_000,
  },
];



function percentile(values : number[], percentileValue : number ) : number{
    if(values.length ===0) return 0;

    const sorted = [...values].sort((a,b)=> a-b);

    const index= Math.ceil((percentileValue /100) * sorted.length) -1;
    
    return sorted[Math.max(0, index)];
}

async function runScenario (store :MemoryStore, totalRequests : number, scenario : Scenario) : Promise<Result> {
    const latencies : number[]=[];

    let allowed =0;
    let rejected =0;

    const start = performance.now();
    const results= await Promise.all(
        Array.from(
            {length : totalRequests},
            async (_ , index) =>{

                const userId =`user-${index % scenario.users}`;
                const operationStart = performance.now();

                const result = await store.executeFixedWindow(userId, scenario.limit, 60_000);

                const operationEnd=performance.now();

                return {
                    allowed: result.allowed,
                    latency : operationEnd - operationStart,
                }
            }
        )
    );

    const end = performance.now();

    for(const result of results){
        latencies.push(result.latency);

        if(result.allowed){
            allowed++;
        }
        else {
            rejected++;
        }

    }

    const durationMs = end -start ;

    const throughput = totalRequests /(durationMs/1000);

    return {
        allowed,
        rejected,
        durationMs,
        throughput,
        p50 : percentile(latencies,50),
        p90 : percentile(latencies, 90),
        p95 :percentile(latencies,95),
        p99 : percentile(latencies, 99),
    }



}

async function warmUp(store: MemoryStore) {
  console.log("Warming up...");

  await Promise.all(
    Array.from({ length: 5_000 }, (_, index) =>
      store.executeFixedWindow(
        `warmup-${index % 100}`,
        10_000,
        60_000
      )
    )
  );

  console.log("WarmUp completed");
}

function printResult(load :number, scenario : Scenario , result : Result) {

    console.log(`\n${load.toLocaleString()} requests | ${scenario.name}`);

    console.log(`Allowed : ${result.allowed}`);
    console.log(`Rejected : ${result.rejected}`);
    console.log(`Total Time : ${result.durationMs.toFixed(2)}`);
    console.log(`Throughput : ${result.throughput} req/sec`);
    console.log(`p50 latency : ${result.p50.toFixed(4)} ms`);
    console.log(`p90 latency : ${result.p90.toFixed(4)} ms`);
    console.log(`p95 latency : ${result.p95.toFixed(4)} ms`);
    console.log(`p99 latency : ${result.p99.toFixed(4)} ms`);
}

async function main(){
    console.log(" DistriLimit Load BenchMark");
    console.log("===============================");

    const warmUpStore = new MemoryStore();

    await warmUp(warmUpStore);

    for(const Load of LOADS){
        for(const scenario of SCENARIOS){

            const store = new MemoryStore();

            const result = await runScenario(store, Load, scenario);
            printResult(Load, scenario, result);
        }
    }
    console.log("end of process");

};
main().catch((error)=>{
    console.log("load test failed");
  

});












