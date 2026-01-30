import redis from "redis";

const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

client.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
    if (!client.isOpen) {
        await client.connect();
        console.log("Redis conectado 🚀");
    }
})();

export default client;