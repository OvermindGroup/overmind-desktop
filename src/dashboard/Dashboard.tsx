import { useState, useEffect } from 'react';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import { exit } from '@tauri-apps/api/process';

import { Steps } from 'intro.js-react';
import "intro.js/introjs.css";
import "intro.js/themes/introjs-modern.css";

import CssBaseline from '@mui/material/CssBaseline';
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress';

import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import HelpIcon from '@mui/icons-material/Help';

import { menuListItems } from './listItems';
import News from './News';
import Settings from './Settings';
import Balance from './Balance';
import Portfolio from './Portfolio';
import Alert from './Alert';

import { fetchRecommendedPortfolio,
         fetchUserAsset,
         fetchBTCUSDT,
         fetchDust,
         fetchAssetPrices,
         fetchTrainPortfolio,
         // fetchAccountSnapshot,
         fetchSimulatedTrades,
         fetchAccumulatedRevenue,
         fetchLatestPattern,
         // fetchSubAddress,
         // fetchNextToken,
         executeDust,
         executeRefreshPortfolio,
         executeRefreshPortfolioModel,
         executeOrder,
         // executeWithdrawApply,
         switchPortfolio,
         readApiKeys,
         // saveApiKeys,
         saveReport,
         saveValuation,
         getQuote,
         getReports,
         killServer
} from '../dataHelpers'

import { sleep } from '../utils'

import { steps } from './tourSteps'

function LinearProgressWithLabel(
  props: LinearProgressProps & { value: number, label: string },
) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center'}}>
      <Box sx={{ width: '50%' }}>
        <Typography variant="body2" color="text.secondary">{props.label}</Typography>
      </Box>
      <Box sx={{ width: '50%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
    </Box>
  );
}

function Copyright(props: any) {
  return (
    <Typography variant="body2" color="text.secondary" align="center" {...props}>
      {'Copyright © '}
      {new Date().getFullYear()}
      {' '}
      <Link color="inherit" href="https://overmind.group">
        Overmind Group
      </Link>{' '}
    </Typography>
  );
}

const drawerWidth: number = 340;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    '& .MuiDrawer-paper': {
      position: 'relative',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      boxSizing: 'border-box',
      ...(!open && {
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up('sm')]: {
          width: theme.spacing(9),
        },
      }),
    },
  }),
);

// TODO remove, this demo shouldn't need to reset the theme.
const defaultTheme = createTheme({palette: {mode: 'dark'}});
// const defaultTheme = createTheme();

const readingAPIKeysMsg = 'Reading API Keys'
const fetchCurrentPortfolioMsg = 'Fetching current portfolio from Binance'
const convertToBnbMsg = 'Converting to BNB'
// const convertToUsdtMsg = 'Converting to USDT'
const fetchRecommendedPortfolioMsg = 'Fetching recommended portfolio from Overmind'
const loadingPortfolioReportMsg = 'Loading risk management report'

export default function Dashboard(props:any) {
  if (props.hasOwnProperty('default'))
    return
  const [open, setOpen] = useState(true);
  const [portfolioType, setPortfolioType] = useState("none");
  const [portfolioActions, setPortfolioActions] = useState({});

  const [portfolioData, setPortfolioData] = useState(null);
  const [recommendedPortfolioData, setRecommendedPortfolioData] = useState(null);
  const [currentPortfolioData, setCurrentPortfolioData] = useState(null);
  const [riskManagementData, setRiskManagementData] = useState(null)
  // const [ordersToExecute, setOrdersToExecute] = useState(null);

  const [overmindApiKey, setOvermindApiKey] = useState("");
  const [binanceApiKey, setBinanceApiKey] = useState("");
  const [binanceSecretKey, setBinanceSecretKey] = useState("");

  const [alertMessage, setAlertMessage] = useState('');
  const [alertAction, setAlertAction] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const [showProgress, setShowProgress] = useState(false);
  const [progressLabel, setProgressLabel] = useState("");
  const [progressValue, setProgressValue] = useState(0);

  const [btcBalance, setBtcBalance] = useState(0.0)
  const [usdtBalance, setUsdtBalance] = useState(0.0)
  const [settingsType, setSettingsType] = useState('none');
  const [portfolioAlerts, setPortfolioAlerts] = useState([]);
  const [validatedPortfolio, setValidatedPortfolio] = useState(false);

  const [updatingPortfolio, setUpdatingPortfolio] = useState(false);
  const [runningValidations, setRunningValidations] = useState(false);

  const [reallocateOnlyExpired, setReallocateOnlyExpired] = useState(true);
  const [reallocateAmongAll, setReallocateAmongAll] = useState(true);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleAlertClose = async () => {
    try {
      setAlertMessage('')
      setShowAlert(false)
    } catch (error) {
      console.log(error)
    }
  }

  const handleProgressClose = async () => {
    try {
      setProgressLabel('')
      setProgressValue(0)
      setShowProgress(false)
    } catch (error) {
      console.log(error)
    }
  }

  const handleTourClose = async () => {
    try {
      if (!showTour)
        return
      setShowTour(false)
      await useRecommendedPortfolio(overmindApiKey)
    } catch (error) {
      console.log(error)
    }
  }

  const handleTourOpen = async () => {
    try {
      setShowTour(true)
    } catch (error) {
      console.log(error)
    }
  }

  /* const callRefreshPortfolio = async (overmindApiKey:string) => {
   *   try {
   *     const data = await executeRefreshPortfolio(overmindApiKey)
   *     setPortfolioData(data);
   *     setRecommendedPortfolioData(data);
   *   } catch (error) {
   *     setPortfolioData(null);
   *   }
   * } */

  const callTrainPortfolio = async (overmindApiKey:string, iterations:number, maxTradeHorizon:number, tpPercentage:number, slPercentage:number) => {
    try {
      tpPercentage /= 100.0
      slPercentage /= 100.0
      const data = await fetchTrainPortfolio(overmindApiKey, iterations, maxTradeHorizon, tpPercentage, slPercentage)
      setPortfolioData(data);
      setRecommendedPortfolioData(data);
    } catch (error) {
      setPortfolioData(null);
    }
  }

  const callResetPortfolio = async (overmindApiKey:string) => {
    try {
      const data = await executeRefreshPortfolio(overmindApiKey)
      setPortfolioData(data);
      setRecommendedPortfolioData(data);
    } catch (error) {
      setPortfolioData(null);
    }
  }

  const validatePortfolio = async (ordersToExecute) => {
    if (ordersToExecute.length < 1)
      return false
    try {
      setShowProgress(true)
      setProgressValue(0)
      const quotes = []
      for (const idx in ordersToExecute) {
        const transaction = ordersToExecute[idx]
        let { from, to } = transaction
        from = from.slice(0, -3).toUpperCase();
        to = to.slice(0, -3).toUpperCase();
        setProgressLabel(`Validating ${from} 🠞 ${to}`)
        quotes.push(await getQuote(binanceApiKey, binanceSecretKey, transaction))
        setProgressValue(Math.round((parseFloat(idx) + 1) / ordersToExecute.length * 100))
        await sleep(500);
      }

      await sleep(1000);
      setShowProgress(false)
      setProgressLabel('')
      setProgressValue(0)
      let portfolioAlerts = []
      for (const idx in quotes) {
        const quote = quotes[idx]
        let code = 0
        if (quote.hasOwnProperty('code'))
          code = quote.code
        if (code == 345233 || code == -23000)
          portfolioAlerts.push(quote)
      }

      if (portfolioAlerts.length > 0) {
        return false
      }
      setValidatedPortfolio(true)
      return true
    } catch (error) {
      return false
    }
  }

  const callValidatePortfolio = async (ordersToExecute) => {
    try {
      validatePortfolio(ordersToExecute).then((areValid) => {
        setShowAlert(true)
        setAlertAction(null)
        setPortfolioAlerts(null)
        setAlertMessage('All orders have been validated successfully. You can now update your portfolio by clicking on the "Execute Orders" button.')

        if (!areValid) {
          setAlertMessage('There are issues with some orders. Please check their status. After fixing all the issues, please try running the automatic trader again.')
        }
      })

      setPortfolioType('to-execute-portfolio')
    } catch (error) {
      setPortfolioData([]);
      setAlertMessage('Something went wrong when trying to validate your orders.')
      setShowAlert(true)
    }
  }

  const executePortfolio = async (ordersToExecute) => {
    if (ordersToExecute.length < 1)
      return false
    try {
      setShowProgress(true)
      setProgressLabel('Preparing data')
      const valuationsBefore = await getValuations(binanceApiKey, binanceSecretKey)
      const symbols = []
      const toAmounts = {}
      for (const idx in ordersToExecute) {
        const transaction = ordersToExecute[idx]
        let { from, to } = transaction
        from = from.slice(0, -3).toUpperCase();
        to = to.slice(0, -3).toUpperCase();
        setProgressLabel(`Executing ${from} 🠞 ${to}`)
        const quote = await executeOrder(binanceApiKey, binanceSecretKey, transaction)
        if (toAmounts.hasOwnProperty(to))
          toAmounts[to] += parseFloat(quote.toAmount)
        else
          toAmounts[to] = parseFloat(quote.toAmount)
        symbols.push(`${to}USDT`)
        setProgressValue(Math.round((parseFloat(idx) + 1) / ordersToExecute.length * 100))
        await sleep(500)
      }

      await sleep(1000)

      setProgressLabel(`Preparing data`)
      /* const currPortfolio = await updateCurrentPortfolio(binanceApiKey, binanceSecretKey)
       * const symbols = []
       * for (const entry of currentPortfolio) {
       *   symbols.push(`${entry.asset}USDT`)
       * } */
      const symbolsSet = [...new Set(symbols)]
      const startingPrices = await fetchAssetPrices(symbolsSet)

      await sleep(1000)
      setProgressValue(0)
      setProgressLabel(`Saving report`)
      const valuationsAfter = await getValuations(binanceApiKey, binanceSecretKey)
      setProgressValue(25)
      await sleep(1000);
      const assetsAfter = await fetchUserAsset(binanceApiKey, binanceSecretKey)
      setProgressValue(50)
      await sleep(1000);

      const initialOrdersToExecute = await switchPortfolio(recommendedPortfolioData, currentPortfolioData, reallocateOnlyExpired, reallocateAmongAll)

      const timestamp = new Date().getTime()

      const report = {
        recommendedPortfolio: recommendedPortfolioData,
        initialOrdersToExecute,
        ordersToExecute,
        assetsBefore: currentPortfolioData,
        assetsAfter,
        toAmounts,
        valuationsBefore,
        valuationsAfter,
        startingPrices,
        timestamp
      }
      setProgressValue(75)

      /* const nextTokenData = {assets: report.toAmounts, prices: report.startingPrices}
       * const nextToken = await fetchNextToken(overmindApiKey, nextTokenData)
       * setOvermindApiKey(nextToken)
       * console.log({nextToken})
       * await saveApiKeys({overmindApiKey: nextToken, binanceApiKey, binanceSecretKey}) */

      saveReport(report)
      await sleep(1000);
      setProgressValue(100)
      await sleep(1000);
      setShowProgress(false)
      return true

    } catch (error) {
      return false
    }
  }

  const callExecutePortfolio = async (ordersToExecute) => {
    executePortfolio(ordersToExecute).then((areValid) => {
      if(areValid) {
        setShowAlert(true)
        setAlertAction(null)
        setPortfolioAlerts(null)
        setAlertMessage('All orders were executed successfully.')
      } else {
        setPortfolioData([]);
        setAlertMessage('Something went wrong when trying to update your portfolio.')
        setShowAlert(true)
      }
      
    })
    setPortfolioType('to-execute-portfolio')
  }

  async function useRecommendedPortfolio(overmindApiKey:string) {
    try {
      setProgressLabel(fetchRecommendedPortfolioMsg)
      setProgressValue(45)
      setShowProgress(true)
      const data = await fetchRecommendedPortfolio(overmindApiKey)
      setPortfolioData(data)
      setRecommendedPortfolioData(data);
      setProgressValue(100)
      setPortfolioType('recommended-portfolio')

      setShowProgress(false)
      setPortfolioActions({
        improvePortfolio: async (iterations:number, maxTradeHorizon:number, tpPercentage:number, slPercentage:number) => {
          await callTrainPortfolio(overmindApiKey, iterations, maxTradeHorizon, tpPercentage, slPercentage)
        },
        resetPortfolio: async () => {
          await callResetPortfolio(overmindApiKey)
      }})
      /* setPortfolioActions(() => {
       *   return () => callTrainPortfolio(overmindApiKey)
       * }) */
    } catch (error) {
      setPortfolioData(null);
    }
  }

  async function updateCurrentPortfolio(binanceApiKey:string, binanceSecretKey:string) {
    const data = await fetchUserAsset(binanceApiKey, binanceSecretKey)

    // Removing extremely small asset holdings
    const cleanedData = []
    for (let asset of data) {
      if (parseFloat(asset.btcValuation) == 0)
        continue
      cleanedData.push(asset)
    }

    const latestReport = await calculateRiskManagement(cleanedData)
    setRiskManagementData(latestReport)

    const dataWithExpired = []
    for (let asset of cleanedData) {
      if (latestReport.hasOwnProperty(asset.asset)) {
        asset.expired = latestReport[asset.asset].expired
      }
      else {
        asset.expired = true // To force a reallocation; something went wrong somehow
      }

      dataWithExpired.push(asset)
    }

    setCurrentPortfolioData(dataWithExpired)
    return dataWithExpired
  }

  async function convertToBnb() {
    setProgressLabel(convertToBnbMsg)
    setProgressValue(30)
    setShowProgress(true)
    await sleep(1000)
    fetchDust(binanceApiKey, binanceSecretKey).then(async (dustResult) => {
      const dustAssets = []
      for (const dust of dustResult.details) {
        dustAssets.push(dust.asset)
      }
      if (dustAssets.length == 0) {
        setProgressValue(100)
        setProgressLabel('No assets available to convert to BNB')
        await sleep(5000)
        return
      }
      setProgressValue(50)
      setProgressLabel(`Converting ${dustAssets.join(', ')}`)
      await sleep(2000)
      executeDust(binanceApiKey,
                  binanceSecretKey,
                  dustAssets).then(async () => {
                    setProgressValue(100)
                    setProgressLabel('Done')
                    await sleep(1000)
                  })
      setShowProgress(false)
      setProgressLabel('')
    })
    await useCurrentPortfolio()
  }

  /* async function convertToUsdt() {
   *   setProgressLabel(convertToUsdtMsg)
   *   setProgressValue(30)
   *   setShowProgress(true)
   *   await sleep(1000)
   *   fetchDust(binanceApiKey, binanceSecretKey).then(async (dustResult) => {
   *     const dustAssets = []
   *     for (const dust of dustResult.details) {
   *       dustAssets.push(dust.asset)
   *     }
   *     if (dustAssets.length == 0) {
   *       setProgressValue(100)
   *       setProgressLabel('No assets available to convert to BNB')
   *       await sleep(5000)
   *       return
   *     }
   *     setProgressValue(50)
   *     setProgressLabel(`Converting ${dustAssets.join(', ')}`)
   *     await sleep(2000)
   *     executeDust(binanceApiKey,
   *                 binanceSecretKey,
   *                 dustAssets).then(async (result) => {
   *                   setProgressValue(100)
   *                   setProgressLabel('Done')
   *                   await sleep(1000)
   *                 })
   *     setShowProgress(false)
   *     setProgressLabel('')
   *   })
   *   await useCurrentPortfolio(binanceApiKey, binanceSecretKey)
   * } */

  async function useCurrentPortfolio() {
    try {
      setProgressLabel(fetchCurrentPortfolioMsg)
      setProgressValue(15)
      setShowProgress(true)
      // console.log({currentPortfolioData})
      /* const data = await updateCurrentPortfolio(binanceApiKey, binanceSecretKey)
       * setPortfolioData(data) */
      setPortfolioData(currentPortfolioData)
      // console.log({data})
      setPortfolioType('current-portfolio')

      const actions = {
        convertToBnb: async () => {
          await convertToBnb()
        }
      }
      setPortfolioActions(actions)
      setProgressValue(100)
      setShowProgress(false)
    } catch (error) {
      setPortfolioData(null);
    }
  }

  async function useToExecutePortfolio() {
    try {
      // Check if both recommended and current portfolio data are available
      if (recommendedPortfolioData == null || currentPortfolioData == null) {
        setAlertMessage('Data not available. Please fetch the portfolios first.')
        setShowAlert(true)
        setPortfolioData(null)
        setPortfolioActions(null)
        setPortfolioType('none')

        setSettingsType('none')
        // setPortfolioDataHandler(null)
        return;
      }

      // setPortfolioDataHandler(handleToExecuteData)

      /* const readyForReallocation = []
       * for (const asset of currentPortfolioData)
       *   if (asset.expired)
       *     readyForReallocation.push(asset) */

      const data = await switchPortfolio(recommendedPortfolioData, currentPortfolioData, reallocateOnlyExpired, reallocateAmongAll)

      // setOrdersToExecute(data)
      setPortfolioData(data)
      setPortfolioType('to-execute-portfolio')

      const actions = {
        validateOrders: async () => {
          await callValidatePortfolio(data)
        },
        executeOrders: async () => {
          await callExecutePortfolio(data)
        }
      }
      setPortfolioActions(actions)
      /* setPortfolioActions(() => {
       *   return () => callExecutePortfolio(data)
       * }) */
    } catch (error) {
      console.log('Error loading execute portfolio:', error)
      setPortfolioData(null)
      // setOrdersToExecute(null)
    }
  }

  async function useApiKeysConfig() {
    try {
      setSettingsType('api-keys')

      setPortfolioType('none')
    } catch (error) {
      setSettingsType('none')

      setPortfolioType('none')
    }
  }

  async function calculateRiskManagement(currentPortfolio:any) {
    if (currentPortfolio === null || currentPortfolio.length < 1)
      return;
    setProgressLabel(loadingPortfolioReportMsg)
    setProgressValue(0)
    setShowProgress(true)
    const rows:any = await getReports(10)
    const data = JSON.parse(rows[0].report) // We always get 1.

    // initialTransactions
    //

    const symbols = []
    const transactions = []
    for (const asset of currentPortfolio) {
      const assetName = asset.asset
      let assetAmount = parseFloat(asset.free)

      for (const report of rows) {
        const timestamp = report.id
        const reportObj = JSON.parse(report.report)
        const toAmounts = reportObj.toAmounts
        let found = false
        // const reccPortfolio = reportObj.recommendedPortfolio
        // const initOrders = reportObj.initialOrdersToExecute
        // for (const recc of reccPortfolio) {
        //   const from = recc.instrument
        //
        //   if (assetName == recc.instrument)
        //   found = true
        // }
        // if (found)
        //   break

        // console.log({toAmounts}, {assetName}, reportObj.startingPrices)

        if (toAmounts.hasOwnProperty(assetName)) {
          for (const transaction of reportObj.ordersToExecute) {
            const to = transaction.to.slice(0, -3).toUpperCase()
            if (assetName == to) {
              const from = transaction.from.slice(0, -3).toUpperCase()
              const timeRemaining = (timestamp + transaction.horizon * 1000) - new Date().getTime()
              const expired = (timestamp + transaction.horizon * 1000) < new Date().getTime()

              transaction['from'] = from
              transaction['to'] = to
              transaction['timestamp'] = timestamp
              transaction['startingPrice'] = reportObj.startingPrices[`${assetName}USDT`]
              transaction['toAmount'] = assetAmount
              transaction['timeRemaining'] = timeRemaining
              transaction['expired'] = expired

              symbols.push(`${to}USDT`)
              transactions.push(transaction)
              found = true
              break
            }
          }
        }
        if (found)
          break
      }
    }

    const reportsData = {
      transactions,
      symbols,
      // timestamp: data.timestamp,
      btcValueBefore: data.valuationsBefore.btcValue,
      btcValueAfter: data.valuationsAfter.btcValue,
      usdtValueBefore: data.valuationsBefore.usdtValue,
      usdtValueAfter: data.valuationsAfter.usdtValue,
      // startingPrices: data.startingPrices,
      // toAmounts: data.toAmounts
    }

    setProgressValue(40)

    const prices = await fetchAssetPrices(symbols)

    const _tableData = {}
    for (const transaction of reportsData.transactions) {
      const symbol = `${transaction.to}USDT`
      const startPrice = parseFloat(transaction.startingPrice)
      const tp = transaction.takeProfit
      const sl = transaction.stopLoss
      const price = parseFloat(prices[symbol])
      const priceDiff = price - startPrice
      // const toAmount = reportsData.toAmounts[transaction.to]
      const toAmount = transaction.toAmount
      const tpDistance = tp > 0 ? ((startPrice + tp) - price) * toAmount : (price - (startPrice + tp)) * toAmount
      const slDistance = tp > 0 ? (price - (startPrice + sl)) * toAmount : ((startPrice + sl) - price) * toAmount
      const upnl = (tp > 0 ? priceDiff : priceDiff * -1) * toAmount
      const timeRemaining = transaction.timeRemaining
      const expired = transaction.expired || tpDistance < 0 || slDistance < 0
      /* const timeRemaining = (reportsData.timestamp + transaction.horizon * 1000) - new Date().getTime()
       * const expired = (reportsData.timestamp + transaction.horizon * 1000) < new Date().getTime() */

      if (!_tableData.hasOwnProperty(transaction.to))
        _tableData[transaction.to] = {
          asset: transaction.to,
          currentPrice: price,
          tpDistance,
          slDistance,
          upnl,
          timeRemaining,
          expired
        }
      else
        _tableData[transaction.to].upnl += upnl
    }

    setProgressValue(90)

    let totalUnPnL = 0.0
    for (const key in _tableData) {
      totalUnPnL += _tableData[key].upnl
    }
    console.log({totalUnPnL}, reportsData.usdtValueAfter, reportsData.usdtValueAfter + totalUnPnL)
    setProgressValue(100)
    setShowProgress(false)
    return _tableData
  }

  async function usePortfolioReport() {
    try {
      // Updating current portfolio first
      // await useCurrentPortfolio(binanceApiKey, binanceSecretKey)
      await updateCurrentPortfolio(binanceApiKey, binanceSecretKey)
      // setCurrentPortfolioData(currPortfolioData)
      // const data = await calculateRiskManagement(currentPortfolioData)
      // setPortfolioData(Object.values(data))
      setPortfolioData(Object.values(riskManagementData))

      setSettingsType('none')
      setPortfolioType('portfolio-report')
    } catch (error) {
      setSettingsType('none')
      setPortfolioType('none')
    }
  }

  async function useEarningsReport() {
    try {
      setSettingsType('none')

      setPortfolioType('earnings-report')
    } catch (error) {
      setSettingsType('none')

      setPortfolioType('none')
    }
  }

  async function handleRecommendedData(data:any, assetName:string) {
    let totalAllocation = 0.0
    for (const asset of data)
      totalAllocation += asset.allocation
    for (const idx in data)
      data[idx].allocation = data[idx].allocation * 100 / totalAllocation
    executeRefreshPortfolioModel(overmindApiKey, assetName)
    setPortfolioData(data)
    setRecommendedPortfolioData(data)
    setPortfolioType('recommended-portfolio')
    setAlertMessage('')
    setShowAlert(false)
  }

  async function handleToExecuteData(data:any) {
    setPortfolioData(data)
    // setOrdersToExecute(data)
    setPortfolioType('to-execute-portfolio')
    setAlertMessage('')
    setShowAlert(false)
    const actions = {
      validateOrders: async () => {
        await callValidatePortfolio(data)
      },
      executeOrders: async () => {
        await callExecutePortfolio(data)
      }
    }
    setPortfolioActions(actions)
  }

  async function handleReallocationOptions(options:any) {
    setReallocateOnlyExpired(options.reallocateOnlyExpired)
    setReallocateAmongAll(options.reallocateAmongAll)
  }

  async function handleSimulatedTrades(asset:string) {
    return await fetchSimulatedTrades(overmindApiKey, asset)
  }

  async function handleAccumulatedRevenue(asset:string) {
    return await fetchAccumulatedRevenue(overmindApiKey, asset)
  }

  async function handleLatestPattern(asset:string) {
    return await fetchLatestPattern(overmindApiKey, asset)
  }

  const handlePortfolioMenuItemClick = async (item:any) => {
    setSettingsType('none')
    if (item == 'recommended-portfolio')
      await useRecommendedPortfolio(overmindApiKey)
    if (item == 'current-portfolio')
      await useCurrentPortfolio()
    if (item == 'to-execute-portfolio')
      await useToExecutePortfolio()
    if (item == 'earnings-report')
      await useEarningsReport()
    if (item == 'portfolio-report')
      await usePortfolioReport()
    if (item == 'api-keys')
      await useApiKeysConfig()
    if (item == 'quit')
      if (await killServer())
        await exit()
  };

  /* const handleConfigurationMenuItemClick = async (item:any) => {
   *
   * }; */

  const getValuations = async(binanceApiKey:string, binanceSecretKey:string) => {
    try {
      const data = await fetchUserAsset(binanceApiKey, binanceSecretKey);
      const { price } = await fetchBTCUSDT();
      const btcUsdtPrice = parseFloat(price)

      let btcValue = 0.0
      for (const asset of data) {
        btcValue += parseFloat(asset['btcValuation'])
      }

      const usdtValue = btcValue * btcUsdtPrice

      return {
        btcValue,
        usdtValue,
        btcUsdtPrice
      }
    } catch (error) {
      console.log(error)
    }
  }

  function updateCurrentPortfolioInterval(intervalInSeconds:number, binanceApiKey:string, binanceSecretKey:string) {
    const now = new Date();
    const currentSeconds = now.getSeconds();
    const currentMilliseconds = now.getMilliseconds();

    // Calculate how many milliseconds until the next interval
    const millisecondsUntilNextInterval =
      ((intervalInSeconds - (currentSeconds % intervalInSeconds)) * 1000) - currentMilliseconds;

    // Doing it for the first time
    updateCurrentPortfolio(binanceApiKey, binanceSecretKey)

    // NOTE: I didn't make any changes to this.
    setTimeout(function () {
      updateCurrentPortfolio(binanceApiKey, binanceSecretKey)
      updateCurrentPortfolioInterval(intervalInSeconds, binanceApiKey, binanceSecretKey)
    }, millisecondsUntilNextInterval);
  }

  function useUpdateCurrentPortfolioInterval(binanceApiKey:string, binanceSecretKey:string) {
    const checkUpdatePortfolioEvery = 600 // seconds
    updateCurrentPortfolioInterval(checkUpdatePortfolioEvery, binanceApiKey, binanceSecretKey)
  }

  async function useTotalAssetsValue(binanceApiKey:string, binanceSecretKey:string) {
    try {
      const valuations = await getValuations(binanceApiKey, binanceSecretKey)
      setBtcBalance(valuations !== undefined ? valuations.btcValue : 0.0)
      setUsdtBalance(valuations !== undefined ? valuations.usdtValue : 0.0)
      return valuations
    } catch (error) {
      console.log(error)
    }
  }

  function saveValuationsInterval(binanceApiKey:string, binanceSecretKey:string, intervalInSeconds:number) {
    const now = new Date();
    const currentSeconds = now.getSeconds();
    const currentMilliseconds = now.getMilliseconds();

    // Calculate how many milliseconds until the next interval
    const millisecondsUntilNextInterval =
      ((intervalInSeconds - (currentSeconds % intervalInSeconds)) * 1000) - currentMilliseconds;

    setTimeout(function () {
      useTotalAssetsValue(binanceApiKey, binanceSecretKey).then((valuation) => {
        saveValuation(valuation);
        saveValuationsInterval(binanceApiKey, binanceSecretKey, intervalInSeconds);
      });
    }, millisecondsUntilNextInterval);
  }

  function useSaveValuationsInterval(binanceApiKey:string, binanceSecretKey:string) {
    const storeValuationsEvery = 90 // seconds
    saveValuationsInterval(binanceApiKey, binanceSecretKey, storeValuationsEvery)
  }

  async function handleApiKeys(apiKeys) {
    setOvermindApiKey(apiKeys?.overmindApiKey);
    setBinanceApiKey(apiKeys?.binanceApiKey);
    setBinanceSecretKey(apiKeys?.binanceSecretKey);
  }

  function isDefined(val: any) {
    if (val === null || val === undefined || val === "")
      return false
    return true
  }

  async function useReadApiKeys() {
    setProgressLabel(readingAPIKeysMsg)
    setProgressValue(0)
    setShowProgress(true)
    const apiKeys = await readApiKeys()
    if (!isDefined(apiKeys.overmindApiKey) ||
        !isDefined(apiKeys.binanceApiKey) ||
        !isDefined(apiKeys.binanceSecretKey)) {
      setSettingsType('api-keys')
      setPortfolioType('none')
      setShowProgress(false)
    }

    else
      handleApiKeys(apiKeys)
    // Updating shown balance
    if (apiKeys !== undefined &&
        isDefined(apiKeys.binanceApiKey) &&
        isDefined(apiKeys.binanceSecretKey)) {

      // Show Total Assets Value
      useTotalAssetsValue(apiKeys.binanceApiKey, apiKeys.binanceSecretKey);

      setProgressLabel(fetchCurrentPortfolioMsg)
      setProgressValue(30)
      // Fetch current portfolio when the app loads
      // await updateCurrentPortfolio(apiKeys.binanceApiKey, apiKeys.binanceSecretKey)
      setProgressLabel(fetchRecommendedPortfolioMsg)
      setProgressValue(70)
      await useRecommendedPortfolio(apiKeys.overmindApiKey)
      if (!runningValidations) {
        useSaveValuationsInterval(apiKeys.binanceApiKey, apiKeys.binanceSecretKey)
        setRunningValidations(true)
      }

      setProgressValue(100)
      setShowProgress(false)

      // const subAddress = await fetchSubAddress(apiKeys.binanceApiKey, apiKeys.binanceSecretKey, 'XRP')
      // console.log({subAddress})

      // executeWithdrawApply(apiKeys.binanceApiKey, apiKeys.binanceSecretKey, 0.000001, 'BCH', 'emanuell.cp@gmail.com')
    }
  }

  useEffect(() => {
    useReadApiKeys()
    /* fetchAssetPrices(["TRXUSDT","AVAXUSDT"]).then((prices) => {
     *   console.log({prices})
     * }) */
  }, []);

  // Update current portfolio every N seconds
  useEffect(() => {
    if (updatingPortfolio || binanceApiKey === "" || binanceSecretKey === "")
      return;
    useUpdateCurrentPortfolioInterval(binanceApiKey, binanceSecretKey)
    setUpdatingPortfolio(true)
  }, [binanceApiKey, binanceSecretKey, updatingPortfolio]);

  // Check if we can trade every N seconds
  useEffect(() => {
    if (currentPortfolioData === null || overmindApiKey === "")
      return;

    // console.log('executing!', {riskManagementData}, {currentPortfolioData})

    let isAnyExpired = false
    for (const asset of currentPortfolioData) {
      if (asset.expired) {
        isAnyExpired = true
        break
      }
    }
    // if (isAnyExpired || true) {
    // if (isAnyExpired && false) {
    if (isAnyExpired) {
      fetchRecommendedPortfolio(overmindApiKey).then((data) => {
        setPortfolioData(data)
        setRecommendedPortfolioData(data);

        switchPortfolio(data, currentPortfolioData, true, true).then((switchData) => {
          // switchPortfolio(data, currentPortfolioData, false, true).then((switchData) => {
          validatePortfolio(switchData).then((areValid) => {
            if (areValid) {
              executePortfolio(switchData).then(() => {
                updateCurrentPortfolio(binanceApiKey, binanceSecretKey)
              })
            }
          })
        })
      })
    }

  }, [currentPortfolioData, overmindApiKey]);

  useEffect(() => {
    if (portfolioType == 'to-execute-portfolio')
      useToExecutePortfolio()
  }, [reallocateAmongAll, reallocateOnlyExpired])

  useEffect(() => {
    setValidatedPortfolio(false)
  }, [portfolioData]);

  /* const openLink = (url) => {
   *   shell.open(url);
   * }; */

  return (
    <ThemeProvider theme={defaultTheme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="absolute" open={open}>
          <Toolbar
            sx={{
              pr: '24px', // keep right padding when drawer closed
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              sx={{
                marginRight: '36px',
                ...(open && { display: 'none' }),
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              component="h1"
              variant="h6"
              color="inherit"
              noWrap
              sx={{ flexGrow: 1 }}
            >
              Overmind Desktop
            </Typography>
            {/*<IconButton color="inherit">
                <Badge badgeContent={4} color="secondary">
                <NotificationsIcon />
                </Badge>
                </IconButton>*/}
            <Steps
              enabled={showTour}
              steps={steps}
              initialStep={0}
              onExit={handleTourClose}
              options={{
                tooltipClass: "tooltip-class"
              }}
            />
            <IconButton color="inherit" sx={{ marginLeft: 2 }}>
              <Badge variant="dot" color="secondary">
                <HelpIcon onClick={handleTourOpen} />
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>
        <Drawer variant="permanent" open={open}>
          <Toolbar
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              px: [1],
            }}
          >
            <IconButton onClick={toggleDrawer}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <Divider />
          <List component="nav">
            {menuListItems(handlePortfolioMenuItemClick)}
          </List>
        </Drawer>
        {(showAlert) && (
          <Alert title={''} message={alertMessage} action={alertAction} closeAction={handleAlertClose} />
        )}
        {(showProgress) && (
          <Dialog onClose={handleProgressClose}
                  open={showProgress}
                  fullWidth={true}
          >
            <DialogContent>
              <LinearProgressWithLabel value={progressValue} label={progressLabel} />
            </DialogContent>
          </Dialog>
        )}
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === 'light'
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <Toolbar />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8} lg={7}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 240,
                  }}
                >
                  <News overmindApiKey={overmindApiKey} />
                </Paper>
              </Grid>
              <Grid item xs={12} md={4} lg={3}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 240,
                    textAlign: 'center',
                  }}
                >
                  <Balance usdtBalance={usdtBalance} btcBalance={btcBalance} />
                </Paper>
              </Grid>
              <Grid item xs={12} md={4} lg={2}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 240,
                    textAlign: 'center',
                    justifyContent: 'center', // Center content horizontally
                    alignItems: 'center', // Center content vertically
                  }}
                >
                  
                </Paper>
              </Grid>
              <Grid item xs={12}>
                {(portfolioType != 'none') && (
                  <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                    <Portfolio data={portfolioData}
                               type={portfolioType}
                               actions={portfolioActions}
                               alerts={portfolioAlerts}
                               dataHandler={portfolioType == 'recommended-portfolio' ? handleRecommendedData : handleToExecuteData}
                               validatedPortfolio={validatedPortfolio}
                               simulatedTradesHandler={async (asset:string) => {
                                 return await handleSimulatedTrades(asset)
                               }}
                               accumulatedRevenueHandler={async (asset:string) => {
                                 return await handleAccumulatedRevenue(asset)
                               }}
                               latestPatternHandler={async (asset:string) => {
                                 return await handleLatestPattern(asset)
                               }}
                               handleReallocationOptions={async (options) => {
                                 return await handleReallocationOptions(options)
                               }}
                    />
                  </Paper>
                )}
                {(settingsType != 'none') && (
                  <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                    <Settings
                      apiKeys={{overmindApiKey, binanceApiKey, binanceSecretKey}}
                      action={handleApiKeys}
                    />
                  </Paper>
                )}
                {/*(portfolioType != 'none') && (
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                    <Report data={reportData}
                    type={reportType}
                    />
                    </Paper>
                    )*/}
              </Grid>
            </Grid>
            <Copyright sx={{ pt: 4 }} />
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
