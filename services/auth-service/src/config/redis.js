import { createClient } from "redis";

const redis = createClient({
    url: "redis://redis-auth:6379"
});

redis.on("error", (err) => {
    console.error("Redis Error:", err);
});

await redis.connect();

export default redis;
