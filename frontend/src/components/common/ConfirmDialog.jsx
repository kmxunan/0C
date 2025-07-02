import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress } from '@mui/material';

const ConfirmDialog = ({ open, title, content, onConfirm, onCancel, loading = false }) => {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{content}</DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>取消</Button>
        <Button onClick={onConfirm} color="error" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : '确认'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;