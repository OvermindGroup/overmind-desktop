import { useState, useEffect, Fragment } from 'react'
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Slider from '@mui/material/Slider'
import Chart from 'react-apexcharts'
import { PrimeReactProvider } from 'primereact/api'
import { InputNumber } from 'primereact/inputnumber'

function calcSteps(start, finish, steps, isRounded:Boolean) {
    if (steps <= 0) {
        return [start];
    }

    const stepSize = (finish - start) / (steps);
    const lineValues = [];

    for (let i = 0; i <= steps; i++) {
        const value = start + stepSize * i;
        lineValues.push(isRounded ? Math.round(value) : value);
    }

    return lineValues;
}

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

const TradeIndexContainer = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
}));

const CandlestickChart = (props) => {
    const [series, setSeries] = useState([]);
    const [options, setOptions] = useState({});
    const [tradeIndex, setTradeIndex] = useState(1);
    const [tradeIndexMax, setTradeIndexMax] = useState(1);
    const [sliderMarks, setSliderMarks] = useState([]);

    useEffect(() => {
        setTradeIndexMax(props.simulatedTradesData.length)

        const simulation = props.simulatedTradesData[tradeIndex - 1]
        const closePos = simulation['close_pos']

        const simLen = simulation['data'].length
        const tradePad = 10
        const horizonLen = Math.floor(simulation['tp_sl_horizon'][2])
        const finalLen = Math.min(simLen, Math.max(closePos + tradePad, horizonLen + 1))
        const candlesticks = simulation['data'].slice(0, finalLen)

        const dateTimes = []
        for (const candlestick of candlesticks)
            dateTimes.push(new Date(candlestick.date).getTime())
        const isWon = simulation['is_won']
        const instrument = simulation['instrument'].slice(0, -3).toUpperCase()
        const delta = simulation['delta']
        const tp = simulation['tp_sl_horizon'][0]
        const sl = simulation['tp_sl_horizon'][1]
        let horizon = 0
        if (simLen >= horizonLen)
            horizon = new Date(candlesticks[horizonLen].date).getTime()
        const startPrice = candlesticks[0].close
        const startTime = new Date(candlesticks[0].date).getTime()

        const blueColor = '#29b6f6'
        const redColor = '#f44336'
        const tradeColor = isWon ? blueColor : redColor
        const tradeClose = startPrice + delta
        const tradeCloseTime = new Date(candlesticks[closePos].date).getTime()

        // Trade line
        const lineYs = calcSteps(candlesticks[0].close, tradeClose, closePos, false)
        const tradeSeriesData = {
            name: 'Trade',
            type: 'line',
            color: tradeColor,
            data: []
        }
        for (const idx in lineYs) {
            tradeSeriesData.data.push({
                // x: new Date(candlesticks[idx].date).getTime(),
                x: dateTimes[idx],
                y: lineYs[idx]
            })
        }
        const tradeLineMiddle = tradeSeriesData.data[Math.round(tradeSeriesData.data.length / 2)]

        // Trade close horizontal line
        /* const tradeHorizontalSeriesData = {
         *     name: 'Trade Close Price',
         *     type: 'line',
         *     color: tradeColor,
         *     data: []
         * }
         * for (let i = closePos; i < candlesticks.length; i++) {
         *     tradeHorizontalSeriesData.data.push({
         *         x: dateTimes[i],
         *         y: tradeClose
         *     })
         * } */

        // Price candlesticks
        const priceSeriesData = {
            name: 'Price Chart',
            type: 'candlestick',
            data: []
        }

        let yMin = Math.min(startPrice + tp, startPrice + sl)
        let yMax = Math.max(startPrice + tp, startPrice + sl)

        for (const idx in candlesticks) {
            const candlestick = candlesticks[idx]
            const ohlc = [candlestick.open, candlestick.high, candlestick.low, candlestick.close]
            const minPrice = Math.min(...ohlc)
            const maxPrice = Math.max(...ohlc)
            if (minPrice < yMin)
                yMin = minPrice
            if (maxPrice > yMax)
                yMax = maxPrice
            priceSeriesData.data.push({
                x: dateTimes[idx],
                y: ohlc
            })
        }

        setSeries([priceSeriesData,
                   tradeSeriesData])
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
                text: `${instrument} Simulated Trades`,
                align: 'center',
                offsetY: 10
            },
            annotations: {
                points: [{
                    x: startTime,
                    y: startPrice,
                    label: {
                        text: 'Trade Open',
                        textAnchor: 'start',
                        style: {
                            color: '#fff',
                            fontSize: 20,
                            cssClass: 'outlined',
                            fontFamily: 'courier new',
                            padding: {
                                right: 0,
                                left: 0,
                                top: -100,
                                bottom: 0
                            }
                        }
                    }
                }, {
                    x: tradeLineMiddle.x,
                    y: tradeLineMiddle.y,
                    label: {
                        text: 'Trade',
                        style: {
                            color: '#fff',
                            fontSize: 20,
                            cssClass: 'outlined',
                            fontFamily: 'courier new',
                            padding: {
                                right: 0,
                                left: 0,
                                top: -100,
                                bottom: 0
                            }
                        }
                    }
                }, {
                    x: tradeCloseTime,
                    y: tradeClose,
                    label: {
                        text: 'Trade Close',
                        style: {
                            color: '#fff',
                            fontSize: 20,
                            cssClass: 'outlined',
                            fontFamily: 'courier new',
                            padding: {
                                right: 0,
                                left: 0,
                                top: -100,
                                bottom: 0
                            }
                        }
                    }
                }],
                yaxis: [{
                    y: startPrice + tp,
                    width: '100%',
                    borderColor: blueColor,
                    label: {
                        text: 'Take Profit',
                        position: 'left',
                        offsetX: 225,
                        style: {
                            color: '#fff',
                            fontSize: 20,
                            cssClass: 'outlined',
                            fontFamily: 'courier new',
                            padding: {
                                right: 0,
                                left: 0,
                                top: -100,
                                bottom: 0
                            }
                        }
                    }
                },
                        {
                            y: startPrice + sl,
                            width: '100%',
                            borderColor: redColor,
                            label: {
                                text: 'Stop Loss',
                                position: 'left',
                                offsetX: 200,
                                style: {
                                    color: '#fff',
                                    fontSize: 20,
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
                }],
                xaxis: []
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
                width: [0.5, 2],
                curve: 'straight',
                lineCap: 'butt',
                dashArray: [0, 3]
            },
            xaxis: {
                type: 'datetime',
                labels: {
                    rotate: -10,
                    formatter: (value, timestamp, opts) => {
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
            }
        }
        if ( simLen >= horizonLen)
            opts.annotations.xaxis.push({
                x: horizon,
                label: {
                    text: 'Time Horizon',
                    orientation: 'vertical',
                    borderColor: tradeColor,
                    borderWidth: 1,
                    offsetX: 0,
                    style: {
                        color: '#fff',
                        fontSize: 20,
                        cssClass: 'outlined',
                        fontFamily: 'courier new',
                        padding: {
                            right: 0,
                            left: 0,
                            top: -100,
                            bottom: 0
                        }
                    }
                }
            })
        setOptions(opts)
    }, [props.simulatedTradesData, tradeIndex]);

    useEffect(() => {
        const marks = []
        for (const mark of calcSteps(1, tradeIndexMax, 5, true))
            marks.push({value: mark, label: `Trade #${mark}`})

        setSliderMarks(marks)
    }, [tradeIndexMax]);

    const handleSliderChange = (event: Event, newValue: number | number[]) => {
        setTradeIndex(newValue as number);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTradeIndex(event.target.value === '' ? 0 : Number(event.target.value));
    };

    const handleBlur = () => {
        if (tradeIndex < 1) {
            setTradeIndex(1);
        } else if (tradeIndex > tradeIndexMax) {
            setTradeIndex(tradeIndexMax);
        }
    };

    return (
        <Fragment>
            <Box sx={{ width: '100%', textAlign: 'center', marginBottom: 2 }}>
                <TradeIndexContainer>
                    <Typography id="input-slider" gutterBottom>
                        Simulated Trade #
                    </Typography>
                    <Grid container spacing={1} alignItems="center">

                        <Grid item sx={{ width: '70%' }}>
                            <Box sx={{ width: '90%', margin: 'auto' }}>
                                <Slider
                                    value={typeof tradeIndex === 'number' ? tradeIndex : 1}
                                    onChange={handleSliderChange}
                                    aria-labelledby="input-slider"
                                    valueLabelDisplay="auto"
                                    marks={sliderMarks}
                                    min={1}
                                    max={tradeIndexMax}
                                />
                            </Box>
                        </Grid>
                        <Grid item sx={{ width: '30%' }}>
                            <PrimeReactProvider>
                                <InputNumber value={tradeIndex}
                                             onValueChange={(e) => setTradeIndex(e.value)}
                                             showButtons
                                             buttonLayout="horizontal" step={1}
                                             decrementButtonClassName="p-button-secondary"
                                             incrementButtonClassName="p-button-secondary"
                                             incrementButtonIcon="pi pi-plus"
                                             decrementButtonIcon="pi pi-minus"
                                             min={1}
                                             max={tradeIndexMax}
                                             inputClassName="centered-input"
                                             mode="decimal" />
                            </PrimeReactProvider>
                        </Grid>
                    </Grid>
                </TradeIndexContainer>
            </Box>
            <Box sx={{ width: '100%', textAlign: 'center', margin: 'auto' }}>
                <Chart options={options}
                       type='candlestick'
                       series={series}
                />
            </Box>
        </Fragment>
    );
};

export default CandlestickChart;
