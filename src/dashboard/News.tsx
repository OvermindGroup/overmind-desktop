import { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import { fetchNews } from '../dataHelpers'

const Title = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  paddingBottom: theme.spacing(1),
}));

const DateComp = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(0),
  paddingBottom: theme.spacing(1),
  fontStyle: 'italic',
  fontSize: '14px'
}));

const Paragraph = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  paddingBottom: theme.spacing(1),
  fontSize: '15px'
}));

export default function News({ overmindApiKey }) {
  const [newsTitle, setNewsTitle] = useState('');
  const [newsDate, setNewsDate] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsThumbnail, setNewsThumbnail] = useState('');
  const [newsLink, setNewsLink] = useState('');
  const [newsLinkContent, setNewsLinkContent] = useState('');

  function setNews() {
    fetchNews(overmindApiKey).then((resp) => {
      const { title, date, content, thumbnail, link, linkContent } = resp[0]
      setNewsTitle(title)
      setNewsDate(date)
      setNewsContent(content)
      setNewsThumbnail(thumbnail)
      setNewsLink(link)
      setNewsLinkContent(linkContent)
    })
  }

  function intervalFetchNews(intervalInSeconds:number) {
    const now = new Date();
    const currentSeconds = now.getSeconds();
    const currentMilliseconds = now.getMilliseconds();

    // Calculate how many milliseconds until the next interval
    const millisecondsUntilNextInterval =
      ((intervalInSeconds - (currentSeconds % intervalInSeconds)) * 1000) - currentMilliseconds;

    setTimeout(function () {
      fetchNews(overmindApiKey).then((resp) => {
        if (resp === null || resp === undefined)
          return
        const { title, date, content, thumbnail, link, linkContent } = resp[0]
        setNewsTitle(title)
        setNewsDate(date)
        setNewsContent(content)
        setNewsThumbnail(thumbnail)
        setNewsLink(link)
        setNewsLinkContent(linkContent)
        intervalFetchNews(intervalInSeconds)
      })
    }, millisecondsUntilNextInterval);
  }

  function useFetchNews() {
    const storeValuationsEvery = 60 // seconds
    intervalFetchNews(storeValuationsEvery)
  }

  useEffect(() => {
    setNews()
    useFetchNews()
  }, [])

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Title variant="h5">{newsTitle}</Title>
      </Grid>
      <Grid item xs={4} style={{ textAlign: 'center' }}>
        <Paper elevation={12} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '140px' }}>
          <img src={newsThumbnail} alt="News Thumbnail" />
        </Paper>
      </Grid>
      <Grid item xs={8}>
        <div>
          <DateComp>{newsDate}</DateComp>
          <Paragraph>{newsContent}</Paragraph>
          <Link href={newsLink} target="_blank" rel="noopener noreferrer">{newsLinkContent}</Link>
        </div>
      </Grid>
    </Grid>
  );
}
