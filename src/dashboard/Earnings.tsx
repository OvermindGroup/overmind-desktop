import { useState, useEffect, Fragment } from 'react'
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button'
import Slider from '@mui/material/Slider'
import Chart from 'react-apexcharts'
import { getValuations, getReports } from '../dataHelpers'

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

const CustomButton = styled(Button)(({ theme }) => ({
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
}));

const Earnings = () => {
    const [series, setSeries] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const [options, setOptions] = useState({});
    const [timewindow, setTimewindow] = useState(168);

    const handleTimewindowSliderChange = (_: Event, newValue: number | number[]) => {
        setTimewindow(newValue as number);
    };

    function groupAndAggregateData(data:any, timeframeMinutes:any) {
        const groupedData = {};

        for (const item of data) {
            const groupTimestamp = Math.floor(item.timestamp / (timeframeMinutes * 60 * 1000)) * (timeframeMinutes * 60 * 1000);

            if (!groupedData[groupTimestamp]) {
                groupedData[groupTimestamp] = {
                    open: item.price,
                    high: item.price,
                    low: item.price,
                    close: item.price,
                    x: groupTimestamp,
                };
            } else {
                if (item.price > groupedData[groupTimestamp].high) {
                    groupedData[groupTimestamp].high = item.price;
                }
                if (item.price < groupedData[groupTimestamp].low) {
                    groupedData[groupTimestamp].low = item.price;
                }
                groupedData[groupTimestamp].open = item.price;
            }
        }

        const result = Object.values(groupedData).map(({ x, open, high, low, close }) => ({
            x,
            y: [open, high, low, close],
        }));

        return result;
    }

    useEffect(() => {
        const timeframeMinutes = 60
        // const valuationsCount = timeframeMinutes * 48
        // const valuationsCount = timeframeMinutes * 168
        // const valuationsCount = timeframeMinutes * 700
        const valuationsCount = timeframeMinutes * timewindow
        getReports(valuationsCount).then((reports:any) => {
            const reportTimestamps:any = []
            for (const report of reports) {
                reportTimestamps.push({
                    x: report.id,
                    label: {
                        text: 'Portfolio Update',
                        orientation: 'vertical',
                        position: 'right',
                        borderWidth: 1,
                        style: {
                            color: '#fff',
                            fontSize: 12,
                            fontFamily: 'courier new',
                            cssClass: 'outlined',
                            padding: {
                                right: 0,
                                left: 0,
                                top: -100,
                                bottom: 0
                            }
                        }
                    }
                })
            }

            getValuations(valuationsCount).then((valuations:any) => {
                const data = []
                const prices = []
                for (const valuation of valuations) {
                    const priceUnparsed = JSON.parse(valuation.valuation).usdtValue
                    const price = parseFloat(priceUnparsed)
                    if (price == 0 || priceUnparsed == null)
                        continue
                    prices.push(price)
                    data.push({timestamp: valuation.id, price })
                }
                const yMin = Math.min(...prices)
                const yMax = Math.max(...prices)
                const earningsData = groupAndAggregateData(data, timeframeMinutes)

                const earningsSeriesData = {
                    name: 'Profit & Loss Chart',
                    type: 'candlestick',
                    data: earningsData
                }
                setSeries([earningsSeriesData])

                const opts = {
                    chart: {
                        type: 'candlestick',
                        animations: {
                            enabled: false
                        },
                        dropShadow: {
                            enabled: false
                        }
                    },
                    title: {
                        text: `Profit & Loss`,
                        align: 'center',
                        offsetY: 10
                    },
                    annotations: {
                        xaxis: reportTimestamps
                    },
                    plotOptions: {
                        candlestick: {
                            colors: {
                                upward: '#29b6f6',
                                downward: '#f44336'
                            },
                            wick: {
                                useFillColor: true,
                            }
                        }
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
                        width: 0.5,
                        curve: 'straight',
                        lineCap: 'butt',
                        dashArray: 0
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
                        decimalsInFloat: 2,
                        tooltip: {
                            enabled: true
                        },
                        min: yMin,
                        max: yMax
                    }
                }
                setOptions(opts)
            })
        })
        setRefresh(false)
    }, [timewindow, refresh]);

    return (
        <Fragment>
            <Slider
                value={typeof timewindow === 'number' ? timewindow : 168}
                onChange={handleTimewindowSliderChange}
                aria-labelledby="timewindow-slider"
                valueLabelDisplay="auto"
                marks={[{value: 24, label: '24 hours'},
                        {value: 168, label: '168 hours (1 week)'},
                        {value: 252, label: '|'},
                        {value: 336, label: '336 hours (2 weeks)'},
                        {value: 420, label: '|'},
                        {value: 504, label: '504 hours (3 weeks)'},
                        {value: 588, label: '|'},
                        {value: 672, label: '672 hours (4 weeks)'},
                        {value: 756, label: '|'},
                        {value: 840, label: '||'}]}
                step={12}
                min={24}
                max={840}
            />
            <CustomButton variant="contained" onClick={() => {
                setRefresh(true)
            }}>
                Refresh Chart
            </CustomButton>
            <Box sx={{ width: '100%', textAlign: 'center', margin: 'auto' }}>
                <Chart options={options}
                       type='candlestick'
                       series={series}
                />
            </Box>
        </Fragment>
    );
};

export default Earnings;
