import * as React from 'react';
import { useEffect, useState } from 'react';
import { useTable } from "react-table";
import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import Modal from '@mui/material/Modal';
import Slider from '@mui/material/Slider'
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

import Chart from 'react-apexcharts'
import IconButton from '@mui/material/IconButton';
import { PrimeReactProvider } from 'primereact/api'
import { InputNumber } from 'primereact/inputnumber'

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CircleIcon from '@mui/icons-material/Circle';
import CancelIcon from '@mui/icons-material/Cancel';
import Alert from './Alert';
import CandlestickChart from './CandlestickChart';
import RevenueChart from './RevenueChart';
import Earnings from './Earnings';

import './styles.css'

const earningsColumns = [

]

const reportColumns = [
    { Header: "Asset", accessor: "asset"},
    { Header: "Unrealized PnL", accessor: "upnl", format: "usdt"},
    { Header: "Distance to Take Profit", accessor: "tpDistance", format: "usdt"},
    { Header: "Distance to Stop Loss", accessor: "slDistance", format: "usdt"},
    { Header: "Time Remaining", accessor: "timeRemaining", format: "seconds"},
    { Header: "Reallocate?", accessor: "expired", format: "boolean"},
]

const recommendedPortfolioColumns = [
    { Header: "Asset", accessor: "instrument", format: "asset"},
    { Header: "Allocation (%)", accessor: "allocation", format: "percentage" },
    { Header: "Take Profit", accessor: "takeProfit", collapsable: true },
    { Header: "Stop Loss", accessor: "stopLoss", collapsable: true },
    { Header: "Hold Duration", accessor: "horizonFormatted", collapsable: true },
    { Header: "Risk Reward", accessor: "riskReward", format: "twoDecimals" },
    { Header: "Remove", format: "removeOrder" }
];

const currentPortfolioColumns = [
    { Header: "Asset", accessor: "asset" },
    { Header: "Allocation ($)", accessor: "free" },
    { Header: "Allocation (%)", accessor: "allocation", format: "percentage"},
    { Header: "BTC Valuation", accessor: "btcValuation" },
    { Header: "Ready for Reallocation?", accessor: "expired", format: "boolean" }
];

const executePortfolioColumns = [
    { Header: "From", accessor: "from", format: "asset" },
    { Header: "To", accessor: "to", format: "asset" },
    { Header: "Amount to Convert", accessor: "amount", format: "amountExecute" },
    { Header: "Allocation (% of Total Portfolio)", accessor: "allocation", format: "percentageExecute" },
    { Header: "Status", accessor: "status", format: "status" },
    { Header: "Remove Order", format: "removeOrder" }
];

const formatPercentage = (cellValue:any) => {
    return `${parseFloat(cellValue).toFixed(2)}%`;
};

const formatPercentageExecute = (cellValue:any) => {
    if (parseFloat(cellValue) === 0)
        return "Update Risk Management"
    return `${parseFloat(cellValue).toFixed(2)}%`;
};

const formatTwoDecimals = (cellValue:any) => {
    return parseFloat(cellValue).toFixed(2);
};

const formatAsset = (cellValue:any) => {
    if (cellValue.length > 5)
        return cellValue.slice(0, -3).toUpperCase();
    return cellValue
};

const formatUSDT = (cellValue:any) => {
    return `$${parseFloat(cellValue).toFixed(4)} USDT`;
};

const formatAmountExecute = (cellValue:any) => {
    if (parseFloat(cellValue) === 0)
        return "Update Risk Management"
    return cellValue
};

const formatBoolean = (cellValue:any) => {
    return cellValue ? 'Yes' : 'No';
};

function formatSeconds(seconds:number) {
    seconds = seconds / 1000
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    // Create a formatted string
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;

    return formattedTime;
}

const getTableMetadata = (type:string ) => {
    let columns = []
    let title = ''
    if (type == 'recommended-portfolio') {
        columns = recommendedPortfolioColumns
        title = 'Portfolio Optimization'
    }
    if (type == 'current-portfolio' || type == 'execute-portfolio') {
        columns = currentPortfolioColumns
        title = 'Current Portfolio'
    }
    if (type == 'to-execute-portfolio') {
        columns = executePortfolioColumns
        title = 'Orders to Execute to Update Portfolio'
    }
    if (type == 'earnings-report') {
        columns = earningsColumns
        title = 'Profit & Loss'
    }
    if (type == 'portfolio-report') {
        columns = reportColumns
        title = 'Risk Management'
    }
    return { columns, title }
}

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

const CustomButton = styled(Button)(({ theme }) => ({
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
}));

const FormContainer = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
}));

const ChartContainer = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3)
}));

const Title = styled(Typography)(({ theme }) => ({
    marginBottom: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingBottom: theme.spacing(1),
}));

const MoreInfoTitle = styled(Typography)(({ theme }) => ({
    marginTop: theme.spacing(4),
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingBottom: theme.spacing(1),
}));

const Paragraph = styled(Typography)(({ theme }) => ({
    marginBottom: theme.spacing(2),
    paddingBottom: theme.spacing(1),
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
        backgroundColor: theme.palette.common.black,
        color: theme.palette.common.white,
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,
    },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    // hide last border
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));

function Row({ data, type, alertRows, removeRowAction, simulatedTradesHandler, accumulatedRevenueHandler, latestPatternHandler }) {
    const [open, setOpen] = useState(false);
    const [alertAction, setAlertAction] = useState(null);
    const [rowStatus, setRowStatus] = useState('');
    const [showSimulatedTrades, setShowSimulatedTrades] = useState(false);
    const [simulatedTradesData, setSimulatedTradesData] = useState([]);
    const [showAccumulatedRevenue, setShowAccumulatedRevenue] = useState(false);
    const [accumulatedRevenueData, setAccumulatedRevenueData] = useState([]);
    // const [latestPatternData, setLatestPatternData] = useState([]);
    const [instrument, setInstrument] = useState('');
    const [patternSeries, setPatternSeries] = useState([]);
    const [patternOptions, setPatternOptions] = useState({});

    /* function getRandomHexColor() {
     *     // Generate a random hex color code
     *     const letters = '0123456789ABCDEF';
     *     let color = '#';
     *     for (let i = 0; i < 6; i++) {
     *         color += letters[Math.floor(Math.random() * 16)];
     *     }
     *     return color;
     * } */

    useEffect(() => {
        if (type === 'recommended-portfolio') {
            setInstrument(data.values.instrument)
        }
    }, [data]);

    useEffect(() => {
        if (type === 'to-execute-portfolio' && alertRows != null) {
            const dataFrom = data.values.from.slice(0, -3).toUpperCase();
            const dataTo = data.values.to.slice(0, -3).toUpperCase();
            const dataAmount = data.values.amount;
            const alertKey = `${dataFrom}${dataTo}${dataAmount}`;

            if (alertRows.hasOwnProperty(alertKey)) {
                setAlertAction(() => alertRows[alertKey]);
            } else {
                setAlertAction(null);
                setRowStatus('Pass')
            }
        }
    }, [type, alertRows, data]);

    useEffect(() => {
        if (type === 'recommended-portfolio' && instrument != "") {
            latestPatternHandler(instrument).then((pattern) => {
                let yMin = pattern[0]['input']
                let yMax = yMin
                const series = {}

                series['input'] = {}
                series['input']['name'] = 'Latest Prices'
                series['input']['type'] = 'line'
                series['input']['color'] = '#e3f2fd'
                series['input']['data'] = []

                series['patternArea'] = {}
                series['patternArea']['name'] = "Recognized Pattern Area"
                series['patternArea']['type'] = 'rangeArea'
                series['patternArea']['color'] = '#29b6f6'
                series['patternArea']['data'] = []

                series['patternMean'] = {}
                series['patternMean']['name'] = "Recognized Pattern Mean"
                series['patternMean']['type'] = 'line'
                series['patternMean']['color'] = '#29b6f6'
                series['patternMean']['data'] = []

                for (const idx in pattern) {
                    const point = pattern[idx]
                    const allPoints = [point['input'], point['upper'], point['mean'], point['lower']]
                    const max = Math.max(...allPoints)
                    const min = Math.min(...allPoints)
                    if (max > yMax)
                        yMax = max
                    if (min < yMin)
                        yMin = min
                    series['input']['data'].push({x: idx, y: allPoints[0]})
                    series['patternArea']['data'].push({x: idx, y: [point['upper'], point['lower']]})
                    series['patternMean']['data'].push({x: idx, y: point['mean']})
                    /* series['pattern']['data'].push({x: idx, y: [point['lower'], point['lower'], point['mean'], point['upper'], point['upper']]}) */
                }

                setPatternSeries([series['input'], series['patternArea'], series['patternMean']])

                const opts = {
                    chart: {
                        animations: {
                            enabled: false
                        },
                        dropShadow: {
                            enabled: false
                        },
                        toolbar: {
                            show: false
                        },
                        background: '#1e1e1e'
                    },
                    plotOptions: {
                        bar: {
                            rangeBarGroupRows: true,
                        }
                    },
                    tooltip: {
                        enabled: false
                    },
                    fill: {
                        type: ['solid', 'solid', 'solid'],
                        pattern: {
                            style: 'verticalLines',
                            strokeWidth: 3
                        },
                        gradient: {
                            gradientToColors: ['#fff', '#fff'],
                            gradientFromColors: ['#fff', '#fff'],
                            inverseColors: true,
                            shade: 'light',
                            type: 'horizontal',
                            opacityFrom: [1.0, 1.0, 0.0],
                            opacityTo: [1.0, 0.5, 0.0]
                        }
                    },
                    markers: {
                        size: [3, 0, 0]
                    },
                    stroke: {
                        curve: ['straight', 'straight', 'straight'],
                        width: [0, 0, 5],
                        dashArray: [0, 0, 5]
                    },
                    title: {
                        text: '',
                        align: 'center',
                        offsetY: 10
                    },
                    theme: {
                        mode: 'dark',
                        palette: 'palette5'
                    },
                    grid: {
                        show: false
                    },
                    noData: {
                        text: 'Loading...'
                    },
                    legend: {
                        show: false
                    },
                    xaxis: {
                        labels: {
                            show: false
                        },
                        axisBorder: {
                            show: false
                        },
                        axisTicks: {
                            show: false
                        }
                    },
                    dataLabels: {
                        enabled: false,
                    },
                    yaxis: {
                        show: false,
                        min: yMin,
                        max: yMax
                    }
                }
                setPatternOptions(opts)
            })
        }
    }, [type, instrument]);

    const handleModalClose = async () => {
        try {
            setShowSimulatedTrades(false)
            setSimulatedTradesData([])
            setShowAccumulatedRevenue(false)
            setAccumulatedRevenueData([])
        } catch (error) {
            console.log(error)
        }
    }

    const formatCellValue = (column:any, cell:any) => {
        if (column.format === "percentage") {
            return formatPercentage(cell.value);
        } else if (column.format === "percentageExecute") {
            return formatPercentageExecute(cell.value);
        } else if (column.format === "twoDecimals") {
            return formatTwoDecimals(cell.value);
        } else if (column.format === "asset") {
            return formatAsset(cell.value);
        } else if (column.format === "status") {
            return formatStatus();
        } else if (column.format === "removeOrder") {
            return formatRemoveOrder();
        } else if (column.format === "boolean") {
            return formatBoolean(cell.value);
        } else if (column.format === "seconds") {
            return formatSeconds(cell.value);
        } else if (column.format === "usdt") {
            return formatUSDT(cell.value);
        } else if (column.format === "amountExecute")
            return formatAmountExecute(cell.value)
        else {
            return cell.value;
        }
    };

    const formatStatus = () => {
        if (alertAction !== null) {
            return (
                <Badge color="secondary" variant="dot" onClick={alertAction} className="badge-icon">
                    <ErrorIcon className="warning-icon" />
                </Badge>
            )
        }
        if (rowStatus == 'Success')
            return (
                <Badge color="secondary">
                    <CheckCircleIcon className="success-icon" />
                </Badge>
            )
        if (rowStatus == 'Pass')
            return (
                <Badge>
                    <CircleIcon className="info-icon" />
                </Badge>
            )
        return (
            <Badge color="secondary">
                <CircleIcon />
            </Badge>
        )
    };

    const formatRemoveOrder = () => {
        return (
            <Badge className="badge-icon"
                   onClick={() => {
                       removeRowAction(data.index)
                   }}>
                <CancelIcon className="error-icon" />
            </Badge>
        )
    };

    return (
        <React.Fragment>
            <StyledTableRow {...data.getRowProps()}>
                {type === 'recommended-portfolio' && (
                    <StyledTableCell>
                        <IconButton
                            aria-label="expand row"
                            size="small"
                            onClick={() => setOpen(!open)}
                        >
                            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                    </StyledTableCell>
                )}
                {data.cells.map((cell:any) => {
                    return (
                        !cell.column.collapsable ? (
                            <StyledTableCell align="center" {...cell.getCellProps()}>
                                {cell.column.Cell ? formatCellValue(cell.column, cell) : cell.render("Cell")}
                            </StyledTableCell>
                        ) : null
                    )
                })}
            </StyledTableRow>

            {type === 'recommended-portfolio' && (
                <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                        <Collapse
                            in={open}
                            timeout={0}
                            unmountOnExit
                        >
                            <Box sx={{ margin: '20px 0 50px' }}>
                                <MoreInfoTitle variant="h6" gutterBottom>
                                    Risk Management
                                </MoreInfoTitle>
                                <Paragraph>
                                    The data below helps you create a triple barrier risk management strategy.
                                </Paragraph>

                                <Table size="small" aria-label="purchases">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell align="center">Take Profit</TableCell>
                                            <TableCell align="center">Stop Loss</TableCell>
                                            <TableCell align="center">Hold Duration</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        <TableRow>
                                            {data.cells.map((cell:any) => (
                                                cell.column.collapsable ? (
                                                    <TableCell align="center" {...cell.getCellProps()}>
                                                        {cell.column.Cell ? formatCellValue(cell.column, cell) : cell.render("Cell")}
                                                    </TableCell>
                                                ) : null
                                            ))}
                                        </TableRow>
                                    </TableBody>
                                </Table>

                                <MoreInfoTitle variant="h6" gutterBottom>
                                    Overmind's Activated Pattern
                                </MoreInfoTitle>
                                <Paragraph>
                                    The plot below presents a simplified representation of the pattern recognized by Overmind under current market conditions. The proximity of the white dots to the blue dashed line indicates a better match. If most of the white dots fall outside the blue area, it suggests that Overmind has not encountered a similar market condition in the past.
                                </Paragraph>

                                <Box sx={{ width: '50%', textAlign: 'center', margin: 'auto' }}>
                                    <Chart options={patternOptions}
                                           type='rangeArea'
                                           series={patternSeries}
                                    />
                                </Box>

                                <MoreInfoTitle variant="h6" gutterBottom>
                                    Simulations
                                </MoreInfoTitle>
                                <Paragraph>
                                    Check how the prediction model would have performed for in the past.
                                </Paragraph>

                                <CustomButton variant="contained" onClick={() => {
                                    simulatedTradesHandler(instrument)
                                        .then((data:any) => {
                                            setSimulatedTradesData(data)
                                            setShowSimulatedTrades(true)
                                        })

                                }}>
                                    View Trades
                                </CustomButton>

                                {showSimulatedTrades && (
                                    <Modal open={showSimulatedTrades}
                                           onClose={handleModalClose}
                                           disableEnforceFocus
                                           aria-describedby="modal-modal-description">
                                        <Box sx={{ ...boxStyle }}>
                                            <ChartContainer elevation={4}>
                                                <CandlestickChart
                                                    simulatedTradesData={simulatedTradesData}
                                                    id="modal-modal-description">
                                                </CandlestickChart>
                                            </ChartContainer>
                                        </Box>

                                    </Modal>
                                )}

                                {showAccumulatedRevenue && (
                                    <Modal open={showAccumulatedRevenue}
                                           onClose={handleModalClose}
                                           disableEnforceFocus
                                           aria-describedby="modal-modal-description">
                                        <Box sx={{ ...boxStyle }}>
                                            <ChartContainer elevation={4}>
                                                <RevenueChart
                                                    accumulatedRevenueData={accumulatedRevenueData}
                                                    instrument={instrument}
                                                    id="modal-modal-description">
                                                </RevenueChart>
                                            </ChartContainer>
                                        </Box>

                                    </Modal>
                                )}

                                <Title variant="h6"></Title>

                                <Paragraph>
                                    Check the accumulated revenue that the prediction model would have achieved in past trades.
                                </Paragraph>

                                <CustomButton variant="contained" onClick={() => {
                                    accumulatedRevenueHandler(instrument)
                                        .then((data) => {
                                            setAccumulatedRevenueData(data)
                                            setShowAccumulatedRevenue(true)
                                        })

                                }}>
                                    View Accumulated Revenue
                                </CustomButton>
                                <Title variant="h6"></Title>

                            </Box>
                        </Collapse>
                    </TableCell>
                </TableRow>
            )}

        </React.Fragment>
    )
}

export default function Portfolio({ data, type, actions, alerts, dataHandler, validatedPortfolio, simulatedTradesHandler, accumulatedRevenueHandler, handleReallocationOptions, latestPatternHandler }) {
    const {columns, title} = getTableMetadata(type)

    const [training, setTraining] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [validating, setValidating] = useState(false);
    const [convertingBnb, setConvertingBnb] = useState(false);
    const [convertingUsdt, setConvertingUsdt] = useState(false);
    const [executing, setExecuting] = useState(false);

    const [trainBtnMsg, setTrainBtnMsg] = useState("Improve Portfolio with AI");
    const [resetBtnMsg, setResetBtnMsg] = useState("Reset Portfolio");
    const [validatingBtnMsg, setValidatingBtnMsg] = useState("Validate Orders");
    /* const [convertingBnbBtnMsg, setConvertingBnbBtnMsg] = useState("Converting to BNB");
     * const [convertingUsdtBtnMsg, setConvertingUsdtBtnMsg] = useState("Converting to USDT"); */
    const [executingBtnMsg, setExecutingBtnMsg] = useState("Execute Orders");

    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [showAlert, setShowAlert] = useState(false);

    const [alertAction, setAlertAction] = useState(null);
    const [alertRows, setAlertRows] = useState(null);

    const [iterations, setIterations] = useState(1);
    const [maxTradeHorizon, setMaxTradeHorizon] = useState(224);
    const [tpPercentage, setTpPercentage] = useState(100);
    const [slPercentage, setSlPercentage] = useState(100);

    const [refresh, setRefresh] = useState(false)

    const [reallocateOnlyExpired, setReallocateOnlyExpired] = useState(true)
    const [reallocateAmongAll, setReallocateAmongAll] = useState(true)
    const onlyExpiredMsg = 'Reallocate only the assets that reached their take profit, stop loss or hold duration'
    const amongAllMsg = 'Reallocate among all recommended portfolio assets'
    const convertToBnbMsg = 'Convert Small Balances to BNB'
    const convertToUsdtMsg = 'Convert Everything to USDT'
    const [reallocateOnlyExpiredMsg, setReallocateOnlyExpiredMsg] = useState(onlyExpiredMsg)
    const [reallocateAmongAllMsg, setReallocateAmongAllMsg] = useState(amongAllMsg)

    const handleAlertClose = async () => {
        try {
            setAlertTitle('')
            setAlertMessage('')
            setShowAlert(false)
        } catch (error) {
            console.log(error)
        }
    }

    const removeRowAction = (idx:number) => {
        const newData = [...data]
        const assetName = data[idx].instrument
        newData.splice(idx, 1)
        dataHandler(newData, assetName)
    }

    const handleIterationsSliderChange = (_: Event, newValue: number | number[]) => {
        setIterations(newValue as number);
    };

    const handleMaxTradeHorizonSliderChange = (_: Event, newValue: number | number[]) => {
        // const finalVal: number = Math.floor(newValue * 60 / 45)
        setMaxTradeHorizon(newValue as number);
    };

    useEffect(() => {
        const populateAlertRows = () => {
            if (type !== 'to-execute-portfolio')
                return
            let newAlertRows = {};
            for (const idx in alerts) {
                const alert = alerts[idx];
                if (alert == undefined) continue;
                const alertFrom = alert.fromAsset;
                const alertTo = alert.toAsset;
                const alertAmount = alert.fromAmount;

                for (const dataIdx in data) {
                    const row = data[dataIdx];
                    const rowFrom = row.from.slice(0, -3).toUpperCase();
                    const rowTo = row.to.slice(0, -3).toUpperCase();
                    const rowAmount = row.amount;
                    const alertRowKey = `${alertFrom}${alertTo}${alertAmount}`;

                    if (alertFrom == rowFrom && alertTo == rowTo && alertAmount == rowAmount)
                        newAlertRows[alertRowKey] = () => {
                            setAlertTitle('Asset amount range error');
                            let msg = `${alert.fromAsset} amount must be between ${alert.quoteRange[0]} and ${alert.quoteRange[1]}. Do you want to convert your ${alert.fromAsset} to BNB?`
                            let action = () => () => {
                                const newData = [...data];
                                newData[dataIdx].to = "bnbusd"
                                dataHandler(newData)
                            }
                            if (alert.fromAsset = 'BNB') {
                                msg = `${alert.fromAsset} amount must be between ${alert.quoteRange[0]} and ${alert.quoteRange[1]}. Do you want to remove this order?`
                                action = () => () => {
                                    const idx = parseInt(dataIdx)
                                    removeRowAction(idx)
                                }
                            }
                            setAlertMessage(msg);
                            setShowAlert(true);
                            setAlertAction(action);
                        };
                }
            }
            if (Object.keys(newAlertRows).length > 0)
                setAlertRows(newAlertRows);
        };
        populateAlertRows();
    }, [alerts]);

    const handleReallocateOnlyExpired = (event: React.ChangeEvent<HTMLInputElement>) => {
        setReallocateOnlyExpired(event.target.checked)
        if (event.target.checked)
            setReallocateOnlyExpiredMsg(onlyExpiredMsg)
        else
            setReallocateOnlyExpiredMsg('Reallocate all the assets in your current portfolio')
        handleReallocationOptions({reallocateOnlyExpired: event.target.checked, reallocateAmongAll})
    };

    const handleReallocateAmongAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        setReallocateAmongAll(event.target.checked)
        if (event.target.checked)
            setReallocateAmongAllMsg(amongAllMsg)
        else
            setReallocateAmongAllMsg('Reallocate by giving priority to the assets with highest allocation percentage')
        handleReallocationOptions({reallocateOnlyExpired, reallocateAmongAll: event.target.checked})
    };

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({ columns, data });

    return (
        <React.Fragment>
            <FormContainer>
                {showAlert && (
                    <Alert title={alertTitle} message={alertMessage} action={alertAction} closeAction={handleAlertClose} />
                )}
                <Title variant="h4">{title}</Title>
                {type === 'earnings-report' && (
                    <Earnings />
                )}
                {type === 'current-portfolio' &&
                 actions.hasOwnProperty('convertToBnb') && (
                     <React.Fragment>
                         <Paragraph>The table below shows all of your currently held assets and their allocations.</Paragraph>
                         <Title variant="h6">Convert small assets to BNB</Title>
                         <Paragraph>Binance does not allow you to convert small balances of assets to other symbols, with the exception of BNB. You can convert all of your small balances first, so you can later convert your BNB to other symbols.</Paragraph>
                         <CustomButton variant="contained" disabled={convertingBnb} onClick={() => {
                             setConvertingBnb(true)
                             // setConvertingBnbBtnMsg("Converting to BNB...")
                             actions.convertToBnb().then(() => {
                                 // setConvertingBnbBtnMsg(convertToBnbMsg)
                                 setConvertingBnb(false)
                             })
                         }}>
                             {convertToBnbMsg}
                         </CustomButton>

                         <Title variant="h6">Convert everything to USDT</Title>
                         <Paragraph>In case you want to convert everything back to USDT, you can do so by pressing the button below.</Paragraph>
                         <CustomButton variant="contained" disabled={convertingUsdt} onClick={() => {
                             setConvertingUsdt(true)
                             // setConvertingUsdtBtnMsg("Converting to USDT...")
                             actions.convertToUsdt().then(() => {
                                 // setConvertingUsdtBtnMsg(convertToUsdtMsg)
                                 setConvertingUsdt(false)
                             })
                         }}>
                             {convertToUsdtMsg}
                         </CustomButton>


                         <Title variant="h6"></Title>
                     </React.Fragment>
                )}
                {type === 'recommended-portfolio' &&
                 actions.hasOwnProperty('improvePortfolio') &&
                 actions.hasOwnProperty('resetPortfolio') && (
                     <React.Fragment>
                         <Title variant="h6">Improve Portfolio</Title>
                         <Paragraph>You can optimize the recommended portfolio by Overmind until it fits your needs. Use the slider to set the desired number of iterations for the optimization process. Keep in mind that a higher number of iterations generally leads to better results, although it might also result in a slower processing time.</Paragraph>
                         <Grid container spacing={1} alignItems="stretch">
                             <Grid item sx={{ width: '30%' }}>
                                 <Box sx={{ width: '100%', textAlign: 'left' }}>
                                     <CustomButton variant="contained" disabled={training} onClick={() => {
                                         setTraining(true)
                                         setTrainBtnMsg("Improving...")
                                         actions.improvePortfolio(iterations, maxTradeHorizon, tpPercentage, slPercentage).then(() => {
                                             setTrainBtnMsg("Improve Portfolio with AI")
                                             setTraining(false)
                                         })
                                     }}>
                                         {trainBtnMsg}
                                     </CustomButton>
                                 </Box>
                             </Grid>
                             <Grid item sx={{ width: '70%', margin: 'auto' }}>
                                 <Box sx={{ width: '90%', textAlign: 'center' }}>
                                     <Typography id="take-profit-input" gutterBottom>
                                         Iterations
                                     </Typography>
                                     <Slider
                                         value={typeof iterations === 'number' ? iterations : 1}
                                         onChange={handleIterationsSliderChange}
                                         aria-labelledby="iterations-slider"
                                         valueLabelDisplay="auto"
                                         marks={[{value: 1, label: '1 iteration'},
                                                 {value: 50, label: '50 iterations'},
                                                 {value: 100, label: '100 iterations'}]}
                                         step={1}
                                         min={1}
                                         max={100}
                                     />
                                     <Typography id="take-profit-input" gutterBottom>
                                         Max Trade Horizon
                                     </Typography>
                                     <Slider
                                         value={typeof maxTradeHorizon === 'number' ? maxTradeHorizon : 224}
                                         onChange={handleMaxTradeHorizonSliderChange}
                                         aria-labelledby="horizon-slider"
                                         valueLabelDisplay="off"
                                         marks={[{value: 4, label: '3h'},
                                                 {value: 16, label: '12h'},
                                                 {value: 32, label: '1d'},
                                                 {value: 64, label: '2d'},
                                                 {value: 96, label: '3d'},
                                                 {value: 128, label: '4d'},
                                                 {value: 160, label: '5d'},
                                                 {value: 192, label: '6d'},
                                                 {value: 224, label: '7d'},
                                                 {value: 256, label: '8d'},
                                                 {value: 288, label: '9d'},
                                         ]}
                                         min={4}
                                         max={288}
                                         step={null}
                                     />
                                 </Box>
                                 <Box sx={{ width: '90%', textAlign: 'center', marginTop: 5 }}>

                                     <PrimeReactProvider>
                                         <Grid container spacing={1} alignItems="left">
                                             <Grid item sx={{ width: '45%', margin: 'auto' }}>
                                                 <Typography id="take-profit-input" gutterBottom>
                                                     Take Profit
                                                 </Typography>
                                                 <InputNumber value={tpPercentage}
                                                              onValueChange={(e) => setTpPercentage(e.value)}
                                                              suffix="%"
                                                              showButtons
                                                              buttonLayout="horizontal" step={10}
                                                              decrementButtonClassName="p-button-secondary"
                                                              incrementButtonClassName="p-button-secondary"
                                                              incrementButtonIcon="pi pi-plus"
                                                              decrementButtonIcon="pi pi-minus"
                                                              min={10}
                                                              max={100}
                                                              inputClassName="centered-input"
                                                              mode="decimal" />
                                             </Grid>
                                             <Grid item sx={{ width: '45%', margin: 'auto' }}>
                                                 <Typography id="stop-loss-input" gutterBottom>
                                                     Stop Loss
                                                 </Typography>
                                                 <InputNumber value={slPercentage}
                                                              onValueChange={(e) => setSlPercentage(e.value)}
                                                              suffix="%"
                                                              showButtons
                                                              buttonLayout="horizontal" step={10}
                                                              decrementButtonClassName="p-button-secondary"
                                                              incrementButtonClassName="p-button-secondary"
                                                              incrementButtonIcon="pi pi-plus"
                                                              decrementButtonIcon="pi pi-minus"
                                                              min={10}
                                                              max={100}
                                                              inputClassName="centered-input"
                                                              mode="decimal" />
                                             </Grid>
                                         </Grid>
                                     </PrimeReactProvider>

                                 </Box>
                             </Grid>
                         </Grid>
                         <Title variant="h6">Reset Portfolio</Title>
                         <Paragraph>Sometimes it's a good idea to wipe out your prediction systems, as they can get overfit or stuck in local minima. If you don't like your portfolio results, try resetting your portfolios and improve them again!</Paragraph>
                         <CustomButton variant="contained" disabled={resetting} onClick={() => {
                             setResetting(true)
                             setResetBtnMsg("Resetting...")
                             actions.resetPortfolio().then(() => {
                                 setResetBtnMsg("Reset Portfolio")
                                 setResetting(false)
                             })
                         }}>
                             {resetBtnMsg}
                         </CustomButton>
                         <Title variant="h6"></Title>
                     </React.Fragment>
                )}
                {type === 'to-execute-portfolio' &&
                 actions.hasOwnProperty('validateOrders') &&
                 actions.hasOwnProperty('executeOrders') &&
                 (
                     <React.Fragment>
                         <Title variant="h6">Reallocation Settings</Title>
                         <Paragraph>You can set what assets you want to reallocate and how you want to reallocate them.</Paragraph>
                         <FormGroup>
                             <FormControlLabel control={<Switch checked={reallocateOnlyExpired}
                                                                onChange={handleReallocateOnlyExpired}
                             />}
                                               label={reallocateOnlyExpiredMsg} />
                             <FormControlLabel control={<Switch checked={reallocateAmongAll}
                                                                onChange={handleReallocateAmongAll}
                             />}
                                               label={reallocateAmongAllMsg} />
                         </FormGroup>
                         <Title variant="h6">Validation</Title>
                         <Paragraph>First you need to check if the assets and amounts are valid for the orders that you want to execute. If there are errors with your orders, click on their status for more information on how to solve the problem.</Paragraph>
                         <CustomButton variant="contained" disabled={validating || validatedPortfolio} onClick={() => {
                             setValidating(true)
                             setValidatingBtnMsg("Validating Orders...")
                             actions.validateOrders().then(() => {
                                 setValidatingBtnMsg("Validate Orders")
                                 setValidating(false)
                             })
                         }}>
                             {validatingBtnMsg}
                         </CustomButton>
                         <Title variant="h6">Execute Orders</Title>
                         <Paragraph>After making sure that all the orders are valid, then you can execute all the orders to update your portfolio to match the one recommended by Overmind.</Paragraph>
                         {(executing || !validatedPortfolio) ? (
                             <Tooltip title="Validate orders first" placement="right-end">
                                 <span>
                                     <CustomButton variant="contained" disabled={true}>
                                         {executingBtnMsg}
                                     </CustomButton>
                                 </span>
                             </Tooltip>
                         ) : (
                             <CustomButton variant="contained" disabled={executing || !validatedPortfolio} onClick={() => {
                                 setExecuting(true)
                                 setExecutingBtnMsg("Executing Orders...")
                                 actions.executeOrders().then(() => {
                                     setExecutingBtnMsg("Execute Orders")
                                     setExecuting(false)
                                 })
                             }}>
                                 {executingBtnMsg}
                             </CustomButton>
                         )}
                         <Title variant="h6"></Title>
                     </React.Fragment>
                )}
                {type !== 'earnings-report' && (
                    <TableContainer component={Paper}>
                        {type == 'portfolio-report' && (
                            <CustomButton variant="contained"onClick={() => setRefresh(!refresh)}>
                                Refresh
                            </CustomButton>
                        )}
                        <Table {...getTableProps()} aria-label="collapsible table">
                            <TableHead>
                                {headerGroups.map((headerGroup:any) => (
                                    <StyledTableRow {...headerGroup.getHeaderGroupProps()}>
                                        {type === 'recommended-portfolio' && (
                                            <StyledTableCell>
                                                More Info
                                            </StyledTableCell>
                                        )}
                                        {headerGroup.headers.map((column:any) => (
                                            !column.collapsable ? (
                                                <StyledTableCell align="center" {...column.getHeaderProps()}>
                                                    {column.render("Header")}
                                                </StyledTableCell>
                                            ) : null
                                        ))}
                                    </StyledTableRow>
                                ))}
                            </TableHead>
                            <TableBody {...getTableBodyProps()}>
                                {rows.map((row:any) => {
                                    prepareRow(row);
                                    return (
                                        <Row data={row}
                                             key={row.id}
                                             type={type}
                                             alertRows={alertRows}
                                             removeRowAction={removeRowAction}
                                             simulatedTradesHandler={simulatedTradesHandler}
                                             accumulatedRevenueHandler={accumulatedRevenueHandler}
                                             latestPatternHandler={latestPatternHandler}
                                        />
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </FormContainer>
        </React.Fragment>
    );
}
