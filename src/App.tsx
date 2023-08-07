import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { join, homeDir } from '@tauri-apps/api/path';
import './App.css';
import {
  formatPercentage,
  formatTwoDecimals,
  currentPortfolioColumns,
  bullishPortfolioColumns,
  ordersToExecuteColumns,
  Table
} from './Table';
import { readTextFile, writeTextFile } from './fsHelpers';
import path from 'path';
import { binanceLimits } from './constants'
import fs from 'fs';

import Title from './dashboard/Title'
import Dashboard from './dashboard/Dashboard'
import { fetchRecommendedPortfolio } from './dataHelpers'

import Button from '@mui/material/Button';

function App() {
  const [tableData, setTableData] = useState([]);
  const [binanceApiKey, setBinanceApiKey] = useState("");
  const [binanceSecretKey, setBinanceSecret] = useState(""); // New state for binanceSecretKey
  const [overmindApiKey, setOvermindApiKey] = useState("");
  const [showBinanceKey, setShowBinanceKey] = useState(false);
  const [showOvermindKey, setShowOvermindKey] = useState(false);
  const [portfolioColumns, setPortfolioColumns] = useState(bullishPortfolioColumns);
  const [bullishPortfolioData, setBullishPortfolioData] = useState(null);
  const [currentPortfolioData, setCurrentPortfolioData] = useState(null);
  const [ordersToExecute, setOrdersToExecute] = useState([]);
  const [executedOrders, setExecutedOrders] = useState([]);
  const [tableDataType, setTableDataType] = useState("none");
  const [exchangeInfo, setExchangeInfo] = useState({});

  /* useEffect(() => {
   *   readApiKeys();
   * }, []); */

  const toggleBinanceKeyVisibility = () => {
    setShowBinanceKey((prevShowBinanceKey) => !prevShowBinanceKey);
  };

  const toggleOvermindKeyVisibility = () => {
    setShowOvermindKey((prevShowOvermindKey) => !prevShowOvermindKey);
  };

  async function fetchExchangeInfo(fromAsset, toAsset) {
    try {
      // Preprocess the fromAsset and toAsset by removing "usd" from the end and converting to uppercase
      fromAsset = fromAsset.slice(0, -3).toUpperCase();
      toAsset = toAsset.slice(0, -3).toUpperCase();

      // Endpoint URL
      const apiUrl = 'http://localhost:3000/api/v1/exchangeInfo';

      // Request parameters
      const params = {
        fromAsset,
        toAsset,
        apiKey: binanceApiKey,
        secretKey: binanceSecretKey,
      };

      await sleep(10000)

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      const responseData = await response.json();

      console.log({responseData})
      let newExchangeInfo = {}
      newExchangeInfo[fromAsset] = {}
      newExchangeInfo[fromAsset][toAsset] = responseData[0]
      setExchangeInfo(newExchangeInfo)

      console.log('Exchange info appended successfully!');
    } catch (error) {
      console.error('Error fetching exchange info:', error);
    }
  }


  async function handleShowOrdersToExecute() {
    try {
      // Call fetchBullishPortfolio to get bullish portfolio data
      // await useRecommendedPortfolio(overmindApiKey, binanceApiKey, binanceSecretKey);

      // Check if both bullish and current portfolio data are available
      if (!bullishPortfolioData || !currentPortfolioData) {
        console.error('Data not available. Please fetch the portfolios first.');
        return;
      }

      // Fetch executed orders data by calling switchPortfolio
      const transactions = await switchPortfolio(bullishPortfolioData, currentPortfolioData);
      setOrdersToExecute(transactions);
      setTableDataType("toExecute");
    } catch (error) {
      console.error("Error fetching executed orders:", error);
    }
  }

  function sortPortfolio(portfolio, isDesc) {
    // Convert the object to an array of key-value pairs
    const portfolioArray = Object.entries(portfolio);

    // Sort the array based on values in ascending order
    if (isDesc)
      portfolioArray.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    else
      portfolioArray.sort((a, b) => Math.abs(a[1]) - Math.abs(b[1]));

    // Reconstruct the sorted object
    return Object.fromEntries(portfolioArray);
  }

  function getBTCPercentages(currentPortfolio) {
    let percentages = {}
    let sum = 0
    for (const asset in currentPortfolio) {
      sum += currentPortfolio[asset][1]
    }
    for (const asset in currentPortfolio) {
      percentages[asset] = currentPortfolio[asset][1] / sum;
    }
    return sortPortfolio(percentages)
  }

  function parseCurrentPortfolio(currentPortfolio) {
    const transformedPortfolio = {};

    for (const idx in currentPortfolio) {
      const order = currentPortfolio[idx]
      let asset = order['asset'].toLowerCase() + 'usd'

      let free = parseFloat(order['free'])
      const btcValuation = parseFloat(order['btcValuation'])

      transformedPortfolio[asset] = [free, btcValuation];
    }

    return transformedPortfolio;
  }

  function balancePortfolios(targetPortfolio, currentPortfolio) {
    let withdrawingPercs = getBTCPercentages(currentPortfolio)
    let newCurrent = {}
    let newTarget = {}
    for (const targetKey in targetPortfolio) {
      if (currentPortfolio.hasOwnProperty(targetKey)) {
        if (withdrawingPercs[targetKey] > targetPortfolio[targetKey]) {
          const newPerc = withdrawingPercs[targetKey] - targetPortfolio[targetKey]
          newCurrent[targetKey] = [newPerc * currentPortfolio[targetKey][0] / withdrawingPercs[targetKey],
                                   newPerc * currentPortfolio[targetKey][1] / withdrawingPercs[targetKey]]
        }
        if (withdrawingPercs[targetKey] < targetPortfolio[targetKey]) {
          const newPerc = targetPortfolio[targetKey] - withdrawingPercs[targetKey]
          newTarget[targetKey] = newPerc
        }
        // NOTE If equal, we don't add in either portfolio
      } else {
        // If it's not present in both, we just copy
        newTarget[targetKey] = targetPortfolio[targetKey]
      }
    }
    // Adding rest of values. Not present in both. Only newCurrent left.
    for (const currentKey in currentPortfolio) {
      if (!targetPortfolio.hasOwnProperty(currentKey)) {
        newCurrent[currentKey] = currentPortfolio[currentKey]
      }
    }

    return [newTarget, newCurrent]
  }

  function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  async function switchPortfolio(targetPortfolio, currentPortfolio) {
    let transactions = [];
    currentPortfolio = parseCurrentPortfolio(currentPortfolio)

    let transformedTargetPortfolio = {}
    for (const idx in targetPortfolio) {
      const order = targetPortfolio[idx]
      transformedTargetPortfolio[order['instrument']] = order['allocation'] / 100
    }

    [transformedTargetPortfolio, currentPortfolio] = balancePortfolios(transformedTargetPortfolio, currentPortfolio)

    targetPortfolio = sortPortfolio(transformedTargetPortfolio, true)
    let withdrawingPercs = getBTCPercentages(currentPortfolio)
    console.log(JSON.stringify(targetPortfolio))
    console.log(JSON.stringify(currentPortfolio))
    console.log(JSON.stringify(withdrawingPercs))

    for (const depositingAsset in targetPortfolio) {
      let toDeposit = targetPortfolio[depositingAsset]
      for (const withdrawingAsset in withdrawingPercs) {
        const toWithdraw = withdrawingPercs[withdrawingAsset]
        const remainingWithdraw = currentPortfolio[withdrawingAsset][0]
        if (toWithdraw <= 0 && remainingWithdraw <= 0)
          continue;

        const withdrawingTotalAmount = currentPortfolio[withdrawingAsset][0]
        let amount = 0

        if (Math.abs(toWithdraw) >= Math.abs(toDeposit)) {
          amount = toDeposit * withdrawingTotalAmount / toWithdraw
          withdrawingPercs[withdrawingAsset] -= Math.abs(toDeposit)
          toDeposit = 0
        } else {
          amount = Math.sign(toDeposit) * withdrawingTotalAmount // We withdraw all
          withdrawingPercs[withdrawingAsset] = 0
          toDeposit = Math.sign(toDeposit) * (Math.abs(toDeposit) - toWithdraw)
        }
        currentPortfolio[withdrawingAsset][0] -= Math.abs(amount)
        transactions.push({from: withdrawingAsset, to: depositingAsset, amount: amount})

        if (Math.abs(toDeposit) <= 0)
          // Then we're done depositing
          break;
      }
    }

    /* console.log({exchangeInfo})
     * for (const idx in transactions) {
     *   const tx = transactions[idx]
     *   await fetchExchangeInfo(tx.from, tx.to)
     *   console.log({exchangeInfo})
     * } */

    console.log({transactions})
    return transactions;
  }

  async function executeOrders() {
    try {
      const apiUrlGetQuote = "http://localhost:3000/api/v1/convert/getQuote";
      const apiUrlAcceptQuote = "http://localhost:3000/api/v1/convert/acceptQuote";

      // Iterate through each transaction in ordersToExecute
      for (const transaction of ordersToExecute) {
        let { from, to, amount } = transaction;

        from = from.slice(0, -3).toUpperCase();
        to = to.slice(0, -3).toUpperCase();
        amount = parseFloat(amount.toFixed(8));

        // Call the 'getQuote' endpoint with parameters fromAsset, toAsset, fromAmount
        const getQuoteRequestBody = {
          fromAsset: from,
          toAsset: to,
          fromAmount: amount,
          apiKey: binanceApiKey,
          secretKey: binanceSecretKey
        };

        const getQuoteResponse = await fetch(apiUrlGetQuote, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(getQuoteRequestBody),
        });

        if (!getQuoteResponse.ok) {
          throw new Error("Failed to get quote.");
        }

        const { quoteId } = await getQuoteResponse.json();

        // Call the 'acceptQuote' endpoint with apiKey, secretKey, and quoteId
        const acceptQuoteRequestBody = {
          apiKey: binanceApiKey,
          secretKey: binanceSecretKey,
          quoteId,
        };

        const acceptQuoteResponse = await fetch(apiUrlAcceptQuote, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(acceptQuoteRequestBody),
        });

        if (!acceptQuoteResponse.ok) {
          throw new Error("Failed to accept quote.");
        }
      }

      // If all transactions were executed successfully, you can set the executed orders data
      setExecutedOrders(ordersToExecute);
      setTableDataType("executed");
    } catch (error) {
      console.error("Error executing orders:", error);
      // Handle any error scenarios here
    }
  }

  /* async function readApiKeys() {
   *   try {
   *     // Read the contents of the desktop-config.json file using Tauri's API
   *     const homePath = await homeDir();
   *     const configPath = await join(homePath, "overmind/desktop-config.json")
   *     const configJson = await readTextFile(configPath);

   *     // Parse the JSON data
   *     const configData = JSON.parse(configJson);

   *     // Set the API keys from the config data
   *     setBinanceApiKey(configData.binanceApiKey || "");
   *     setBinanceSecret(configData.binanceSecretKey || ""); // Set the binanceSecretKey from the config data
   *     setOvermindApiKey(configData.overmindApiKey || "");
   *   } catch (error) {
   *     console.error("Error reading API keys:", error);
   *   }
   * } */

  async function saveApiKeys() {
    try {
      // Create the config object with the API keys and secret
      const configData = {
        binanceApiKey: binanceApiKey,
        binanceSecretKey: binanceSecretKey, // Save the binanceSecretKey to the config
        overmindApiKey: overmindApiKey,
      };

      // Convert the config object to JSON string
      const configJson = JSON.stringify(configData, null, 2);

      // Write the JSON data to the desktop-config.json file using Tauri's API
      const homePath = await homeDir();
      const configPath = await join(homePath, "overmind/desktop-config.json")
      await writeTextFile(configPath, configJson);

      console.log("API keys saved successfully!");
    } catch (error) {
      console.error("Error saving API keys:", error);
    }
  }

  async function fetchCurrentPortfolio() {
    try {
      // Your API endpoint URL for the current portfolio data
      const apiUrl = "http://localhost:3000/api/v1/openOrders";

      // Your request body containing the Binance API key and secret key
      const requestBody = {
        apiKey: binanceApiKey,
        secretKey: binanceSecretKey,
      };

      // Send a POST request to your local server to fetch the current portfolio data
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch data.");
      }

      const data = await response.json();
      setCurrentPortfolioData(data);
      setTableDataType("current");
      // Adding allocation %
      let sumBtcValuation = 0
      for (const idx in data) {
        sumBtcValuation += parseFloat(data[idx]['btcValuation'])
      }
      // Storing
      for (const idx in data) {
        data[idx]['allocation'] = parseFloat(data[idx]['btcValuation']) / sumBtcValuation * 100
      }
      setPortfolioColumns(currentPortfolioColumns);
      setTableData(data);
    } catch (error) {
      console.error("Error fetching current portfolio:", error);
      setTableData([]);
    }
  }

  return (

    <div>
      <Dashboard>
      </Dashboard>
      <h1>Overmind Desktop</h1>

      <div>
        <label>
          Binance API Key:
          <input
            type={showBinanceKey ? "text" : "password"}
            value={binanceApiKey}
            onChange={(e) => setBinanceApiKey(e.target.value)}
          />
          <Button variant="contained" onClick={toggleBinanceKeyVisibility}>
            {showBinanceKey ? "Hide" : "Show"}
          </Button>
        </label>
      </div>

      {/* New field for Binance Secret Key */}
      <div>
        <label>
          Binance Secret Key:
          <input
            type={showBinanceKey ? "text" : "password"}
            value={binanceSecretKey}
            onChange={(e) => setBinanceSecret(e.target.value)}
          />
          <Button variant="contained" onClick={toggleBinanceKeyVisibility}>
            {showBinanceKey ? "Hide" : "Show"}
          </Button>
        </label>
      </div>

      <div>
        <label>
          Overmind API Key:
          <input
            type={showOvermindKey ? "text" : "password"}
            value={overmindApiKey}
            onChange={(e) => setOvermindApiKey(e.target.value)}
          />
          <Button variant="contained" onClick={toggleOvermindKeyVisibility}>
            {showOvermindKey ? "Hide" : "Show"}
          </Button>
        </label>
      </div>
      <div>
        <Button variant="contained" onClick={saveApiKeys}>Save</Button>
      </div>

      <div>
        <Button variant="contained" onClick={fetchCurrentPortfolio}>Show Current Portfolio</Button>
        <Button variant="contained" onClick={handleShowOrdersToExecute}>Show Orders to Execute</Button>
      </div>

      {(tableDataType === "bullish" || tableDataType === "current") && (
        <div>
          <h2>{tableDataType === "bullish" ? "Bullish Portfolio" : "Current Portfolio"}</h2>
          <Table data={tableData} columns={portfolioColumns} />
        </div>
      )}

      {tableDataType === "toExecute" && (
        <div>
          <h2>Orders To Be Executed</h2>
          <Button variant="contained" onClick={executeOrders}>Execute Orders</Button>
          <Table data={ordersToExecute} columns={ordersToExecuteColumns} />
        </div>
      )}
    </div>
  );
}

export default App;
