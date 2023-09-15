import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export default function Alert({ title, message, action, closeAction }) {
    const [open, setOpen] = React.useState(true);

    const handleCancel = () => {
        setOpen(false)
        closeAction()
    }

    const handleOk = () => {
        setOpen(false)
        action()
    };

    return (
        <div>
            <Dialog
                open={open}
                onClose={handleCancel}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {title}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        { message }
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancel} autoFocus>
                        Close
                    </Button>
                    {(action !== null) && (
                        <Button onClick={handleOk}>
                            Yes
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </div>
    );
}
