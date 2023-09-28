import RestartAltIcon from '@mui/icons-material/RestartAlt';
import StartIcon from '@mui/icons-material/Start';
import {
    Box,
    Button,
    CssBaseline,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    ThemeProvider,
    createTheme,
    useMediaQuery
} from "@mui/material";
import blue from "@mui/material/colors/blue";
import pink from "@mui/material/colors/pink";
import { SnackbarProvider } from "notistack";
import React, { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from "react";
import { RecoilRoot } from "recoil";
import { requestAPI } from '../handler';
import { DebouncedInputTextField } from "./Debounce";




export const InitializeDashboard: FC<{ setIsInitialized: Dispatch<SetStateAction<boolean>>, setLoading: Dispatch<SetStateAction<boolean>>, doesOpenDialog: boolean }> = ({ setIsInitialized, setLoading, doesOpenDialog }) => {

    const [storageURL, setStorageURL] = useState("")
    const [artifactPath, setArtifactPath] = useState("")
    const [openNewDashboardDialog, setOpenNewDashboardDialog] = useState(doesOpenDialog)
    const [isValidURL, setIsValidURL] = useState(false)

    const rfc1738Pattern = new RegExp(`[\\w\\+]+://([^:/]*(.*)?@)?((\\[[^/]+\\]|[^/:]+)?([^/]*)?)?(/.*)?`);

    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)")
    const [colorMode, setColorMode] = useState<"light" | "dark">("light")
    useEffect(() => {
        setColorMode(prefersDarkMode ? "dark" : "light")
    }, [prefersDarkMode])
    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode: colorMode,
                    primary: blue,
                    secondary: pink,
                },
            }),
        [colorMode]
    )

    const handleOpenNewDashboardDialog = () => {
        setOpenNewDashboardDialog(true)
    }

    const handleCloseNewDashboardDialog = () => {
        setOpenNewDashboardDialog(false)
    }

    const handleCreateNewDashboard = () => {
        setOpenNewDashboardDialog(false)
        setLoading(true)

        requestAPI<void>(`/api/register_dashboard_app`, {
            body: JSON.stringify({
                storage_url: storageURL,
                artifact_path: artifactPath,
            }),
            method: 'POST',
        }).then(() => {
            return requestAPI<void>(`/api/is_initialized`, {
                body: JSON.stringify({
                    is_initialized: true,
                }),
                method: 'POST',
            }).then(() => {
                setIsInitialized(true)
            })
        }).catch((err) => {
            console.log(err)
        })
    }
    const handleValidateURL = (url: string) => {
        url.startsWith("redis") || url.match(rfc1738Pattern) ? setIsValidURL(true) : setIsValidURL(false)
    }

    const handleOpenExistingDashboard = () => {
        setIsInitialized(true)
        setOpenNewDashboardDialog(false)
    }

    return (
        <RecoilRoot>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Box
                    sx={{
                        backgroundColor: colorMode === "dark" ? "#121212" : "#ffffff",
                        width: "100%",
                        minHeight: "100vh",
                    }}
                >
                    <SnackbarProvider maxSnack={3}>
                        {!openNewDashboardDialog ?
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: 'center',
                                    flexWrap: 'wrap',
                                    width: "100%"
                                }}
                            >
                                <Button
                                    variant="outlined"
                                    onClick={handleOpenExistingDashboard}
                                    color="primary"
                                    startIcon={<StartIcon />}
                                    sx={{ marginRight: theme.spacing(2), minWidth: "120px" }}
                                >
                                    Continue
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleOpenNewDashboardDialog}
                                    color="primary"
                                    startIcon={<RestartAltIcon />}
                                    sx={{ marginRight: theme.spacing(2), minWidth: "120px" }}
                                >
                                    Reset
                                </Button>
                            </Box> : null}

                        <Box sx={{ display: "flex" }}>
                            <Dialog
                                open={openNewDashboardDialog}
                                onClose={() => {
                                    handleCloseNewDashboardDialog()
                                }}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateNewDashboard() }}
                                aria-labelledby="initialize-dashboard-dialog-title"
                            >
                                <DialogTitle id="initialize-dashboard-dialog-title">New Dashboard</DialogTitle>
                                <DialogContent>
                                    <DialogContentText>
                                        Please enter a storage url and an artifact path.
                                    </DialogContentText>
                                    <DebouncedInputTextField
                                        onChange={(s) => {
                                            handleValidateURL(s)
                                            setStorageURL(s)
                                        }}
                                        delay={500}
                                        textFieldProps={{
                                            autoFocus: true,
                                            fullWidth: true,
                                            label: "Storage URL",
                                            type: "text",
                                            sx: { margin: "4px 0" }
                                        }}
                                    />
                                    <DebouncedInputTextField
                                        onChange={(s) => {
                                            setArtifactPath(s)
                                        }}
                                        delay={500}
                                        textFieldProps={{
                                            autoFocus: true,
                                            fullWidth: true,
                                            label: "Artifact path (Optional)",
                                            type: "text",
                                            sx: { margin: "4px 0" }
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
                                        disabled={!isValidURL}
                                    >
                                        Create
                                    </Button>
                                </DialogActions>
                            </Dialog>
                        </Box>
                    </SnackbarProvider>
                </Box>
            </ThemeProvider>
        </RecoilRoot>
    )
}