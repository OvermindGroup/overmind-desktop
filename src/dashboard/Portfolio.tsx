import * as React from 'react';
import { useTable } from "react-table";
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Title from './Title';
import { styled } from '@mui/material/styles';

const recommendedPortfolioColumns = [
  { Header: "Asset", accessor: "instrument", format: "asset"},
  { Header: "Allocation (%)", accessor: "allocation", format: "percentage" },
  { Header: "Take Profit", accessor: "takeProfit" },
  { Header: "Stop Loss", accessor: "stopLoss" },
  { Header: "Hold Duration", accessor: "horizonFormatted" },
  { Header: "Risk Reward", accessor: "riskReward", format: "twoDecimals" }
];

const currentPortfolioColumns = [
  { Header: "Asset", accessor: "asset" },
  { Header: "Free", accessor: "free" },
  { Header: "Allocation (%)", accessor: "allocation", format: "percentage"},
  { Header: "BTC Valuation", accessor: "btcValuation" },
];

const executePortfolioColumns = [
  { Header: "From", accessor: "from" },
  { Header: "To", accessor: "to" },
  { Header: "Amount", accessor: "amount" },
];

const formatPercentage = (cellValue) => {
  return `${parseFloat(cellValue).toFixed(2)}%`;
};

const formatTwoDecimals = (cellValue) => {
  return parseFloat(cellValue).toFixed(2);
};

export const formatAsset = (cellValue) => {
  if (cellValue.length > 5)
    return cellValue.slice(0, -3).toUpperCase();
  return cellValue
};

const getTableMetadata = (type:string ) => {
  let columns = []
  let title = ''
  if (type == 'recommended-portfolio') {
    columns = recommendedPortfolioColumns
    title = 'Recommended Portfolio'
  }
  if (type == 'current-portfolio') {
    columns = currentPortfolioColumns
    title = 'Current Portfolio'
  }
  if (type == 'execute-portfolio') {
    columns = executePortfolioColumns
    title = 'Execute Portfolio'
  }
  return { columns, title }
}

export default function Portfolio({ data, type }) {

  const {columns, title} = getTableMetadata(type)

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data });

  const formatCellValue = (column, cell) => {
    if (column.format === "percentage") {
      return formatPercentage(cell.value);
    } else if (column.format === "twoDecimals") {
      return formatTwoDecimals(cell.value);
    } else if (column.format === "asset") {
      return formatAsset(cell.value);
    }
    else {
      return cell.value;
    }
  };

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

  return (
    <React.Fragment>
      <Title>{title}</Title>
      <Table {...getTableProps()}>
        <TableHead>
          {headerGroups.map((headerGroup) => (
            <StyledTableRow {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <StyledTableCell align="center" {...column.getHeaderProps()}>{column.render("Header")}</StyledTableCell>
              ))}
            </StyledTableRow>
          ))}
        </TableHead>
        <TableBody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row);
            return (
              <StyledTableRow {...row.getRowProps()}>
                {row.cells.map((cell) => (
                  <StyledTableCell align="center" {...cell.getCellProps()}>
                    {cell.column.Cell ? formatCellValue(cell.column, cell) : cell.render("Cell")}
                  </StyledTableCell>
                ))}
              </StyledTableRow>
            );
          })}
        </TableBody>
      </Table>
    </React.Fragment>
  );
}
