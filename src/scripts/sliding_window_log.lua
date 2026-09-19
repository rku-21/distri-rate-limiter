local key=KEYS[1]

local maxRequests=tonumber(ARGV[1]);
local windowSizeMs=tonumber(ARGV[2]);
local currentTime=tonumber(ARGV[3]);

local windowStart=currentTime-windowSizeMs;

--  remove expired requests
redis.call (
    "ZREMRANGEBYSCORE",
    key,
    "-inf",
    windowStart
)

--  count the number of current requests 
local currentRequests=redis.call (
    "ZCARD",
    key
)

--  Reject the requests

if currentRequests>= maxRequests then

    local oldestRequest=redis.call(
        "ZRANGE",
        key,
        0,
        0,
        "WITHSCORES"
    )

    local retryAfterMs=windowSizeMs-(currentTime- tonumber(oldestRequest[2]));

    redis.call(
        "PEXPIRE",
        key,
        windowSizeMs
    )

    return {0,retryAfterMs,maxRequests,0};

end 


--  Allow the requests

redis.call(
    "ZADD",
    key,
    currentTime,
    tostring(currentTime).."-"..math.random()
)

redis.call(
     "PEXPIRE",
     key,
     windowSizeMs
)

return {1,0,maxRequests,maxRequests-currentRequests};

