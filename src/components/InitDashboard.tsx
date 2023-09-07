import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from "@mui/material";
import { Dispatch, FC, default as React, SetStateAction, useState } from "react";
import { requestAPI } from '.././handler';
import { DebouncedInputTextField } from "./Debounce";

const initializeDashboardAPI = (
    storageURL: string, artifactPath: string
): Promise<void> => {
    return requestAPI<void>(`/api/register_dashboard_app`, {
        body: JSON.stringify({
            storage_url: storageURL,
            artifact_path: artifactPath,
        }),
        method: 'POST',
    }).then(() => {
        return
    })
}

const initializeDashboard = (storageURL: string, artifactPath: string) => {

    initializeDashboardAPI(storageURL, artifactPath)
        .then(() => {
            return
        })
        .catch((err) => {
            console.log(err)
        })
}


export const InitDashboard: FC<{ setIsInitialized: Dispatch<SetStateAction<boolean>> }> = ({ setIsInitialized }) => {

    const [storageURL, setstorageURL] = useState("")
    const [artifactPath, setartifactPath] = useState("")
    const [openNewDashboardDialog, setOpenNewDashboardDialog] = useState(true)

    const handleCloseNewDashboardDialog = () => {
        setOpenNewDashboardDialog(false)
    }

    const handleCreateNewDashboard = () => {
        initializeDashboard(storageURL, artifactPath)
        setOpenNewDashboardDialog(false)
        setIsInitialized(true)
    }

    return (
        <Box sx={{ display: "flex" }}>
            <Dialog
                open={openNewDashboardDialog}
                onClose={() => {
                    handleCloseNewDashboardDialog()
                }}
                aria-labelledby="initialize-dashboard-dialog-title"
            >
                <DialogTitle id="initialize-dashboard-dialog-title">New Dashboard</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter the study name and directions here.
                    </DialogContentText>
                    <DebouncedInputTextField
                        onChange={(s) => {
                            setstorageURL(s)
                        }}
                        delay={500}
                        textFieldProps={{
                            autoFocus: true,
                            fullWidth: true,
                            label: "Storage URL",
                            type: "text",
                        }}
                    />
                    <DebouncedInputTextField
                        onChange={(s) => {
                            setartifactPath(s)
                        }}
                        delay={500}
                        textFieldProps={{
                            autoFocus: true,
                            fullWidth: true,
                            label: "Artifact path",
                            type: "text",
                        }}
                    />
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleCloseNewDashboardDialog} color="primary">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateNewDashboard}
                        color="primary"
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}