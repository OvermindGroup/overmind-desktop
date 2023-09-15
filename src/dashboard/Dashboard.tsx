import { useState, useEffect, Fragment } from 'react';
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

import { mainListItems,
         secondaryListItems,
         configListItems
} from './listItems';
import Chart from './Chart';
import Settings from './Settings';
import Balance from './Balance';
import Report from './Report';
import Portfolio from './Portfolio';
import Alert from './Alert';

import { fetchRecommendedPortfolio,
         fetchUserAsset,
         fetchBTCUSDT,
         fetchDust,
         fetchAssetPrices,
         fetchTrainPortfolio,
         fetchAccountSnapshot,
         fetchSimulatedTrades,
         fetchAccumulatedRevenue,
         executeDust,
         executeRefreshPortfolio,
         executeOrder,
         switchPortfolio,
         readApiKeys,
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

const boxStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '60%',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const ProgressContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3)
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

export default function Dashboard() {
  const [open, setOpen] = useState(true);
  const [portfolioType, setPortfolioType] = useState("none");
  const [portfolioActions, setPortfolioActions] = useState({});

  const [portfolioData, setPortfolioData] = useState(null);
  const [recommendedPortfolioData, setRecommendedPortfolioData] = useState(null);
  const [currentPortfolioData, setCurrentPortfolioData] = useState(null);
  const [ordersToExecute, setOrdersToExecute] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [chartData, setChartData] = useState([]);

  const [overmindApiKey, setOvermindApiKey] = useState("");
  const [binanceApiKey, setBinanceApiKey] = useState("");
  const [binanceSecretKey, setBinanceSecretKey] = useState("");

  const [alertTitle, setAlertTitle] = useState('');
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
  const [reportType, setReportType] = useState('none');
  const [portfolioAlerts, setPortfolioAlerts] = useState([]);
  const [validatedPortfolio, setValidatedPortfolio] = useState(false);

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

  const callRefreshPortfolio = async (overmindApiKey:string) => {
    try {
      const data = await executeRefreshPortfolio(overmindApiKey)
      setPortfolioData(data);
      setRecommendedPortfolioData(data);
    } catch (error) {
      setPortfolioData(null);
    }
  }

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
      console.log({data})
      setPortfolioData(data);
      setRecommendedPortfolioData(data);
    } catch (error) {
      setPortfolioData(null);
    }
  }

  const callValidatePortfolio = async (ordersToExecute) => {
    try {
      setShowProgress(true)
      const quotes = []
      for (const idx in ordersToExecute) {
        const transaction = ordersToExecute[idx]
        let { from, to } = transaction
        from = from.slice(0, -3).toUpperCase();
        to = to.slice(0, -3).toUpperCase();
        setProgressLabel(`Validating ${from} 🠞 ${to}`)
        quotes.push(await getQuote(binanceApiKey, binanceSecretKey, transaction))
        setProgressValue(Math.round((idx + 1) / ordersToExecute.length * 100))
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

      setPortfolioType('to-execute-portfolio')
      setReportType('none')
      setShowAlert(true)
      setAlertAction(null)
      setPortfolioAlerts(null)
      setAlertMessage('All orders have been validated successfully. You can now update your portfolio by clicking on the "Execute Orders" button.')

      if (portfolioAlerts.length > 0) {
        setPortfolioAlerts(portfolioAlerts)
        setAlertMessage('There are issues with some orders. Please check their status. After fixing all the issues, please try to validate the orders again.')
        return
      }
      setValidatedPortfolio(true)
    } catch (error) {
      setPortfolioData(null);
      setAlertMessage('Something went wrong when trying to validate your orders.')
      setShowAlert(true)
    }
  }

  const callExecutePortfolio = async (ordersToExecute) => {
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
        setProgressValue(Math.round((idx + 1) / ordersToExecute.length * 100))
        await sleep(500)
      }

      await sleep(1000)

      setProgressLabel(`Preparing data`)
      const symbolsSet = [...new Set(symbols)]
      const startingPrices = await fetchAssetPrices(symbolsSet)

      await sleep(1000)
      setProgressValue(0)
      setProgressLabel(`Saving report`)
      const valuationsAfter = await getValuations(binanceApiKey, binanceSecretKey)
      setProgressValue(25)
      await sleep(1000);
      const assetsAfter = await fetchUserAsset(binanceApiKey, binanceSecretKey)
      console.log({assetsAfter})
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

      saveReport(report)
      await sleep(1000);
      setProgressValue(100)
      await sleep(1000);
      setShowProgress(false)

      setPortfolioType('to-execute-portfolio')
      setReportType('none')
      setShowAlert(true)
      setAlertAction(null)
      setPortfolioAlerts(null)
      setAlertMessage('All orders were executed successfully.')

    } catch (error) {
      setPortfolioData(null);
      setAlertMessage('Something went wrong when trying to update your portfolio.')
      setShowAlert(true)
    }
  }

  async function useRecommendedPortfolio(overmindApiKey:string) {
    try {
      const data = await fetchRecommendedPortfolio(overmindApiKey)
      setPortfolioData(data);
      setRecommendedPortfolioData(data);
      setPortfolioType('recommended-portfolio')
      setReportType('none')
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

  async function getLatestReport() {
    const latestReport = await getReports(1)
    const data = JSON.parse(latestReport[0].report) // We always get 1.

    const _reports = {
      transactions: [],
      symbols: [],
      timestamp: data.timestamp,
      btcValueBefore: data.valuationsBefore.btcValue,
      btcValueAfter: data.valuationsAfter.btcValue,
      usdtValueBefore: data.valuationsBefore.usdtValue,
      usdtValueAfter: data.valuationsAfter.usdtValue,
      startingPrices: data.startingPrices,
      toAmounts: data.toAmounts
    }

    const symbols = []

    for (const transaction of data.ordersToExecute) {
      const from = transaction.from.slice(0, -3).toUpperCase()
      const to = transaction.to.slice(0, -3).toUpperCase()
      const report = {
        from,
        to,
        startingPrice: data.startingPrices[`${to}USDT`],
        amount: transaction.amount,
        takeProfit: transaction.takeProfit,
        stopLoss: transaction.stopLoss,
        horizon: transaction.horizon,
      }
      symbols.push(`${to}USDT`)
      _reports.transactions.push(report)
    }

    _reports.symbols.push(...new Set(symbols))

    const prices = await fetchAssetPrices(_reports.symbols)
    const _tableData = {}
    for (const transaction of _reports.transactions) {
      const symbol = `${transaction.to}USDT`
      const startPrice = parseFloat(transaction.startingPrice)
      const tp = transaction.takeProfit
      const sl = transaction.stopLoss
      const price = parseFloat(prices[symbol])
      const priceDiff = price - startPrice
      const toAmount = _reports.toAmounts[transaction.to]
      const tpDistance = Math.abs(price - (startPrice + tp)) * toAmount
      const slDistance = Math.abs(price - (startPrice + sl)) * toAmount
      const upnl = (tp > 0 ? priceDiff : priceDiff * -1) * toAmount
      const timeRemaining = (_reports.timestamp + transaction.horizon * 1000) - new Date().getTime()
      const expired = (_reports.timestamp + transaction.horizon * 1000) < new Date().getTime()

      if (!_tableData.hasOwnProperty(transaction.from))
        _tableData[transaction.to] = {
          asset: transaction.to,
          tpDistance,
          slDistance,
          upnl,
          timeRemaining,
          expired
        }
      else
        _tableData[transaction.to].upnl += upnl
    }

    let totalUnPnL = 0.0
    for (const key in _tableData) {
      totalUnPnL += _tableData[key].upnl
    }
    console.log({totalUnPnL}, _reports.usdtValueAfter)
    /* setTableData(Object.values(_tableData))
     * setTableReady(true) */

    return _tableData
  }

  async function useCurrentPortfolio(binanceApiKey:string, binanceSecretKey:string) {
    try {
      const data = await fetchUserAsset(binanceApiKey, binanceSecretKey)
      const latestReport = await getLatestReport()
      // Removing extremely small asset holdings
      const cleanedData = []
      for (let asset of data) {
        if (parseFloat(asset.btcValuation) == 0)
          continue

        if (latestReport.hasOwnProperty(asset.asset)) {
          asset.expired = latestReport[asset.asset].expired
        }
        else
          asset.expired = true // To force a reallocation; something went wrong somehow
        cleanedData.push(asset)
      }

      setPortfolioData(cleanedData);
      setCurrentPortfolioData(cleanedData);
      setPortfolioType('current-portfolio')
      setReportType('none')
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
        setReportType('none')
        setSettingsType('none')
        return;
      }

      /* const readyForReallocation = []
       * for (const asset of currentPortfolioData)
       *   if (asset.expired)
       *     readyForReallocation.push(asset) */

      const data = await switchPortfolio(recommendedPortfolioData, currentPortfolioData, reallocateOnlyExpired, reallocateAmongAll)

      setOrdersToExecute(data)
      setPortfolioData(data)
      setPortfolioType('to-execute-portfolio')
      setReportType('none')
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
      setOrdersToExecute(null)
    }
  }

  async function useApiKeysConfig() {
    try {
      setSettingsType('api-keys')
      setReportType('none')
      setPortfolioType('none')
    } catch (error) {
      setSettingsType('none')
      setReportType('none')
      setPortfolioType('none')
    }
  }

  async function usePortfolioReport() {
    try {
      setSettingsType('none')
      setReportType('portfolio-report')
      setPortfolioType('none')
    } catch (error) {
      setSettingsType('none')
      setReportType('none')
      setPortfolioType('none')
    }
  }

  async function handleData(data) {
    setPortfolioData(data)
    setOrdersToExecute(data)
    setPortfolioType('to-execute-portfolio')
    setReportType('none')
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

  async function handleReallocationOptions(options) {
    setReallocateOnlyExpired(options.reallocateOnlyExpired)
    setReallocateAmongAll(options.reallocateAmongAll)
  }

  async function handleSimulatedTrades(asset:string) {
    return await fetchSimulatedTrades(overmindApiKey, asset)
  }

  async function handleAccumulatedRevenue(asset:string) {
    return await fetchAccumulatedRevenue(overmindApiKey, asset)
  }

  const handlePortfolioMenuItemClick = async (item) => {
    setSettingsType('none')
    if (item == 'recommended-portfolio')
      await useRecommendedPortfolio(overmindApiKey)
    if (item == 'current-portfolio')
      await useCurrentPortfolio(binanceApiKey, binanceSecretKey)
    if (item == 'to-execute-portfolio')
      await useToExecutePortfolio()
  };

  const handleReportsMenuItemClick = async (item) => {
    /* if (item == 'earnings-report')
     *   await useApiKeysConfig() */
    if (item == 'portfolio-report')
      await usePortfolioReport()
  };

  const handleConfigurationMenuItemClick = async (item) => {
    if (item == 'api-keys')
      await useApiKeysConfig()
    if (item == 'quit')
      if (await killServer())
        await exit()
  };

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
    saveValuationsInterval(binanceApiKey, binanceSecretKey, 500)
  }

  async function handleApiKeys(apiKeys) {
    setOvermindApiKey(apiKeys?.overmindApiKey);
    setBinanceApiKey(apiKeys?.binanceApiKey);
    setBinanceSecretKey(apiKeys?.binanceSecretKey);
  }

  async function useReadApiKeys() {
    const apiKeys = await readApiKeys()
    handleApiKeys(apiKeys)
    // Updating shown balance
    if (apiKeys !== undefined &&
        apiKeys.binanceApiKey !== undefined &&
        apiKeys.binanceSecretKey !== undefined) {

      /* useTotalAssetsValue(apiKeys.binanceApiKey, apiKeys.binanceSecretKey);
       * const { snapshotVos } = await fetchAccountSnapshot(apiKeys.binanceApiKey, apiKeys.binanceSecretKey)
       * setChartData(snapshotVos) */

      await useRecommendedPortfolio(apiKeys.overmindApiKey)
      if (!runningValidations) {
        useSaveValuationsInterval(apiKeys.binanceApiKey, apiKeys.binanceSecretKey)
        setRunningValidations(true)
      }

      /* fetchDust(apiKeys.binanceApiKey, apiKeys.binanceSecretKey).then((dustResult) => {
       *   const dustAssets = []
       *   for (const dust of dustResult.details) {
       *     dustAssets.push(dust.asset)
       *   }
       *   console.log({dustAssets})
       *   executeDust(apiKeys.binanceApiKey,
       *               apiKeys.binanceSecretKey,
       *               dustAssets).then((result) => {
       *                 console.log({result})
       *               })
       * }) */
    }
  }

  useEffect(() => {
    useReadApiKeys()
    /* fetchAssetPrices(["TRXUSDT","AVAXUSDT"]).then((prices) => {
     *   console.log({prices})
     * }) */
  }, []);

  useEffect(() => {
    if (portfolioType == 'to-execute-portfolio')
      useToExecutePortfolio()
  }, [reallocateAmongAll, reallocateOnlyExpired])

  useEffect(() => {
    setValidatedPortfolio(false)
  }, [portfolioData]);

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
            {mainListItems(handlePortfolioMenuItemClick)}
            <Divider sx={{ my: 1 }} />
            {secondaryListItems(handleReportsMenuItemClick)}
            <Divider sx={{ my: 1 }} />
            {configListItems(handleConfigurationMenuItemClick)}
          </List>
        </Drawer>
        {(showAlert) && (
          <Alert title={alertTitle} message={alertMessage} action={alertAction} closeAction={handleAlertClose} />
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
              <Grid item xs={12} md={8} lg={9}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 240,
                  }}
                >
                  <Chart data={chartData} />
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
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                    <Balance usdtBalance={usdtBalance} btcBalance={btcBalance} />
                  </Paper>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                {(portfolioType != 'none') && (
                  <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                    <Portfolio data={portfolioData}
                               type={portfolioType}
                               actions={portfolioActions}
                               alerts={portfolioAlerts}
                               dataHandler={handleData}
                               validatedPortfolio={validatedPortfolio}
                               simulatedTradesHandler={async (asset:string) => {
                                 return await handleSimulatedTrades(asset)
                               }}
                               accumulatedRevenueHandler={async (asset:string) => {
                                 return await handleAccumulatedRevenue(asset)
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
                {(reportType != 'none') && (
                  <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                    <Report data={reportData}
                            type={reportType}
                    />
                  </Paper>
                )}
              </Grid>
            </Grid>
            <Copyright sx={{ pt: 4 }} />
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
