import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/system';
import { saveApiKeys } from '../dataHelpers'

const FormContainer = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
}));

const Title = styled(Typography)(({ theme }) => ({
    marginBottom: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingBottom: theme.spacing(3),
}));


const StyledTextField = styled(TextField)(({ theme }) => ({
    marginBottom: theme.spacing(2),
    width: '100%',
}));

const SaveButton = styled(Button)(({ theme }) => ({
    marginTop: theme.spacing(2),
}));

export default function Settings({ apiKeys, action }) {
    const [overmindApiKey, setOvermindApiKey] = React.useState(apiKeys.overmindApiKey || "");
    const [binanceApiKey, setBinanceApiKey] = React.useState(apiKeys.binanceApiKey || "");
    const [binanceSecretKey, setBinanceSecretKey] = React.useState(apiKeys.binanceSecretKey || "");

    return (
        <FormContainer>
            <Title variant="h4">API Keys</Title>
            <Title variant="h6">Overmind</Title>
            <StyledTextField
                id="overmind-api-key"
                label="Overmind API Key"
                variant="filled"
                type="password"
                value={overmindApiKey}
                onChange={(event) => setOvermindApiKey(event.target.value)}
            />
            <Title variant="h6">Binance</Title>
            <StyledTextField
                id="binance-api-key"
                label="Binance API Key"
                variant="filled"
                type="password"
                value={binanceApiKey}
                onChange={(event) => setBinanceApiKey(event.target.value)}
            />
            <StyledTextField
                id="binance-api-secret"
                label="Binance Secret"
                variant="filled"
                type="password"
                value={binanceSecretKey}
                onChange={(event) => setBinanceSecretKey(event.target.value)}
            />
            <SaveButton variant="contained" color="primary" onClick={() => {
                const apiKeys = {overmindApiKey, binanceApiKey, binanceSecretKey}
                saveApiKeys(apiKeys)
                action(apiKeys).then(() => {
                    console.log('Updated API Keys')
                })
            }}>
                Save Changes
            </SaveButton>
        </FormContainer>
    );;
}
