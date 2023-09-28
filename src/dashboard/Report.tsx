import { useState, useEffect, Fragment } from 'react'
import { useTable } from "react-table";

import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { getReports, fetchAssetPrices } from '../dataHelpers'

const earningsColumns = [
    { Header: "Asset", accessor: "instrument", format: "asset"},
    { Header: "Allocation (%)", accessor: "allocation", format: "percentage" },
]

const reportColumns = [
    { Header: "Asset", accessor: "asset"},
    { Header: "Unrealized PnL", accessor: "upnl", format: "usdt"},
    { Header: "Distance to Take Profit", accessor: "tpDistance", format: "usdt"},
    { Header: "Distance to Stop Loss", accessor: "slDistance", format: "usdt"},
    { Header: "Time Remaining", accessor: "timeRemaining", format: "seconds"},
    { Header: "Reallocate?", accessor: "expired", format: "boolean"},
]

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

const Title = styled(Typography)(({ theme }) => ({
    marginBottom: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingBottom: theme.spacing(1),
}));

const getTableMetadata = (type:string ) => {
    let columns = []
    let title = ''
    if (type == 'earnings-report') {
        columns = earningsColumns
        title = 'Earnings Report'
    }
    if (type == 'portfolio-report') {
        columns = reportColumns
        title = 'Risk Management'
    }
    return { columns, title }
}

const formatPercentage = (cellValue) => {
    return `${parseFloat(cellValue).toFixed(2)}%`;
};

const formatTwoDecimals = (cellValue) => {
    return parseFloat(cellValue).toFixed(2);
};

const formatUSDT = (cellValue) => {
    return `$${parseFloat(cellValue).toFixed(4)} USDT`;
};

const formatBoolean = (cellValue) => {
    return cellValue ? 'Yes' : 'No';
};

function formatSeconds(seconds) {
    seconds = seconds / 1000
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    // Create a formatted string
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;

    return formattedTime;
}

const formatAsset = (cellValue) => {
    if (cellValue.length > 5)
        return cellValue.slice(0, -3).toUpperCase();
    return cellValue
};

function Row(props) {

    const formatCellValue = (column, cell) => {
        if (column.format === "percentage") {
            return formatPercentage(cell.value);
        } else if (column.format === "twoDecimals") {
            return formatTwoDecimals(cell.value);
        } else if (column.format === "asset") {
            return formatAsset(cell.value);
        } else if (column.format === "boolean") {
            return formatBoolean(cell.value);
        } else if (column.format === "seconds") {
            return formatSeconds(cell.value);
        } else if (column.format === "usdt") {
            return formatUSDT(cell.value);
        }
        else {
            return cell.value;
        }
    };

    return (
        <Fragment>
            <StyledTableRow {...props.data.getRowProps()}>
                {props.data.cells.map((cell) => {
                    return (
                        <StyledTableCell align="center" {...cell.getCellProps()}>
                            {cell.column.Cell ? formatCellValue(cell.column, cell) : cell.render("Cell")}
                        </StyledTableCell>
                    )
                })}
            </StyledTableRow>
        </Fragment>
    )
}

export default function Report(props) {
    const [tableData, setTableData] = useState([]);
    const [reportsData, setReportsData] = useState([]);
    const {columns, title} = getTableMetadata(props.type)
    const [tableReady, setTableReady] = useState(false)
    const [refresh, setRefresh] = useState(false)

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({ columns, data: tableData });

    useEffect(() => {
        getReports(1).then((rows) => {
            const data = JSON.parse(rows[0].report) // We always get 1.

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
            for (const transaction of data.ordersToExecute) {
                const from = transaction.from.slice(0, -3).toUpperCase()
                const to = transaction.to.slice(0, -3).toUpperCase()
                // const symbol = `${from}${to}`
                const report = {
                    from,
                    to,
                    // symbol,
                    startingPrice: data.startingPrices[`${to}USDT`],
                    amount: transaction.amount,
                    takeProfit: transaction.takeProfit,
                    stopLoss: transaction.stopLoss,
                    horizon: transaction.horizon,
                    /* timeRemaining: (data.timestamp + transaction.horizon * 1000) - new Date().getTime(),
                     * expired: (data.timestamp + transaction.horizon * 1000) < new Date().getTime() */
                }
                // _reports.symbols.push(symbol)
                _reports.symbols.push(`${to}USDT`)
                _reports.transactions.push(report)
            }
            setReportsData(_reports)
        })
    }, [])

    useEffect(() => {
        if (!reportsData.hasOwnProperty('symbols'))
            return

        const symbols = [...new Set(reportsData.symbols)]
        fetchAssetPrices(symbols).then((prices) => {
            const _tableData = {}
            for (const transaction of reportsData.transactions) {
                const symbol = `${transaction.to}USDT`
                const startPrice = parseFloat(transaction.startingPrice)
                const tp = transaction.takeProfit
                const sl = transaction.stopLoss
                const price = parseFloat(prices[symbol])
                const priceDiff = price - startPrice
                const toAmount = reportsData.toAmounts[transaction.to]
                const tpDistance = Math.abs(price - (startPrice + tp)) * toAmount
                const slDistance = Math.abs(price - (startPrice + sl)) * toAmount
                const upnl = (tp > 0 ? priceDiff : priceDiff * -1) * toAmount
                const timeRemaining = (reportsData.timestamp + transaction.horizon * 1000) - new Date().getTime()
                const expired = (reportsData.timestamp + transaction.horizon * 1000) < new Date().getTime()

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
            console.log({totalUnPnL}, reportsData.usdtValueAfter)
            setTableData(Object.values(_tableData))
            setTableReady(true)
        })
    }, [reportsData, refresh])

    return (
        <Fragment>
            <Title variant="h4">{title}</Title>
            <Button onClick={() => setRefresh(!refresh)}>Refresh</Button>
            {tableReady && (
                <TableContainer component={Paper}>
                    <Table {...getTableProps()} aria-label="collapsible table">
                        <TableHead>
                            {headerGroups.map((headerGroup) => (
                                <StyledTableRow {...headerGroup.getHeaderGroupProps()}>
                                    {props.type === 'recommended-portfolio' && (
                                        <StyledTableCell>
                                            More Info
                                        </StyledTableCell>
                                    )}
                                    {headerGroup.headers.map((column) => (
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
                            {rows.map((row, index) => {
                                prepareRow(row);
                                return (
                                    <Row data={row}
                                         key={row.id}
                                         timestamp={reportsData.timestamp}
                                    />
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Fragment>
    )
}
