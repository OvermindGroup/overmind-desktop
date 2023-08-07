import * as React from 'react';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Title from './Title';

function preventDefault(event: React.MouseEvent) {
  event.preventDefault();
}

function getDateTime() {
  const currentDate = new Date();
  const day = currentDate.getDate(); // Day of the month (1-31)
  const month = currentDate.getMonth(); // Month (0-11, where 0 is January and 11 is December)
  const year = currentDate.getFullYear(); // Four-digit year
  const hours = currentDate.getHours(); // Hour (0-23)
  const minutes = currentDate.getMinutes(); // Minutes (0-59)
  const seconds = currentDate.getSeconds(); // Seconds (0-59)

  return `${day}/${month + 1}/${year}, ${hours}:${minutes}:${seconds}`
}

export default function Deposits({ balance }) {
  return (
    <React.Fragment>
      <Title>Total Assets Value</Title>
      <Typography component="p" variant="h4">
        ${balance} BTC
      </Typography>
      <Typography color="text.secondary" sx={{ flex: 1 }}>
        {getDateTime()}
      </Typography>
      <div>
        <Link color="primary" href="#" onClick={preventDefault}>
          View balance
        </Link>
      </div>
    </React.Fragment>
  );
}
