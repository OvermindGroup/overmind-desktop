import { join, homeDir } from '@tauri-apps/api/path';
import { readTextFile, writeTextFile } from './fsHelpers';
import Database from "tauri-plugin-sql-api"
import { sleep } from './utils'

const homePath = await homeDir()
const projectPath = await join(homePath, "overmind")

async function getDb() {
    return await Database.load("sqlite:desktop.db");
}

export async function initDb() {
    const db = await getDb()

    const createReportsTableQuery = `
      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY,
        report STRING
      )
    `;

    const createValuationsTableQuery = `
      CREATE TABLE IF NOT EXISTS valuations (
        id INTEGER PRIMARY KEY,
        valuation STRING
      )
    `;

    await db.execute(createReportsTableQuery)
    await db.execute(createValuationsTableQuery)
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

function getBTCPercentages(currentPortfolio: { [key: string]: Array<number> }, reallocateOnlyExpired:bool, reallocateAmongAll:bool): { [key: string]: number } {
    let percentages: { [key: string]: number } = {}
    let sum = 0
    for (const asset in currentPortfolio) {
        if (reallocateAmongAll) {
            if (reallocateOnlyExpired && !currentPortfolio[asset][2]) {
                continue
            }
        }
        sum += currentPortfolio[asset][1]
    }
    for (const asset in currentPortfolio) {
        if (reallocateOnlyExpired && !currentPortfolio[asset][2])
            continue
        percentages[asset] = currentPortfolio[asset][1] / sum;
    }

    return sortPortfolio(percentages)
}

async function truncateToDecimalPlaces(num, decimalPlaces) {
  const multiplier = Math.pow(10, decimalPlaces);
  return Math.floor(num * multiplier) / multiplier;
}

async function fmtAmount(fromAsset, amount) {
    if (fromAsset == "SHIB" || fromAsset == "shibusd")
        return await truncateToDecimalPlaces(parseFloat(amount), 2);
    return await truncateToDecimalPlaces(parseFloat(amount), 8);
    // return parseFloat(amount.toFixed(8))
}

function parseCurrentPortfolio(currentPortfolio) {
    const transformedPortfolio = {};

    for (const idx in currentPortfolio) {
        const order = currentPortfolio[idx]
        const upcaseAsset = order['asset']
        let asset = order['asset'].toLowerCase() + 'usd'

        let free = parseFloat(order['free'])
        const btcValuation = parseFloat(order['btcValuation'])
        const expired = order['expired']

        transformedPortfolio[asset] = [free, btcValuation, expired];
    }

    return transformedPortfolio;
}

function balancePortfolios(targetPortfolio, currentPortfolio, reallocateOnlyExpired:bool, reallocateAmongAll:bool) {
    let withdrawingPercs = getBTCPercentages(currentPortfolio, reallocateOnlyExpired, reallocateAmongAll)
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

var singleton = false
export async function saveValuation(valuation) {
    try {
        if (singleton)
            return
        singleton = true
        const timestamp = new Date().getTime()
        // const previousValidation = await getValuations(1)
        // if (previousValidation.length !== 0 && timestamp - previousValidation[0].id < 1000)
        //     return
        valuation.timestamp = timestamp
        const valuationJson = JSON.stringify(valuation)

        const db = await getDb()
        const result = await db.execute(
            "INSERT INTO valuations (id, valuation) VALUES ($1, $2)",
            [timestamp, valuationJson],
        );

        console.log("Valuation saved successfully!", result);
        await sleep(500)
        singleton = false
    } catch (error) {
        console.error("Error saving report:", error);
    }
}

export async function getValuations(n:number) {
    try {
        const db = await getDb()
        const rows = await db.select(
            "SELECT * FROM valuations ORDER BY id DESC LIMIT $1",
            [n]
        );

        return rows
    } catch (error) {
        console.error("Error retrieving valuations:", error);
    }
}

export async function saveReport(report) {
    try {
        const { timestamp } = report
        const reportJson = JSON.stringify(report)

        const db = await getDb()
        const result = await db.execute(
            "INSERT INTO reports (id, report) VALUES ($1, $2)",
            [timestamp, reportJson],
        );

        console.log("Report saved successfully!", result);
    } catch (error) {
        console.error("Error saving report:", error);
    }
}

export async function getReports(n:number) {
    try {
        const db = await getDb()
        const rows = await db.select(
            "SELECT * FROM reports ORDER BY id DESC LIMIT $1",
            [n]
        );

        return rows
    } catch (error) {
        console.error("Error retrieving reports:", error);
    }
}

export async function saveApiKeys(apiKeys) {
    try {
        // Create the config object with the API keys and secret
        const { overmindApiKey, binanceApiKey, binanceSecretKey } = apiKeys
        const configData = {
            overmindApiKey: overmindApiKey,
            binanceApiKey: binanceApiKey,
            binanceSecretKey: binanceSecretKey,
        };

        // Convert the config object to JSON string
        const configJson = JSON.stringify(configData, null, 2);

        // Write the JSON data to the desktop-config.json file using Tauri's API
        const configPath = await join(projectPath, "desktop-config.json")
        await writeTextFile(configPath, configJson);

        console.log("API keys saved successfully!");
    } catch (error) {
        console.error("Error saving API keys:", error);
    }
}

export async function readApiKeys() {
    try {
        // Read the contents of the desktop-config.json file using Tauri's API
        const configPath = await join(projectPath, "desktop-config.json")
        const configJson = await readTextFile(configPath);

        // Parse the JSON data
        const configData = JSON.parse(configJson);

        const overmindApiKey = configData.overmindApiKey || ""
        const binanceApiKey = configData.binanceApiKey || ""
        const binanceSecretKey = configData.binanceSecretKey || ""

        return {overmindApiKey, binanceApiKey, binanceSecretKey}
    } catch (error) {
        console.error("Error reading API keys:", error);
    }
}

export async function switchPortfolio(targetPortfolio, currentPortfolio, reallocateOnlyExpired:bool, reallocateAmongAll:bool) {
    let forBTCPercentages = currentPortfolio

    const expiredPortfolio = []
    if (reallocateOnlyExpired) {
        for (const asset of currentPortfolio)
            if (asset.expired)
                expiredPortfolio.push(asset)
        currentPortfolio = expiredPortfolio
    }

    let transactions = [];
    currentPortfolio = parseCurrentPortfolio(currentPortfolio)
    forBTCPercentages = parseCurrentPortfolio(forBTCPercentages)

    let transformedTargetPortfolio = {}
    let riskManagement = {}
    for (const idx in targetPortfolio) {
        const order = targetPortfolio[idx]
        transformedTargetPortfolio[order['instrument']] = order['allocation'] / 100
        riskManagement[order['instrument']] = order
    }

    const forBTCResult = balancePortfolios(transformedTargetPortfolio, forBTCPercentages, false, true)
    forBTCPercentages = forBTCResult[1]
    const result = balancePortfolios(transformedTargetPortfolio, currentPortfolio, reallocateOnlyExpired, reallocateAmongAll)
    transformedTargetPortfolio = result[0]
    currentPortfolio = result[1]
    // const result = balancePortfolios(transformedTargetPortfolio, currentPortfolio, reallocateOnlyExpired, reallocateAmongAll)
    // transformedTargetPortfolio = result[0]
    // currentPortfolio = result[1]

    targetPortfolio = sortPortfolio(transformedTargetPortfolio, true)


    let withdrawingPercs = getBTCPercentages(forBTCPercentages, reallocateOnlyExpired, reallocateAmongAll)
    let totalWithdrawingPercs = getBTCPercentages(forBTCPercentages, false, reallocateAmongAll)
    const currentPortfolioConst = JSON.parse(JSON.stringify(currentPortfolio));

    for (const depositingAsset in targetPortfolio) {
        let toDeposit = targetPortfolio[depositingAsset]
        for (const withdrawingAsset in withdrawingPercs) {
            const toWithdraw =
                withdrawingPercs[withdrawingAsset]
            const remainingWithdraw = currentPortfolio[withdrawingAsset][0]
            if (toWithdraw <= 0 && remainingWithdraw <= 0)
                continue

            const withdrawingTotalAmount = currentPortfolio[withdrawingAsset][0]
            let amount = 0.0
            let allocation = 0.0

            if (Math.abs(toWithdraw) >= Math.abs(toDeposit)) {
                amount = toDeposit * withdrawingTotalAmount / toWithdraw
                withdrawingPercs[withdrawingAsset] -= Math.abs(toDeposit)
                allocation = totalWithdrawingPercs[withdrawingAsset] * (amount / currentPortfolioConst[withdrawingAsset][0])
                // allocation = Math.abs(toDeposit)
                toDeposit = 0
            } else {
                amount = Math.sign(toDeposit) * withdrawingTotalAmount // We withdraw all
                // allocation = toWithdraw
                allocation = totalWithdrawingPercs[withdrawingAsset] * (amount / currentPortfolioConst[withdrawingAsset][0])
                toDeposit = Math.sign(toDeposit) * (Math.abs(toDeposit) - toWithdraw)
                withdrawingPercs[withdrawingAsset] = 0
            }
            currentPortfolio[withdrawingAsset][0] -= Math.abs(amount)
            // amount = parseFloat(amount.toFixed(8))
            amount = await fmtAmount(withdrawingAsset, amount)
            transactions.push({from: withdrawingAsset,
                               to: depositingAsset,
                               amount: amount,
                               allocation: allocation * 100.0,
                               takeProfit: riskManagement[depositingAsset].takeProfit,
                               stopLoss: riskManagement[depositingAsset].stopLoss,
                               horizon: riskManagement[depositingAsset].horizon,
                               status: '-'})

            if (Math.abs(toDeposit) <= 0)
                // Then we're done depositing
                break;
        }
    }

    return transactions;
}

export async function fetchRecommendedPortfolio(overmindApiKey:string) {
    try {
        const apiUrl = "http://localhost:3000/api/v1/portfolio/bullish";

        const requestBody = {
            overmindApiKey: overmindApiKey
        };

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

        return await response.json();
    } catch (error) {
        console.log(error)
        return []
    }
}

export async function fetchSimulatedTrades(overmindApiKey:string, asset:string) {
    try {
        const apiUrl = "http://localhost:3000/api/v1/results/simulated-trades";

        const requestBody = {
            overmindApiKey: overmindApiKey,
            asset: asset
        };

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

        return await response.json();
    } catch (error) {
        console.log(error)
        return []
    }
}

export async function fetchAccumulatedRevenue(overmindApiKey:string, asset:string) {
    try {
        const apiUrl = "http://localhost:3000/api/v1/results/accumulated-revenue";

        const requestBody = {
            overmindApiKey: overmindApiKey,
            asset: asset
        };

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

        return await response.json();
    } catch (error) {
        console.log(error)
        return []
    }
}

export async function killServer() {
    try {
        // Your API endpoint URL for the current portfolio data
        const apiUrl = "http://localhost:3000/api/v1/shutdown";

        fetch(apiUrl, {method: "POST"});
        // Success
        return true
    } catch (error) {
        console.error("Error at attempting to shutdown server:", error);
        return false
    }
}

export async function fetchTrainPortfolio(overmindApiKey:string, iterations:number, maxTradeHorizon:number, tpPercentage:number, slPercentage:number) {
    try {
        const apiUrl = "http://localhost:3000/api/v1/portfolio/train-bullish";
        // Your request body containing the Binance API key and secret key
        const requestBody = {
            overmindApiKey,
            iterations,
            maxTradeHorizon,
            tpPercentage,
            slPercentage
        };

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

        return await response.json();
    } catch (error) {
        console.log(error)
        return []
    }
}

export async function executeRefreshPortfolio(overmindApiKey:string) {
    try {
        const apiUrl = "http://localhost:3000/api/v1/portfolio/refresh";
        const requestBody = {
            overmindApiKey: overmindApiKey
        };

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error("Failed to refresh portfolio.");
        }

        return await response.json();
    } catch (error) {
        console.log(error)
        return []
    }
}

export async function fetchUserAsset(binanceApiKey:string, binanceSecretKey:string) {
    try {
        // Your API endpoint URL for the current portfolio data
        const apiUrl = "http://localhost:3000/api/v1/asset/getUserAsset";

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
        // Adding allocation %
        let sumBtcValuation = 0
        for (const idx in data) {
            sumBtcValuation += parseFloat(data[idx]['btcValuation'])
        }
        // Storing
        for (const idx in data) {
            data[idx]['allocation'] = parseFloat(data[idx]['btcValuation']) / sumBtcValuation * 100
        }

        return data
    } catch (error) {
        console.error("Error fetching current portfolio:", error);
        return []
    }
}

export async function fetchDust(binanceApiKey:string, binanceSecretKey:string) {
    try {
        const apiUrl = "http://localhost:3000/api/v1/asset/dust-btc";

        const requestBody = {
            apiKey: binanceApiKey,
            secretKey: binanceSecretKey,
        };

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

        return await response.json();
    } catch (error) {
        console.error("Error fetching dust:", error);
        return []
    }
}

export async function executeDust(binanceApiKey:string, binanceSecretKey:string, assets) {
    try {
        const apiUrl = "http://localhost:3000/api/v1/asset/dust";

        const requestBody = {
            assets,
            apiKey: binanceApiKey,
            secretKey: binanceSecretKey,
        };

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

        return await response.json();
    } catch (error) {
        console.error("Error executing dust:", error);
        return []
    }
}

async function fetchExecutePortfolio(binanceApiKey:string, binanceSecretKey:string) {
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
    } catch (error) {
        console.error("Error executing orders:", error);
        // Handle any error scenarios here
    }
}

export async function fetchDepositHistory(binanceApiKey:string, binanceSecretKey:string) {
    try {
        const apiUrl = "http://localhost:3000/api/v1/depositHistory";

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

        return await response.json();
    } catch (error) {
        console.error("Error fetching deposit history:", error);
        return []
    }
}

export async function fetchWithdrawHistory(binanceApiKey:string, binanceSecretKey:string) {
    try {
        const apiUrl = "http://localhost:3000/api/v1/withdrawHistory";

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

        return await response.json();
    } catch (error) {
        console.error("Error fetching withdraw history:", error);
        return []
    }
}

export async function fetchAccountSnapshot(binanceApiKey:string, binanceSecretKey:string) {
    try {
        const apiUrl = "http://localhost:3000/api/v1/accountSnapshot";

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

        return await response.json();
    } catch (error) {
        console.error("Error fetching account snapshot:", error);
        return []
    }
}

export async function fetchBTCUSDT() {
    try {
        const apiUrl = "http://localhost:3000/api/v1/ticker/price";

        const requestBody = {
            assets: 'BTCUSDT'
        };

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

        return await response.json();
    } catch (error) {
        console.error("Error fetching BTCUSDT price:", error);
        return []
    }
}

export async function fetchAssetPrices(assets) {
    try {
        const apiUrl = "http://localhost:3000/api/v1/ticker/price";

        const requestBody = {
            assets: assets
        };

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

        const result = {}
        const data = await response.json()
        if (Array.isArray(data))
            for (const price of data)
                result[price.symbol] = price.price
        else
            result[data.symbol] = data.price

        return result;
    } catch (error) {
        console.error("Error fetching asset prices:", error);
        return []
    }
}

export async function getQuote(binanceApiKey:string, binanceSecretKey:string, transaction) {
    const apiUrlGetQuote = "http://localhost:3000/api/v1/convert/getQuote";

    try {
        let { from, to, amount } = transaction;

        from = from.slice(0, -3).toUpperCase();
        to = to.slice(0, -3).toUpperCase();
        amount = parseFloat(amount.toFixed(8));

        amount = await fmtAmount(from, amount)

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

        return await getQuoteResponse.json()
    } catch (error) {
        console.error("Error getting quote:", error);
    }
}

export async function getQuotes(binanceApiKey:string, binanceSecretKey:string, ordersToExecute) {
    const quotes = []
    for (const transaction of ordersToExecute) {
        quotes.push(await getQuote(binanceApiKey, binanceSecretKey, transaction))
    }

    return quotes
}

export async function executeOrder(binanceApiKey:string, binanceSecretKey:string, transaction) {
    const apiUrlGetQuote = "http://localhost:3000/api/v1/convert/getQuote";
    const apiUrlAcceptQuote = "http://localhost:3000/api/v1/convert/acceptQuote";

    try {
        let { from, to, amount } = transaction;

        from = from.slice(0, -3).toUpperCase();
        to = to.slice(0, -3).toUpperCase();
        amount = await fmtAmount(from, amount)

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

        const quoteResp = await getQuoteResponse.json();

        // Call the 'acceptQuote' endpoint with apiKey, secretKey, and quoteId
        const acceptQuoteRequestBody = {
            apiKey: binanceApiKey,
            secretKey: binanceSecretKey,
            quoteId: quoteResp.quoteId,
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

        return quoteResp
    } catch (error) {
        console.error("Error executing order:", error);
    }
}

export async function executeOrders(binanceApiKey:string, binanceSecretKey:string, ordersToExecute) {
    let quotes = []
    for (const transaction of ordersToExecute) {
        const quote = await executeOrder(binanceApiKey, binanceSecretKey, transaction)
        quotes.push(quote)
    }
    return quotes
}
