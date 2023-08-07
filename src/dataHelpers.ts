import CryptoJS from 'crypto-js'; // Import crypto-js library
import axios from 'axios';

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

export async function switchPortfolio(targetPortfolio, currentPortfolio) {
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

export async function fetchRecommendedPortfolio(overmindApiKey) {
    try {
        const apiUrl = "http://localhost:3000/api/v1/portfolio/bullish";
        // Your request body containing the Binance API key and secret key
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

export async function fetchCurrentPortfolio(binanceApiKey, binanceSecretKey) {
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

async function fetchExecutePortfolio(binanceApiKey, binanceSecretKey) {
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

export async function fetchAccountSnapshot(binanceApiKey, binanceSecretKey) {
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
