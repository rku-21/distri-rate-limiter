local key=KEYS[1];

local maxRequests=tonumber(ARGV[1]);
local windowSizeMs=tonumber(ARGV[2]);
local currentTime=tonumber(ARGV[3]);

local currentWindow=math.floor(currentTime/windowSizeMs);

local previousWindow=currentWindow-1;

local currentWindowStart=currentWindow*windowSizeMs;
local elapsedTime=currentTime-currentWindowStart;
local currentWindowWeight=elapsedTime/windowSizeMs;

--  reads counter 
local currentWindowRequestCount= tonumber(
    redis.call(
    "HGET",
    key,
    tostring(currentWindow)
)
) or 0;


local previousWindowRequestCount=tonumber(
    redis.call(
    "HGET",
    key,
    tostring(previousWindow)

    )
) or 0;


--- estimated count 

local estimatedCount=currentWindowRequestCount+previousWindowRequestCount * (1-currentWindowWeight);


--- process the requests (REJECT)

 if estimatedCount>= maxRequests then 
    local retryAfterMs=windowSizeMs-elapsedTime;

    redis.call(
        "PEXPIRE",
        key,
        windowSizeMs*2
    )

    return {0,retryAfterMs,maxRequests,0};
end

--- Allow
currentWindowRequestCount=currentWindowRequestCount+1;

redis.call(
    "HSET",
    key,
    tostring(currentWindow),
    currentWindowRequestCount
)

redis.call(
    "PEXPIRE",
    key,
    windowSizeMs*2
)

return {1,0,maxRequests,math.max(0,math.floor(maxRequests-estimatedCount-1))};



