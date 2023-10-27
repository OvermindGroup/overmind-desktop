import { useState, useEffect, Fragment } from 'react'
import Box from '@mui/material/Box'
import Chart from 'react-apexcharts'

function formatTimestamp(timestamp:number) {
    const date = new Date(timestamp);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    return formattedTime;
}

const RevenueChart = (props:any) => {
    const [series, setSeries] = useState([]);
    const [options, setOptions] = useState({});

    useEffect(() => {
        const data = props.accumulatedRevenueData

        const blueColor = '#29b6f6'
        const redColor = '#f44336'
        const lineColor = data[data.length-1] < 0.0 ? blueColor : redColor

        const accumulatedRevenueSeries = {
            name: 'Accumulated Revenue',
            type: 'line',
            color: lineColor,
            data: []
        }
        let yMin = 0.0
        let yMax = 0.0
        for (const point of data) {
            if (point[1] < yMin)
                yMin = point[1]
            if (point[1] > yMax)
                yMax = point[1]
            accumulatedRevenueSeries.data.push({x: new Date(point[0]).getTime(), y: point[1]})
        }

        setSeries([accumulatedRevenueSeries])
        setOptions({
            chart: {
                type: 'line',
                animations: {
                    enabled: false
                },
                dropShadow: {
                    enabled: false
                }
            },
            title: {
                text: `${props.instrument.slice(0, -3).toUpperCase()} Accumulated Revenue`,
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
            legend: {
                show: false
            },
            stroke: {
                width: 2,
                curve: 'straight'
            },
            xaxis: {
                type: 'datetime',
                labels: {
                    rotate: -10,
                    formatter: (value:any) => {
                        if (value !== undefined)
                            return formatTimestamp(value)
                    }
                },
                axisBorder: {
                    show: false
                },
                axisTicks: {
                    show: true,
                    height: 2,
                    offsetY: 2
                }
            },
            yaxis: {
                tooltip: {
                    enabled: true
                },
                min: yMin,
                max: yMax
            },
            annotations: {
                yaxis: [{
                    y: 0,
                    width: '100%',
                    borderColor: '#fff'
                }]
            }
        })
    }, [props.accumulatedRevenueData, props.instrument]);

    return (
        <Fragment>
            <Box sx={{ width: '100%', textAlign: 'center', margin: 'auto' }}>
                <Chart options={options}
                       type='line'
                       series={series}
                />
            </Box>
        </Fragment>
    );
};

export default RevenueChart;
