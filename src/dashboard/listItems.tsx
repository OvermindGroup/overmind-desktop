import * as React from 'react';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';

export const mainListItems = (handleClick) => (
  <React.Fragment>
    <ListSubheader component="div" inset>
      Investment Portfolio
    </ListSubheader>
    <ListItemButton onClick={() => handleClick('recommended-portfolio')}
                    className="recommended-portfolio-menu-item">
      <ListItemIcon>
        <ShowChartIcon />
      </ListItemIcon>
      <ListItemText primary="Recommended Portfolio" />
    </ListItemButton>
    <ListItemButton onClick={() => handleClick('current-portfolio')}
                    className="current-portfolio-menu-item">
      <ListItemIcon>
        <AttachMoneyIcon />
      </ListItemIcon>
      <ListItemText primary="Current Portfolio" />
    </ListItemButton>
    <ListItemButton onClick={() => handleClick('to-execute-portfolio')}
                    className="to-execute-menu-item">
      <ListItemIcon>
        <SyncAltIcon />
      </ListItemIcon>
      <ListItemText primary="Execute Portfolio" />
    </ListItemButton>
  </React.Fragment>
);

export const secondaryListItems = (handleClick) => (
  <React.Fragment>
    <ListSubheader component="div" inset>
      Reports
    </ListSubheader>
    <ListItemButton onClick={() => handleClick('earnings-report')}
                    className="earnings-report-menu-item">
      <ListItemIcon>
        <AssignmentIcon />
      </ListItemIcon>
      <ListItemText primary="Profit & Loss" />
    </ListItemButton>
    <ListItemButton onClick={() => handleClick('portfolio-report')}
                    className="portfolio-report-menu-item">
      <ListItemIcon>
        <AssignmentIcon />
      </ListItemIcon>
      <ListItemText primary="Risk Management" />
    </ListItemButton>
  </React.Fragment>
);

export const configListItems = (handleClick) => (
  <React.Fragment>
    <ListSubheader component="div" inset>
      Configuration
    </ListSubheader>
    <ListItemButton onClick={() => handleClick('api-keys')}
                    className="api-keys-menu-item">
      <ListItemIcon>
        <SettingsIcon />
      </ListItemIcon>
      <ListItemText primary="API Keys" />
    </ListItemButton>
    <ListItemButton onClick={() => handleClick('quit')}>
      <ListItemIcon>
        <PowerSettingsNewIcon />
      </ListItemIcon>
      <ListItemText primary="Quit" />
    </ListItemButton>
  </React.Fragment>
);
