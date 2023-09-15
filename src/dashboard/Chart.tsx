import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import { LineChart, Line, XAxis, YAxis, Label, ResponsiveContainer } from 'recharts';
import Title from './Title';

function createData(time: string, amount?: number) {
  return { time, amount };
}

export default function Chart({ data }) {
  const theme = useTheme();
  const [chartData, setChartData] = React.useState([]);

  React.useEffect(() => {
    let newChartData = []
    for (const dayData of data) {
      const date = new Date(dayData.updateTime);

      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');

      const dateString = `${month}-${day}`;
      newChartData.push(createData(dateString, parseFloat(dayData.data.totalAssetOfBtc)))
      setChartData(newChartData)
    }
  }, [data])

  return (
    <React.Fragment>
      <Title>Account Snapshot</Title>
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{
            top: 16,
            right: 16,
            bottom: 0,
            left: 60,
          }}
        >
          <XAxis
            dataKey="time"
            stroke={theme.palette.text.secondary}
            style={theme.typography.body2}
          />
          <YAxis
            stroke={theme.palette.text.secondary}
            style={theme.typography.body2}
            domain={['dataMin', 'dataMax']}
          >
            <Label
              angle={270}
              position="left"
              style={{
                textAnchor: 'middle',
                fill: theme.palette.text.primary,
                ...theme.typography.body1,
              }}
              dx={-40}
            >
              Account BTC Value
            </Label>
          </YAxis>
          <Line
            isAnimationActive={false}
            type="monotone"
            dataKey="amount"
            stroke={theme.palette.primary.main}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </React.Fragment>
  );
}
