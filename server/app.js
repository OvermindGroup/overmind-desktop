import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import axios from 'axios';
import cors from 'cors';
import CryptoJS from 'crypto-js';
import ccxt from 'ccxt';

const serverApp = express();
serverApp.use(cors());
serverApp.use(express.json());

// Function to create Binance signature
async function createBinanceSignature(secretKey, params) {
  const paramsString = Object.entries(params)
                             .map(([key, value]) => `${key}=${value}`)
                             .join('&');

  const signature = CryptoJS.HmacSHA256(paramsString, secretKey).toString(CryptoJS.enc.Hex);

  return signature;
}

export function shutdownServer() {
  console.log('Shutting down server...');

  server.close(() => {
    console.log('Closed out remaining connections');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);

  connections.forEach(curr => curr.end());
  setTimeout(() => connections.forEach(curr => curr.destroy()), 5000);
}

serverApp.post('/api/v1/portfolio/bullish', async (req, res) => {
  try {
    const url = "http://localhost:1989/v1/results/portfolio-bullish";
    const { overmindApiKey } = req.body;

    // const exchangeId = 'binance',
    //       exchangeClass = ccxt[exchangeId],
    //       exchange = new exchangeClass ({
    //         'apiKey': binanceApiKey,
    //         'secret': binanceSecretKey,
    //       })
    // await exchange.loadMarkets()
    // const market = exchange.market('BTC/USDT')
    // console.log({market})

    console.log({ overmindApiKey })
    const token = `Bearer ${overmindApiKey}`;
    const headers = {
      Authorization: token,
    };

    const response = await axios.get(url, { headers });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

serverApp.post('/api/v1/shutdown', async (req, res) => {
  shutdownServer()
});

serverApp.post('/api/v1/openOrders', async (req, res) => {
  try {
    const { apiKey, secretKey } = req.body;
    const now = Date.now();

    const params = {
      timestamp: now
    };

    const signature = await createBinanceSignature(secretKey, params);
    params.signature = signature;

    const baseUrl = 'https://api3.binance.com';
    const endpoint = '/sapi/v3/asset/getUserAsset';
    const url = `${baseUrl}${endpoint}?${new URLSearchParams(params)}`;

    const headers = {
      'X-MBX-APIKEY': apiKey,
    };

    const response = await axios.post(url, null, {headers}).catch((error) => { console.log(error) });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching open orders:', error.message);
    res.status(500).json({ error: 'An error occurred' });
  }
});

serverApp.post('/api/v1/accountSnapshot', async (req, res) => {
  try {
    const { apiKey, secretKey } = req.body;
    const now = Date.now();

    const params = {
      timestamp: now,
      type: "SPOT"
    };

    const signature = await createBinanceSignature(secretKey, params);
    params.signature = signature;

    const baseUrl = 'https://api3.binance.com';
    const endpoint = '/sapi/v1/accountSnapshot';
    const url = `${baseUrl}${endpoint}?${new URLSearchParams(params)}`;

    const headers = {
      'X-MBX-APIKEY': apiKey,
    };

    const response = await axios.get(url, {headers}).catch((error) => { console.log(error) });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching open orders:', error.message);
    res.status(500).json({ error: 'An error occurred' });
  }
});

serverApp.post('/api/v1/exchangeInfo', async (req, res) => {
  try {
    const { fromAsset, toAsset, apiKey, secretKey } = req.body;
    const now = Date.now();

    const params = {
      timestamp: now,
      fromAsset,
      toAsset
    };

    const signature = await createBinanceSignature(secretKey, params);
    params.signature = signature;

    const baseUrl = 'https://api3.binance.com';
    const endpoint = '/sapi/v1/convert/exchangeInfo';
    const url = `${baseUrl}${endpoint}?${new URLSearchParams(params)}`;

    const headers = {
      'X-MBX-APIKEY': apiKey,
    };

    const response = await axios.get(url, {headers}).catch((error) => { console.log(error) });

    console.log(response.data)

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching open orders:', error.message);
    res.status(500).json({ error: 'An error occurred' });
  }
});

serverApp.post('/api/v1/convert/getQuote', async (req, res) => {
  try {
    const { fromAsset, toAsset, fromAmount, apiKey, secretKey } = req.body;
    const now = Date.now();

    const params = {
      timestamp: now,
      fromAsset,
      toAsset,
      fromAmount,
    };

    const signature = await createBinanceSignature(secretKey, params);
    params.signature = signature;

    const baseUrl = 'https://api3.binance.com';
    const endpoint = '/sapi/v1/convert/getQuote';
    const url = `${baseUrl}${endpoint}?${new URLSearchParams(params)}`;

    const headers = {
      'X-MBX-APIKEY': apiKey,
    };

    const response = await axios.post(url, null, {headers}).catch((error) => { console.log(error) });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching quote:', error.message);
    res.status(500).json({ error: 'An error occurred' });
  }
});

serverApp.post('/api/v1/convert/acceptQuote', async (req, res) => {
  try {
    const { apiKey, secretKey, quoteId } = req.body;

    const now = Date.now();
    const params = {
      timestamp: now,
      quoteId,
    };

    const signature = await createBinanceSignature(secretKey, params);
    params.signature = signature;

    const baseUrl = 'https://api3.binance.com';
    const endpoint = '/sapi/v1/convert/acceptQuote';
    const url = `${baseUrl}${endpoint}?${new URLSearchParams(params)}`;

    const headers = {
      'X-MBX-APIKEY': apiKey,
    };

    const response = await axios.post(url, null, { headers });

    res.json(response.data);
  } catch (error) {
    console.error('Error accepting quote:', error.message);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Start the server
const PORT = 3000; // Change to the desired port number
const server = serverApp.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

setInterval(() => server.getConnections(
    (err, connections) => console.log(`${connections} connections currently open`)
), 5000);

let connections = [];

server.on('connection', connection => {
    connections.push(connection);
    connection.on('close', () => connections = connections.filter(curr => curr !== connection));
});

process.on('SIGTERM', shutdownServer);
process.on('SIGINT', shutdownServer);
