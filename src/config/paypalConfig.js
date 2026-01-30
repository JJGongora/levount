import { Client, Environment, LogLevel } from "@paypal/paypal-server-sdk";
import appError from "../utils/appError.js";

const clientCache = new Map();

function createPayPalClient(clientId, clientSecret, isProduction) {    
    //console.log(clientId, clientSecret, isProduction);
    
    const cacheKey = isProduction ? 'production' : 'sandbox';
    if (clientCache.has(cacheKey)) {
        return clientCache.get(cacheKey);
    }

    const env = isProduction ? Environment.Production : Environment.Sandbox;

    const client = new Client({
        clientCredentialsAuthCredentials: {
            oAuthClientId: clientId,
            oAuthClientSecret: clientSecret
        },
        environment: env
    });
    clientCache.set(cacheKey, client);

    return client;
}

export default createPayPalClient;