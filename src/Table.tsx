import React from "react";
import { useTable } from "react-table";

// Custom formatting functions
export const formatPercentage = (cellValue) => {
    // Format the cell value
    return `${parseFloat(cellValue).toFixed(2)}%`;
};

export const formatTwoDecimals = (cellValue) => {
    // Format the cell value
    return parseFloat(cellValue).toFixed(2);
};

export const bullishPortfolioColumns = [
    { Header: "Asset", accessor: "instrument" },
    { Header: "Allocation (%)", accessor: "allocation", format: "percentage" },
    { Header: "Take Profit", accessor: "takeProfit" },
    { Header: "Stop Loss", accessor: "stopLoss" },
    { Header: "Hold Duration", accessor: "horizonFormatted" },
    { Header: "Risk Reward", accessor: "riskReward", format: "twoDecimals" }
];

export const currentPortfolioColumns = [
    { Header: "Asset", accessor: "asset" },
    { Header: "Free", accessor: "free" },
    { Header: "Allocation (%)", accessor: "allocation", format: "percentage"},
    { Header: "BTC Valuation", accessor: "btcValuation" },
];

export const ordersToExecuteColumns = [
    { Header: "From", accessor: "from" },
    { Header: "To", accessor: "to" },
    { Header: "Amount", accessor: "amount" },
];

export function Table({ data, columns }) {
    const formatPercentage = (value) => {
        // Format the value with 2 decimals and add a percentage sign
        return `${parseFloat(value).toFixed(2)}%`;
    };

    const formatTwoDecimals = (value) => {
        // Format the value with 2 decimals
        return parseFloat(value).toFixed(2);
    };

    const getColumnCell = (column) => (cell) => {
        if (column.format === "percentage") {
            return formatPercentage(cell.value);
        } else if (column.format === "twoDecimals") {
            return formatTwoDecimals(cell.value);
        } else {
            // Return the cell content as it is (text column)
            return cell.value;
        }
    };

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({ columns, data });

    return (
        <table {...getTableProps()} className="table">
            <thead>
                {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map((column) => (
                            <th {...column.getHeaderProps()}>{column.render("Header")}</th>
                        ))}
                    </tr>
                ))}
            </thead>
            <tbody {...getTableBodyProps()}>
                {rows.map((row) => {
                    prepareRow(row);
                    return (
                        <tr {...row.getRowProps()}>
                            {row.cells.map((cell) => (
                                <td {...cell.getCellProps()}>
                                    {cell.column.Cell ? getColumnCell(cell.column)(cell) : cell.render("Cell")}
                                </td>
                            ))}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
