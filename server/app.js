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

function extractMinMaxQuote(inputString) {
  const pattern = /(\d+\.\d+)\s+(\d+\.\d+)/;
  const matches = inputString.match(pattern);

  if (matches) {
    const number1 = matches[1];
    const number2 = matches[2];
    return [number1, number2];
  } else {
    return null;
  }
}

serverApp.post('/api/v1/portfolio/train-bullish', async (req, res) => {
  try {
    const url = "http://localhost:1989/v1/portfolio/train-bullish";
    const { overmindApiKey,
            iterations,
            maxTradeHorizon,
            tpPercentage,
            slPercentage } = req.body;

    const token = `Bearer ${overmindApiKey}`;
    const headers = {
      Authorization: token,
    };

    const params = {
      iterations,
      maxTradeHorizon,
      tpPercentage,
      slPercentage
    }

    const fullUrl = `${url}?${new URLSearchParams(params)}`;

    const response = await axios.get(fullUrl, { headers });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

serverApp.post('/api/v1/info/news', async (req, res) => {
  try {
    const url = "http://localhost:1989/v1/info/news";
    const { overmindApiKey } = req.body;

    const token = `Bearer ${overmindApiKey}`;
    const headers = {
      Authorization: token,
    };

    const response = await axios.get(url, { headers });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

serverApp.post('/api/v1/results/simulated-trades', async (req, res) => {
  try {
    const url = "http://localhost:1989/v1/results/simulated-trades";
    const { overmindApiKey, asset } = req.body;

    const token = `Bearer ${overmindApiKey}`;
    const headers = {
      Authorization: token
    };

    const params = {
      instrument: asset
    }

    const fullUrl = `${url}?${new URLSearchParams(params)}`;

    const response = await axios.get(fullUrl, { headers });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching simulated trades:", error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

serverApp.post('/api/v1/results/accumulated-revenue', async (req, res) => {
  try {
    const url = "http://localhost:1989/v1/results/accumulated-revenue";
    const { overmindApiKey, asset } = req.body;

    const token = `Bearer ${overmindApiKey}`;
    const headers = {
      Authorization: token
    };

    const params = {
      instrument: asset
    }

    const fullUrl = `${url}?${new URLSearchParams(params)}`;

    const response = await axios.get(fullUrl, { headers });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching accumulated revenue:", error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

serverApp.post('/api/v1/portfolio/refresh', async (req, res) => {
  try {
    const url = "http://localhost:1989/v1/portfolio/refresh";
    const { overmindApiKey } = req.body;

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

serverApp.post('/api/v1/portfolio/refresh-model', async (req, res) => {
  try {
    const url = "http://localhost:1989/v1/portfolio/refresh-model";
    const { overmindApiKey, instrument } = req.body;

    const token = `Bearer ${overmindApiKey}`;
    const headers = {
      Authorization: token,
    };

    const params = {
      instrument
    }

    const fullUrl = `${url}?${new URLSearchParams(params)}`;

    const response = await axios.get(fullUrl, { headers });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

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

serverApp.post('/api/v1/asset/getUserAsset', async (req, res) => {
  try {
    const { apiKey, secretKey } = req.body;
    const now = Date.now();

    const params = {
      timestamp: now,
      needBtcValuation: true
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

serverApp.post('/api/v1/asset/dust-btc', async (req, res) => {
  try {
    const { apiKey, secretKey } = req.body;
    const now = Date.now();

    const params = {
      timestamp: now
    };

    const signature = await createBinanceSignature(secretKey, params);
    params.signature = signature;

    const baseUrl = 'https://api3.binance.com';
    const endpoint = '/sapi/v1/asset/dust-btc';
    const url = `${baseUrl}${endpoint}?${new URLSearchParams(params)}`;

    const headers = {
      'X-MBX-APIKEY': apiKey,
    };

    const response = await axios.post(url, null, {headers}).catch((error) => { console.log(error) });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching dust:', error.message);
    res.status(500).json({ error: 'An error occurred' });
  }
});

serverApp.post('/api/v1/asset/dust', async (req, res) => {
  try {
    const { apiKey, secretKey, assets } = req.body;
    const now = Date.now();

    const params = {
      asset: assets.join(','),
      // asset: JSON.stringify(assets),
      // asset: assets,
      timestamp: now
    };

    let paramsStr = `asset=${assets.join(',')}&timestamp=${now}`

    const signature = await createBinanceSignature(secretKey, params);
    // params.signature = signature;
    paramsStr += `&signature=${signature}`

    const baseUrl = 'https://api3.binance.com';
    const endpoint = '/sapi/v1/asset/dust';
    // const url = `${baseUrl}${endpoint}?${new URLSearchParams(params)}`;
    const url = `${baseUrl}${endpoint}?${paramsStr}`;

    const headers = {
      'X-MBX-APIKEY': apiKey,
    };

    const response = await axios.post(url, null, {headers}).catch((error) => { console.log(error) });

    res.json(response.data);
  } catch (error) {
    console.error('Error executing dust:', error.message);
    res.status(500).json({ error: 'An error occurred' });
  }
});

serverApp.post('/api/v1/depositHistory', async (req, res) => {
  try {
    const { apiKey, secretKey } = req.body;
    const now = Date.now();
    const start = now - 30 * 24 * 60 * 60 * 1000;

    const params = {
      timestamp: now,
      startTime: start
    };

    const signature = await createBinanceSignature(secretKey, params);
    params.signature = signature;

    const baseUrl = 'https://api3.binance.com';
    const endpoint = '/sapi/v1/capital/deposit/hisrec';
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

serverApp.post('/api/v1/accountSnapshot', async (req, res) => {
  try {
    const { apiKey, secretKey } = req.body;
    const now = Date.now();

    const params = {
      timestamp: now,
      type: "SPOT",
      limit: 7
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

serverApp.post('/api/v1/ticker/price', async (req, res) => {
  try {
    const { assets } = req.body;

    // const params = Array.isArray(assets) ? { symbols: JSON.stringify(assets) } : { symbol: assets }

    const baseUrl = 'https://api3.binance.com';
    const endpoint = '/api/v3/ticker/price';

    let symbolsParam = ""
    if (Array.isArray(assets)) {
      if (assets.length == 1)
        symbolsParam = `symbol=${assets[0]}`
      else {
        const formattedString = `%5B%22${assets.join('%22,%22')}%22%5D`;
        symbolsParam = `symbols=${formattedString}`
      }
    } else
      symbolsParam = `symbol=${assets}`

    const url = `${baseUrl}${endpoint}?${symbolsParam}`;

    const response = await axios.get(url).catch((error) => {
      console.log(error)
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching prices:', error.message);
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

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching open orders:', error.message);
    res.status(500).json({ error: 'An error occurred' });
  }
});

serverApp.post('/api/v1/convert/getQuote', async (req, res) => {
  let response
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

    response = await axios.post(url, null, {headers})
                          .then((response) => { res.json(response.data)})
                          .catch((error) => {
                            const code = error.response.data.code
                            const msg = error.response.data.msg
                            let response = {}
                            response.code = code
                            response.msg = msg
                            response.fromAsset = fromAsset
                            response.toAsset = toAsset
                            response.fromAmount = fromAmount
                            if (code == 345233)
                              response.quoteRange = extractMinMaxQuote(msg)
                            res.json(response)
                          });

    // res.json(response.data);
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
    console.error('Error accepting quote:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Start the server
const PORT = 3000; // Change to the desired port number
const server = serverApp.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// setInterval(() => server.getConnections(
//     (err, connections) => console.log(`${connections} connections currently open`)
// ), 5000);

let connections = [];

server.on('connection', connection => {
    connections.push(connection);
    connection.on('close', () => connections = connections.filter(curr => curr !== connection));
});

process.on('SIGTERM', shutdownServer);
process.on('SIGINT', shutdownServer);
