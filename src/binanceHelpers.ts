import CryptoJS from 'crypto-js'; // Import crypto-js library
import axios from 'axios';

async function createBinanceSignature(apiKey, secretKey, params) {
    const paramsString = Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

    const signature = CryptoJS.HmacSHA256(paramsString, secretKey).toString(CryptoJS.enc.Hex);

    return signature;
}

export async function fetchOpenOrders(binanceApiKey, binanceSecretKey) {
    const now = Date.now();
    const params = {
        timestamp: now,
    };

    const signature = await createBinanceSignature(binanceApiKey, binanceSecretKey, params);

    const baseUrl = 'https://api.binance.com';
    const endpoint = '/api/v3/openOrders';
    const url = `${baseUrl}${endpoint}?${new URLSearchParams(params)}`;

    const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Access-Control-Allow-Origin'
    };

    try {
        const response = await axios.get(url, {
            headers: headers,
        });

        // Return the response data as a JSON object
        return response.data;
    } catch (error) {
        console.error('Error fetching open orders:', error.message);
        throw error;
    }
}
