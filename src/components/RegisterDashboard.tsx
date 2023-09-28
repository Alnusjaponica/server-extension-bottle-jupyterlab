import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import React, { FC, useState } from 'react';
import { requestAPI } from '../handler';
import { App } from './App';
import { InitializeDashboard } from './InitializeDashboard';


interface IsInitializedResponse {
    is_initialized: boolean
}

export const RegisterDashboard: FC = () => {
    const [loading, setLoading] = useState(true)
    const [isInitialized, setIsInitialized] = useState(false)
    const [openNewDashboardDialog, setOpenNewDashboardDialog] = useState(true)

    requestAPI<IsInitializedResponse>(`/api/is_initialized`, {
        method: 'GET',
    }).then((res) => {
        setOpenNewDashboardDialog(!res.is_initialized)
        setLoading(false)
    }).catch((err) => {
        console.log(err)
    })

    if (loading) {
        return (
            <Box sx={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <CircularProgress />
            </Box>
        )
    }
    else if (!isInitialized) {
        return (
            <InitializeDashboard
                setIsInitialized={setIsInitialized}
                setLoading={setLoading}
                doesOpenDialog={openNewDashboardDialog}
            />
        )
    }
    else {
        return (
            <App />
        )
    }
}