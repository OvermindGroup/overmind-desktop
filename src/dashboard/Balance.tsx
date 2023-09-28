import * as React from 'react';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Grid'

const Title = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  paddingBottom: theme.spacing(1),
}));

function getDateTime() {
  const currentDate = new Date();
  const day = String(currentDate.getDate()).padStart(2, '0'); // Day of the month (01-31)
  const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month (01-12)
  const year = currentDate.getFullYear(); // Four-digit year
  const hours = String(currentDate.getHours()).padStart(2, '0'); // Hour (00-23)
  const minutes = String(currentDate.getMinutes()).padStart(2, '0'); // Minutes (00-59)
  const seconds = String(currentDate.getSeconds()).padStart(2, '0'); // Seconds (00-59)

  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}

export default function Balance({ usdtBalance, btcBalance }) {
  const [balanceDateTime, setBalanceDateTime] = React.useState([]);

  React.useEffect(() => {
    setBalanceDateTime(getDateTime())
  }, [usdtBalance])

  return (
    <React.Fragment>
      <Title variant="h5">Total Assets Value</Title>
      <Grid container direction="column" alignItems="center" justifyContent="center" height="100%">
        <Grid item>
          <Typography component="p" variant="h5">
            {btcBalance.toFixed(8)} BTC
          </Typography>
        </Grid>
        <Grid item>
          <Typography component="p" variant="h6">
            ~${usdtBalance.toFixed(2)} USDT
          </Typography>
        </Grid>
        <Grid item>
          <Typography color="text.secondary">
            {balanceDateTime}
          </Typography>
        </Grid>
      </Grid>
    </React.Fragment>
  );
}
