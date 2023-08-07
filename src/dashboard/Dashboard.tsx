import { useState, useEffect } from 'react';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import { exit } from '@tauri-apps/api/process';
import CssBaseline from '@mui/material/CssBaseline';
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { mainListItems,
         secondaryListItems,
         configListItems
} from './listItems';
import Chart from './Chart';
import Balance from './Balance';
import Portfolio from './Portfolio';
import Alert from './Alert';

import { fetchRecommendedPortfolio,
         fetchCurrentPortfolio,
         fetchAccountSnapshot,
         switchPortfolio,
         killServer
} from '../dataHelpers'
import { join, homeDir } from '@tauri-apps/api/path';
import { readTextFile } from '../fsHelpers';

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

export default function Dashboard() {
  const [open, setOpen] = useState(true);
  const [portfolioType, setPortfolioType] = useState("none");
  const [portfolioData, setPortfolioData] = useState([]);
  const [binanceApiKey, setBinanceApiKey] = useState("");
  const [binanceSecretKey, setBinanceSecret] = useState("");
  const [overmindApiKey, setOvermindApiKey] = useState("");
  const [recommendedPortfolioData, setRecommendedPortfolioData] = useState(null);
  const [currentPortfolioData, setCurrentPortfolioData] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [ordersToExecute, setOrdersToExecute] = useState([]);
  const [btcBalance, setBtcBalance] = useState(0.0);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  async function useRecommendedPortfolio(overmindApiKey:string) {
    try {
      const data = await fetchRecommendedPortfolio(overmindApiKey)
      setPortfolioData(data);
      setRecommendedPortfolioData(data);
    } catch (error) {
      setPortfolioData([]);
    }
  }

  async function useCurrentPortfolio(binanceApiKey:string, binanceSecretKey:string) {
    try {
      const data = await fetchCurrentPortfolio(binanceApiKey, binanceSecretKey)
      setPortfolioData(data);
      setCurrentPortfolioData(data);
    } catch (error) {
      setPortfolioData([]);
    }
  }

  async function useExecutePortfolio(binanceApiKey:string, binanceSecretKey:string) {
    try {
      // Check if both bullish and current portfolio data are available
      if (!recommendedPortfolioData || !currentPortfolioData) {
        console.log('Data not available. Please fetch the portfolios first.')
        setAlertMessage('Data not available. Please fetch the portfolios first.')
        setShowAlert(true)
        setPortfolioData([])
        return;
      }

      const data = await switchPortfolio(recommendedPortfolioData, currentPortfolioData);
      console.log({data})
      setOrdersToExecute(data)
      setPortfolioData(data)
    } catch (error) {
      setPortfolioData([]);
    }
  }

  const handlePortfolioMenuItemClick = async (item) => {
    if (item == 'recommended-portfolio')
      await useRecommendedPortfolio(overmindApiKey)
    if (item == 'current-portfolio')
      await useCurrentPortfolio(binanceApiKey, binanceSecretKey)
    if (item == 'execute-portfolio')
      await useExecutePortfolio(binanceApiKey, binanceSecretKey)
    setPortfolioType(item)
  };

  const handleConfigurationMenuItemClick = async (item) => {
    /* if (item == 'api-keys') */
      // await useRecommendedPortfolio(overmindApiKey)
    if (item == 'quit')
      if (await killServer())
        await exit()
  };

  async function useAccountSnapshot(binanceApiKey:string, binanceSecretKey:string) {
    try {
      const data = await fetchAccountSnapshot(binanceApiKey, binanceSecretKey);
      /* let btcValue = 0.0
       * console.log('updating balance')
       * for (const idx in data.snapshotVos) {
       *   const asset = data.snapshotVos[idx]
       *   console.log({asset})
       *   btcValue += parseFloat(asset.data['totalAssetOfBtc'])
       * } */
      setBtcBalance(parseFloat(data.snapshotVos[0].data['totalAssetOfBtc']))
    } catch (error) {
      // setPortfolioData([]);
    }
  }

  async function readApiKeys() {
    try {
      // Read the contents of the desktop-config.json file using Tauri's API
      const homePath = await homeDir();
      const configPath = await join(homePath, "overmind/desktop-config.json")
      const configJson = await readTextFile(configPath);

      // Parse the JSON data
      const configData = JSON.parse(configJson);

      // Set the API keys from the config data
      setBinanceApiKey(configData.binanceApiKey || "");
      setBinanceSecret(configData.binanceSecretKey || "");
      setOvermindApiKey(configData.overmindApiKey || "");
      // Updating shown balance
      useAccountSnapshot(configData.binanceApiKey, configData.binanceSecretKey);
    } catch (error) {
      console.error("Error reading API keys:", error);
    }
  }

  useEffect(() => {
    readApiKeys();
  }, []);

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
            <IconButton color="inherit">
              <Badge badgeContent={4} color="secondary">
                <NotificationsIcon />
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
            {secondaryListItems(handlePortfolioMenuItemClick)}
            <Divider sx={{ my: 1 }} />
            {configListItems(handleConfigurationMenuItemClick)}
          </List>
        </Drawer>
        {(showAlert) && (
          <Alert message={alertMessage} />
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
              {/* Chart */}
              <Grid item xs={12} md={7} lg={8}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 240,
                  }}
                >
                  <Chart />
                </Paper>
              </Grid>
              {/* BTC Total Assets Value */}
              <Grid item xs={12} md={5} lg={4}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 240,
                  }}
                >
                  <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                    <Balance balance={btcBalance} />
                  </Paper>
                </Paper>
              </Grid>
              {/* Recent Orders */}
              <Grid item xs={12}>
                {(portfolioType != 'none') && (
                  <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                    <Portfolio data={portfolioData} type={portfolioType} />
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
