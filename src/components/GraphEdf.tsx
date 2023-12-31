import * as plotly from "plotly.js-dist-min"
import React, { FC, useEffect, useMemo } from "react"
import {
  Grid,
  FormControl,
  FormLabel,
  MenuItem,
  Select,
  Typography,
  SelectChangeEvent,
  useTheme,
  Box,
} from "@mui/material"
import { plotlyDarkTemplate } from "./PlotlyDarkMode"
import {
  Target,
  useFilteredTrials,
  useFilteredTrialsFromStudies,
  useObjectiveTargets,
} from "../trialFilter"

const plotDomId = "graph-edf"
const getPlotDomId = (objectiveId: number) => `graph-edf-${objectiveId}`

interface EdfPlotInfo {
  study_name: string
  trials: Trial[]
}

export const GraphEdf: FC<{
  study: StudyDetail | null
  objectiveId: number
}> = ({ study, objectiveId }) => {
  const theme = useTheme()
  const domId = getPlotDomId(objectiveId)
  const target = useMemo<Target>(
    () => new Target("objective", objectiveId),
    [objectiveId]
  )
  const trials = useFilteredTrials(study, [target], false)

  useEffect(() => {
    if (study !== null) {
      plotEdf(trials, target, domId, theme.palette.mode)
    }
  }, [trials, target, domId, theme.palette.mode])
  return (
    <Box>
      <Typography
        variant="h6"
        sx={{ margin: "1em 0", fontWeight: theme.typography.fontWeightBold }}
      >
        {`EDF for ${target.toLabel(study?.objective_names)}`}
      </Typography>
      <Box id={domId} sx={{ height: "450px" }} />
    </Box>
  )
}

export const GraphEdfMultiStudies: FC<{
  studies: StudyDetail[]
}> = ({ studies }) => {
  const theme = useTheme()
  const [targets, selected, setTarget] = useObjectiveTargets(
    studies.length !== 0 ? studies[0] : null
  )

  const trials = useFilteredTrialsFromStudies(studies, [selected], false)
  const edfPlotInfos = studies.map((study, index) => {
    const e: EdfPlotInfo = {
      study_name: study?.name,
      trials: trials[index],
    }
    return e
  })

  const handleObjectiveChange = (event: SelectChangeEvent<string>) => {
    setTarget(event.target.value)
  }

  useEffect(() => {
    plotEdfMultiStudies(edfPlotInfos, selected, plotDomId, theme.palette.mode)
  }, [studies, selected, theme.palette.mode])

  return (
    <Grid container direction="row">
      <Grid
        item
        xs={3}
        container
        direction="column"
        sx={{ paddingRight: theme.spacing(2) }}
      >
        <Typography
          variant="h6"
          sx={{ margin: "1em 0", fontWeight: theme.typography.fontWeightBold }}
        >
          EDF
        </Typography>
        {studies.length > 0 && studies[0].directions.length !== 1 ? (
          <FormControl component="fieldset">
            <FormLabel component="legend">Objective:</FormLabel>
            <Select
              value={selected.identifier()}
              onChange={handleObjectiveChange}
            >
              {targets.map((target, i) => (
                <MenuItem value={target.identifier()} key={i}>
                  {target.toLabel(studies[0].objective_names)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : null}
      </Grid>
      <Grid item xs={9}>
        <Box id={plotDomId} sx={{ height: "450px" }} />
      </Grid>
    </Grid>
  )
}

const plotEdf = (
  trials: Trial[],
  target: Target,
  domId: string,
  mode: string
) => {
  if (document.getElementById(domId) === null) {
    return
  }
  if (trials.length === 0) {
    plotly.react(domId, [], {
      template: mode === "dark" ? plotlyDarkTemplate : {},
    })
    return
  }

  const target_name = "Objective Value"
  const layout: Partial<plotly.Layout> = {
    xaxis: {
      title: target_name,
    },
    yaxis: {
      title: "Cumulative Probability",
    },
    margin: {
      l: 50,
      t: 0,
      r: 50,
      b: 50,
    },
    uirevision: "true",
    template: mode === "dark" ? plotlyDarkTemplate : {},
  }

  const values = trials.map((t) => target.getTargetValue(t) as number)
  const numValues = values.length
  const minX = Math.min(...values)
  const maxX = Math.max(...values)
  const numStep = 100
  const _step = (maxX - minX) / (numStep - 1)

  const xValues = []
  const yValues = []
  for (let i = 0; i < numStep; i++) {
    const boundary_right = minX + _step * i
    xValues.push(boundary_right)
    yValues.push(values.filter((v) => v <= boundary_right).length / numValues)
  }

  const plotData: Partial<plotly.PlotData>[] = [
    {
      type: "scatter",
      x: xValues,
      y: yValues,
    },
  ]
  plotly.react(domId, plotData, layout)
}

const plotEdfMultiStudies = (
  edfPlotInfos: EdfPlotInfo[],
  target: Target,
  domId: string,
  mode: string
) => {
  if (document.getElementById(domId) === null) {
    return
  }
  if (edfPlotInfos.length === 0) {
    plotly.react(domId, [], {
      template: mode === "dark" ? plotlyDarkTemplate : {},
    })
    return
  }

  const target_name = "Objective Value"
  const layout: Partial<plotly.Layout> = {
    xaxis: {
      title: target_name,
    },
    yaxis: {
      title: "Cumulative Probability",
    },
    margin: {
      l: 50,
      t: 0,
      r: 50,
      b: 50,
    },
    template: mode === "dark" ? plotlyDarkTemplate : {},
  }

  const plotData: Partial<plotly.PlotData>[] = edfPlotInfos.map((h) => {
    const values = h.trials.map((t) => target.getTargetValue(t) as number)
    const numValues = values.length
    const minX = Math.min(...values)
    const maxX = Math.max(...values)
    const numStep = 100
    const _step = (maxX - minX) / (numStep - 1)

    const xValues = []
    const yValues = []
    for (let i = 0; i < numStep; i++) {
      const boundary_right = minX + _step * i
      xValues.push(boundary_right)
      yValues.push(values.filter((v) => v <= boundary_right).length / numValues)
    }

    return {
      type: "scatter",
      name: `${h.study_name}`,
      x: xValues,
      y: yValues,
    }
  })
  plotly.react(domId, plotData, layout)
}
