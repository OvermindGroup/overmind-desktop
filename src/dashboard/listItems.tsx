import * as React from 'react';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Divider from '@mui/material/Divider';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDiscord,
         faTelegram,
         faReddit,
         faGithub,
         faInstagram,
         faTiktok,
         faYoutube
} from '@fortawesome/free-brands-svg-icons'
import {
  faCircleQuestion
} from '@fortawesome/free-solid-svg-icons'

import AirlineStopsIcon from '@mui/icons-material/AirlineStops';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import VideoSettingsIcon from '@mui/icons-material/VideoSettings';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import Badge from '@mui/material/Badge';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';

import './styles.css'

export const menuListItems = (handle) => {
  const [selectedMenuItem, setSelectedMenuItem] = React.useState('recommended-portfolio')

  const handleClick = (item:string) => {
    setSelectedMenuItem(item)
    handle(item)
  }

  const isSelected = (item:string) => {
    return selectedMenuItem == item
  }

  return (

    <React.Fragment>

      <ListSubheader component="div" inset>
        Investment Portfolio
      </ListSubheader>


      <ListItemButton onClick={() => handleClick('recommended-portfolio')}
                      className="menu-item"
                      selected={isSelected('recommended-portfolio')}>
        <ListItemIcon>
          <SettingsSuggestIcon />
        </ListItemIcon>
        <ListItemText primary="Portfolio Optimization" />
      </ListItemButton>

      <ListItemButton onClick={() => handleClick('current-portfolio')}
                      className="current-portfolio-menu-item"
                      selected={isSelected('current-portfolio')}>
        <ListItemIcon>
          <AttachMoneyIcon />
        </ListItemIcon>
        <ListItemText primary="Current Portfolio" />
      </ListItemButton>

      <ListItemButton onClick={() => handleClick('to-execute-portfolio')}
                      className="to-execute-menu-item"
                      selected={isSelected('to-execute-portfolio')}>
        <ListItemIcon>
          <SyncAltIcon />
        </ListItemIcon>
        <ListItemText primary="Execute Portfolio" />
      </ListItemButton>

      <ListItemButton onClick={() => handleClick('automation')}
                      className="menu-item"
                      selected={isSelected('automation')}
      disabled>
        <ListItemIcon>
          <Badge badgeContent={"SOON"} color="secondary">
            <VideoSettingsIcon />
          </Badge>
        </ListItemIcon>
        <ListItemText primary="Automated Trading" />
      </ListItemButton>

      <Divider sx={{ my: 1 }} />

      <ListSubheader component="div" inset>
        Reports
      </ListSubheader>

      <ListItemButton onClick={() => handleClick('earnings-report')}
                      className="earnings-report-menu-item"
                      selected={isSelected('earnings-report')}>
        <ListItemIcon>
          <ShowChartIcon />
        </ListItemIcon>
        <ListItemText primary="Profit & Loss" />
      </ListItemButton>
      <ListItemButton onClick={() => handleClick('portfolio-report')}
                      className="portfolio-report-menu-item"
                      selected={isSelected('portfolio-report')}>
        <ListItemIcon>
          <AirlineStopsIcon />
        </ListItemIcon>
        <ListItemText primary="Risk Management" />
      </ListItemButton>

      <Divider sx={{ my: 1 }} />

      <ListSubheader component="div" inset>
        More Info
      </ListSubheader>

      <ListItemButton onClick={() => handleClick('faq')}
                      selected={isSelected('faq')}>
        <ListItemIcon>
          <FontAwesomeIcon style={{width: '24px'}} className={"fa-lg"} icon={faCircleQuestion} />
        </ListItemIcon>
        <ListItemText primary="FAQ" />
      </ListItemButton>

      <ListItemButton onClick={() => handleClick('youtube')}
                      className="menu-item"
                      selected={isSelected('youtube')}>
        <ListItemIcon>
          <FontAwesomeIcon style={{width: '24px'}} className={"fa-lg"} icon={faYoutube} />
        </ListItemIcon>
        <ListItemText primary="YouTube" />
      </ListItemButton>

      <ListItemButton onClick={() => handleClick('discord')}
                      className="menu-item"
                      selected={isSelected('discord')}>
        <ListItemIcon>
          <FontAwesomeIcon style={{width: '24px'}} className={"fa-lg"} icon={faDiscord} />
        </ListItemIcon>
        <ListItemText primary="Discord" />
      </ListItemButton>

      <ListItemButton onClick={() => handleClick('telegram')}
                      className="menu-item"
                      selected={isSelected('telegram')}>
        <ListItemIcon>
          <FontAwesomeIcon style={{width: '24px'}} className={"fa-xl"} icon={faTelegram} />
        </ListItemIcon>
        <ListItemText primary="Telegram" />
      </ListItemButton>

      <ListItemButton onClick={() => handleClick('reddit')}
                      className="menu-item"
                      selected={isSelected('reddit')}>
        <ListItemIcon>
          <FontAwesomeIcon style={{width: '24px'}} className={"fa-xl"} icon={faReddit} />
        </ListItemIcon>
        <ListItemText primary="Reddit" />
      </ListItemButton>

      <ListItemButton onClick={() => handleClick('github')}
                      className="menu-item"
                      selected={isSelected('github')}>
        <ListItemIcon>
          <FontAwesomeIcon style={{width: '24px'}} className={"fa-xl"} icon={faGithub} />
        </ListItemIcon>
        <ListItemText primary="Github" />
      </ListItemButton>

      <ListItemButton onClick={() => handleClick('instagram')}
                      className="menu-item"
                      selected={isSelected('instagram')}>
        <ListItemIcon>
          <FontAwesomeIcon style={{width: '24px'}} className={"fa-xl"} icon={faInstagram} />
        </ListItemIcon>
        <ListItemText primary="Instagram" />
      </ListItemButton>

      <ListItemButton onClick={() => handleClick('tiktok')}
                      className="menu-item"
                      selected={isSelected('tiktok')}>
        <ListItemIcon>
          <FontAwesomeIcon style={{width: '24px'}} className={"fa-xl"} icon={faTiktok} />
        </ListItemIcon>
        <ListItemText primary="TikTok" />
      </ListItemButton>

      <Divider sx={{ my: 1 }} />

      <ListSubheader component="div" inset>
        Configuration
      </ListSubheader>
      <ListItemButton onClick={() => handleClick('api-keys')}
                      className="api-keys-menu-item"
                      selected={isSelected('api-keys')}>
        <ListItemIcon>
          <SettingsIcon />
        </ListItemIcon>
        <ListItemText primary="API Keys" />
      </ListItemButton>
      <ListItemButton onClick={() => handleClick('quit')}
                      selected={isSelected('quit')}>
        <ListItemIcon>
          <PowerSettingsNewIcon />
        </ListItemIcon>
        <ListItemText primary="Quit" />
      </ListItemButton>


    </React.Fragment>
)};
