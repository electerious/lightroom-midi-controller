import easymidi from 'easymidi'
import fs from 'node:fs'
import path from 'node:path'
import prompts from 'prompts'
import { parseEnv } from '../src/mapper.js'
import { listInputs, listOutputs } from '../src/midi.js'
import { loadEnv } from './utils/load-env.js'

const PARAMETERS = [
  // Light
  { label: 'Exposure', parameter: 'Exposure2012', defaultAmount: 0.1 },
  { label: 'Contrast', parameter: 'Contrast2012', defaultAmount: 1 },
  { label: 'Highlights', parameter: 'Highlights2012', defaultAmount: 1 },
  { label: 'Shadows', parameter: 'Shadows2012', defaultAmount: 1 },
  { label: 'Whites', parameter: 'Whites2012', defaultAmount: 1 },
  { label: 'Blacks', parameter: 'Blacks2012', defaultAmount: 1 },
  // Color
  { label: 'Temperature', parameter: 'Temperature', defaultAmount: 100 },
  { label: 'Tint', parameter: 'Tint', defaultAmount: 1 },
  { label: 'Vibrance', parameter: 'Vibrance', defaultAmount: 1 },
  { label: 'Saturation', parameter: 'Saturation', defaultAmount: 1 },
  { label: 'White Balance', parameter: 'WhiteBalance', defaultAmount: 1 },
  // Presence
  { label: 'Clarity', parameter: 'Clarity2012', defaultAmount: 1 },
  { label: 'Dehaze', parameter: 'Dehaze', defaultAmount: 1 },
  { label: 'Texture', parameter: 'Texture', defaultAmount: 1 },
  // Tone Curve
  { label: 'Tone Curve Saturation', parameter: 'CurveRefineSaturation', defaultAmount: 1 },
  // HSL — Hue
  { label: 'Hue — Red', parameter: 'HueAdjustmentRed', defaultAmount: 1 },
  { label: 'Hue — Orange', parameter: 'HueAdjustmentOrange', defaultAmount: 1 },
  { label: 'Hue — Yellow', parameter: 'HueAdjustmentYellow', defaultAmount: 1 },
  { label: 'Hue — Green', parameter: 'HueAdjustmentGreen', defaultAmount: 1 },
  { label: 'Hue — Aqua', parameter: 'HueAdjustmentAqua', defaultAmount: 1 },
  { label: 'Hue — Blue', parameter: 'HueAdjustmentBlue', defaultAmount: 1 },
  { label: 'Hue — Purple', parameter: 'HueAdjustmentPurple', defaultAmount: 1 },
  { label: 'Hue — Magenta', parameter: 'HueAdjustmentMagenta', defaultAmount: 1 },
  // HSL — Saturation
  { label: 'Saturation — Red', parameter: 'SaturationAdjustmentRed', defaultAmount: 1 },
  { label: 'Saturation — Orange', parameter: 'SaturationAdjustmentOrange', defaultAmount: 1 },
  { label: 'Saturation — Yellow', parameter: 'SaturationAdjustmentYellow', defaultAmount: 1 },
  { label: 'Saturation — Green', parameter: 'SaturationAdjustmentGreen', defaultAmount: 1 },
  { label: 'Saturation — Aqua', parameter: 'SaturationAdjustmentAqua', defaultAmount: 1 },
  { label: 'Saturation — Blue', parameter: 'SaturationAdjustmentBlue', defaultAmount: 1 },
  { label: 'Saturation — Purple', parameter: 'SaturationAdjustmentPurple', defaultAmount: 1 },
  { label: 'Saturation — Magenta', parameter: 'SaturationAdjustmentMagenta', defaultAmount: 1 },
  // HSL — Luminance
  { label: 'Luminance — Red', parameter: 'LuminanceAdjustmentRed', defaultAmount: 1 },
  { label: 'Luminance — Orange', parameter: 'LuminanceAdjustmentOrange', defaultAmount: 1 },
  { label: 'Luminance — Yellow', parameter: 'LuminanceAdjustmentYellow', defaultAmount: 1 },
  { label: 'Luminance — Green', parameter: 'LuminanceAdjustmentGreen', defaultAmount: 1 },
  { label: 'Luminance — Aqua', parameter: 'LuminanceAdjustmentAqua', defaultAmount: 1 },
  { label: 'Luminance — Blue', parameter: 'LuminanceAdjustmentBlue', defaultAmount: 1 },
  { label: 'Luminance — Purple', parameter: 'LuminanceAdjustmentPurple', defaultAmount: 1 },
  { label: 'Luminance — Magenta', parameter: 'LuminanceAdjustmentMagenta', defaultAmount: 1 },
  // HSL — Legacy
  { label: 'Red Hue', parameter: 'RedHue', defaultAmount: 1 },
  { label: 'Red Saturation', parameter: 'RedSaturation', defaultAmount: 1 },
  { label: 'Green Hue', parameter: 'GreenHue', defaultAmount: 1 },
  { label: 'Green Saturation', parameter: 'GreenSaturation', defaultAmount: 1 },
  { label: 'Blue Hue', parameter: 'BlueHue', defaultAmount: 1 },
  { label: 'Blue Saturation', parameter: 'BlueSaturation', defaultAmount: 1 },
  // B&W Mixer
  { label: 'B&W — Red', parameter: 'GrayMixerRed', defaultAmount: 1 },
  { label: 'B&W — Orange', parameter: 'GrayMixerOrange', defaultAmount: 1 },
  { label: 'B&W — Yellow', parameter: 'GrayMixerYellow', defaultAmount: 1 },
  { label: 'B&W — Green', parameter: 'GrayMixerGreen', defaultAmount: 1 },
  { label: 'B&W — Aqua', parameter: 'GrayMixerAqua', defaultAmount: 1 },
  { label: 'B&W — Blue', parameter: 'GrayMixerBlue', defaultAmount: 1 },
  { label: 'B&W — Purple', parameter: 'GrayMixerPurple', defaultAmount: 1 },
  { label: 'B&W — Magenta', parameter: 'GrayMixerMagenta', defaultAmount: 1 },
  { label: 'B&W — Auto', parameter: 'AutoGrayscaleMix', defaultAmount: 1 },
  // Color Grading
  { label: 'Color Grading Blend', parameter: 'ColorGradeBlending', defaultAmount: 1 },
  { label: 'Shadow Tint', parameter: 'ShadowTint', defaultAmount: 1 },
  { label: 'Split Toning Balance', parameter: 'SplitToningBalance', defaultAmount: 1 },
  // Detail
  { label: 'Sharpness', parameter: 'Sharpness', defaultAmount: 1 },
  { label: 'Sharpening', parameter: 'Sharpening', defaultAmount: 1 },
  { label: 'Sharpen Radius', parameter: 'SharpenRadius', defaultAmount: 1 },
  { label: 'Sharpen Detail', parameter: 'SharpenDetail', defaultAmount: 1 },
  { label: 'Sharpen Edge Masking', parameter: 'SharpenEdgeMasking', defaultAmount: 1 },
  // Noise Reduction
  { label: 'Luminance NR Smoothing', parameter: 'LuminanceSmoothing', defaultAmount: 1 },
  { label: 'Luminance NR Contrast', parameter: 'LuminanceNoiseReductionContrast', defaultAmount: 1 },
  { label: 'Luminance NR Detail', parameter: 'LuminanceNoiseReductionDetail', defaultAmount: 1 },
  { label: 'Color NR', parameter: 'ColorNoiseReduction', defaultAmount: 1 },
  { label: 'Color NR Detail', parameter: 'ColorNoiseReductionDetail', defaultAmount: 1 },
  { label: 'Color NR Smoothness', parameter: 'ColorNoiseReductionSmoothness', defaultAmount: 1 },
  // Lens Corrections
  { label: 'Lens Profile', parameter: 'LensProfileEnable', defaultAmount: 1 },
  { label: 'Distortion Scale', parameter: 'LensProfileDistortionScale', defaultAmount: 1 },
  { label: 'Vignetting Scale', parameter: 'LensProfileVignettingScale', defaultAmount: 1 },
  { label: 'Distortion Correction', parameter: 'CorrectionAmount', defaultAmount: 1 },
  { label: 'Defringe Green', parameter: 'DefringeGreenAmount', defaultAmount: 1 },
  { label: 'Defringe Purple', parameter: 'DefringePurpleAmount', defaultAmount: 1 },
  { label: 'Auto Lateral CA', parameter: 'AutoLateralCA', defaultAmount: 1 },
  // Effects
  { label: 'Vignette Amount', parameter: 'VignetteAmount', defaultAmount: 1 },
  { label: 'Post-Crop Vignette', parameter: 'PostCropVignetteAmount', defaultAmount: 1 },
  { label: 'Vignette Feather', parameter: 'PostCropVignetteFeather', defaultAmount: 1 },
  { label: 'Vignette Highlight Contrast', parameter: 'PostCropVignetteHighlightContrast', defaultAmount: 1 },
  { label: 'Vignette Midpoint', parameter: 'PostCropVignetteMidpoint', defaultAmount: 1 },
  { label: 'Vignette Roundness', parameter: 'PostCropVignetteRoundness', defaultAmount: 1 },
  { label: 'Grain', parameter: 'Grain', defaultAmount: 1 },
  { label: 'Grain Amount', parameter: 'GrainAmount', defaultAmount: 1 },
  { label: 'Grain Frequency', parameter: 'GrainFrequency', defaultAmount: 1 },
  { label: 'Grain Size', parameter: 'GrainSize', defaultAmount: 1 },
  // Crop
  { label: 'Crop Top', parameter: 'cropTop', defaultAmount: 1 },
  { label: 'Crop Bottom', parameter: 'cropBottom', defaultAmount: 1 },
  { label: 'Crop Left', parameter: 'cropLeft', defaultAmount: 1 },
  { label: 'Crop Right', parameter: 'cropRight', defaultAmount: 1 },
  { label: 'Straighten Angle', parameter: 'straightenAngle', defaultAmount: 1 },
  { label: 'Perspective Upright', parameter: 'PerspectiveUpright', defaultAmount: 1 },
  // HDR
  { label: 'HDR Edit Mode', parameter: 'HDREditMode', defaultAmount: 1 },
  { label: 'HDR Max Value', parameter: 'HDRMaxValue', defaultAmount: 1 },
  { label: 'Visualize HDR Ranges', parameter: 'visualizeHDRRanges', defaultAmount: 1 },
  { label: 'Preview SDR Display', parameter: 'previewForSDRDisplay', defaultAmount: 1 },
  { label: 'SDR Blend', parameter: 'SDRBlend', defaultAmount: 1 },
  { label: 'SDR Brightness', parameter: 'SDRBrightness', defaultAmount: 1 },
  { label: 'SDR Clarity', parameter: 'SDRClarity', defaultAmount: 1 },
  { label: 'SDR Contrast', parameter: 'SDRContrast', defaultAmount: 1 },
  { label: 'SDR Highlights', parameter: 'SDRHighlights', defaultAmount: 1 },
  { label: 'SDR Shadows', parameter: 'SDRShadows', defaultAmount: 1 },
  { label: 'SDR Whites', parameter: 'SDRWhites', defaultAmount: 1 },
  // Calibration
  { label: 'Camera Profile', parameter: 'CameraProfile', defaultAmount: 1 },
  { label: 'Depth Correction', parameter: 'DepthCorrectionAmount', defaultAmount: 1 },
  { label: 'Depth Source', parameter: 'DepthSource', defaultAmount: 1 },
  // Enhance
  { label: 'Denoise', parameter: 'EnhanceDenoise', defaultAmount: 1 },
  { label: 'Denoise Amount', parameter: 'EnhanceDenoiseAmount', defaultAmount: 1 },
  { label: 'Raw Details', parameter: 'EnhanceRawDetails', defaultAmount: 1 },
  { label: 'Super Resolution', parameter: 'EnhanceSuperResolution', defaultAmount: 1 },
  // Lens Blur
  { label: 'Lens Blur Active', parameter: 'LensBlur.Active', defaultAmount: 1 },
  { label: 'Lens Blur Amount', parameter: 'LensBlur.BlurAmount', defaultAmount: 1 },
  { label: 'Lens Blur Cat Eye', parameter: 'LensBlur.CatEyeAmount', defaultAmount: 1 },
  { label: 'Lens Blur Highlights', parameter: 'LensBlur.HighlightsBoost', defaultAmount: 1 },
  { label: 'Lens Blur Overlay', parameter: 'LensBlur.ShowOverlay', defaultAmount: 1 },
  // Point Color
  { label: 'Point Color Hue Shift', parameter: 'PointColorHueShift', defaultAmount: 1 },
  { label: 'Point Color Lum Scale', parameter: 'PointColorLumScale', defaultAmount: 1 },
  { label: 'Point Color Range', parameter: 'PointColorRangeAmount', defaultAmount: 1 },
  { label: 'Point Color Sat Scale', parameter: 'PointColorSatScale', defaultAmount: 1 },
  { label: 'Point Color Visualize Range', parameter: 'PointColorVisualizeRange', defaultAmount: 1 },
  // Look & Presets
  { label: 'Look Amount', parameter: 'Look.Amount', defaultAmount: 1 },
  { label: 'Override Look Vignette', parameter: 'OverrideLookVignette', defaultAmount: 1 },
  // Local Adjustments
  { label: 'Local Blacks', parameter: 'LocalBlacks2012', defaultAmount: 1 },
  { label: 'Local Clarity', parameter: 'LocalClarity2012', defaultAmount: 1 },
  { label: 'Local Contrast', parameter: 'LocalContrast2012', defaultAmount: 1 },
  { label: 'Local Tone Curve Saturation', parameter: 'LocalCurveRefineSaturation', defaultAmount: 1 },
  { label: 'Local Defringe', parameter: 'LocalDefringe', defaultAmount: 1 },
  { label: 'Local Dehaze', parameter: 'LocalDehaze', defaultAmount: 1 },
  { label: 'Local Exposure', parameter: 'LocalExposure2012', defaultAmount: 0.1 },
  { label: 'Local Grain', parameter: 'LocalGrain', defaultAmount: 1 },
  { label: 'Local Highlights', parameter: 'LocalHighlights2012', defaultAmount: 1 },
  { label: 'Local Luminance Noise', parameter: 'LocalLuminanceNoise', defaultAmount: 1 },
  { label: 'Local Moiré', parameter: 'LocalMoire', defaultAmount: 1 },
  { label: 'Local Saturation', parameter: 'LocalSaturation', defaultAmount: 1 },
  { label: 'Local Shadows', parameter: 'LocalShadows2012', defaultAmount: 1 },
  { label: 'Local Sharpness', parameter: 'LocalSharpness', defaultAmount: 1 },
  { label: 'Local Temperature', parameter: 'LocalTemperature', defaultAmount: 100 },
  { label: 'Local Texture', parameter: 'LocalTexture', defaultAmount: 1 },
  { label: 'Local Tint', parameter: 'LocalTint', defaultAmount: 1 },
  { label: 'Local Whites', parameter: 'LocalWhites2012', defaultAmount: 1 },
]

const ACTIONS = [
  { label: 'Next Photo', action: 'nextPhoto' },
  { label: 'Previous Photo', action: 'previousPhoto' },
  { label: 'Go Back', action: 'goBack' },
  { label: 'Go Forward', action: 'goForward' },
  { label: 'Select All', action: 'selectAll' },
  { label: 'Select None', action: 'selectNone' },
  { label: 'Toggle Before/After', action: 'toggleBeforeAfter' },
  { label: 'Zoom In', action: 'zoomIn' },
  { label: 'Zoom Out', action: 'zoomOut' },
  { label: 'Toggle Zoom', action: 'toggleZoom' },
  { label: 'Zoom In Some', action: 'zoomInSome' },
  { label: 'Zoom Out Some', action: 'zoomOutSome' },
  { label: 'Zoom to Fit', action: 'zoomToFit' },
  { label: 'Zoom to Fill', action: 'zoomToFill' },
  { label: 'Zoom 1:1', action: 'zoomToOneToOne' },
  { label: 'Auto Tone', action: 'setAutoTone' },
  { label: 'Toggle HDR', action: 'toggleHDR' },
  { label: 'Toggle B&W', action: 'toggleBlackAndWhite' },
  { label: 'Reset All', action: 'resetAllDevelopAdjustments' },
  { label: 'Reset to Open', action: 'resetToOpen' },
  { label: 'Reset Crop', action: 'resetCrop' },
  { label: 'Undo', action: 'undo' },
  { label: 'Redo', action: 'redo' },
  { label: 'Rating 0', action: 'rating0' },
  { label: 'Rating 1', action: 'rating1' },
  { label: 'Rating 2', action: 'rating2' },
  { label: 'Rating 3', action: 'rating3' },
  { label: 'Rating 4', action: 'rating4' },
  { label: 'Rating 5', action: 'rating5' },
  { label: 'Rating +', action: 'ratingIncrease' },
  { label: 'Rating −', action: 'ratingDecrease' },
  { label: 'Flag Pick', action: 'flagPick' },
  { label: 'Flag Reject', action: 'flagReject' },
  { label: 'Flag Unflag', action: 'flagUnflag' },
  { label: 'Flag Pick Toggle', action: 'flagPickToggle' },
  { label: 'Flag Reject Toggle', action: 'flagRejectToggle' },
  { label: 'Color Red', action: 'colorLabelRed' },
  { label: 'Color Yellow', action: 'colorLabelYellow' },
  { label: 'Color Green', action: 'colorLabelGreen' },
  { label: 'Color Blue', action: 'colorLabelBlue' },
  { label: 'Color Purple', action: 'colorLabelPurple' },
  { label: 'Color None', action: 'colorLabelNone' },
  { label: 'Rotate Left', action: 'rotateLeft' },
  { label: 'Rotate Right', action: 'rotateRight' },
  { label: 'Flip Horizontal', action: 'flipHorizontal' },
  { label: 'Flip Vertical', action: 'flipVertical' },
  { label: 'Copy Settings', action: 'copyEditSettings' },
  { label: 'Paste Settings', action: 'pasteEditSettings' },
  { label: 'Show Clipping', action: 'showClipping' },
  { label: 'Export', action: 'exportWithPrevious' },
  { label: 'Edit in Photoshop', action: 'editInPhotoshop' },
  { label: 'Duplicate Photo', action: 'duplicatePhoto' },
  { label: 'Reset Spot Removal', action: 'resetSpotRemoval' },
  { label: 'Reset Redeye', action: 'resetRedeye' },
  { label: 'Rotate Aspect Ratio', action: 'rotateAspectRatio' },
  { label: 'Toggle Constrain Aspect Ratio', action: 'toggleConstrainAspectRatio' },
  { label: 'Export Dialog', action: 'openExport' },
  { label: 'Enhance Dialog', action: 'openEnhance' },
  { label: 'HDR Merge', action: 'openHDRMerge' },
  { label: 'Panorama Merge', action: 'openPanoramaMerge' },
  { label: 'HDR Panorama Merge', action: 'openHDRPanoramaMerge' },
  { label: 'Clear Search', action: 'clearSearch' },
  { label: 'Clear Filters', action: 'clearFilters' },
  { label: 'Toggle Filters', action: 'showFilters' },
  { label: 'Open Preferences', action: 'openPreferences' },
  { label: 'Show Copy Settings Dialog', action: 'showCopyEditSettings' },
  { label: 'Flag +', action: 'flagIncrease' },
  { label: 'Flag −', action: 'flagDecrease' },
  { label: 'Delete All Masks', action: 'deleteAllMasks' },
]

const waitForMidiEvent = (input, type, signal) => {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const handler = (data) => {
      input.removeListener(type, handler)
      signal?.removeEventListener('abort', onAbort)
      resolve(data)
    }

    const onAbort = () => {
      input.removeListener(type, handler)
      reject(new DOMException('Aborted', 'AbortError'))
    }

    signal?.addEventListener('abort', onAbort)
    input.on(type, handler)
  })
}

const isCcDuplicate = (mappings, channel, controller) => {
  return mappings.some(
    (mapping) =>
      (mapping.type === 'cc_relative' || mapping.type === 'cc_absolute') &&
      mapping.channel === channel &&
      mapping.control === controller,
  )
}

const isNoteDuplicate = (mappings, channel, note) => {
  return mappings.some((mapping) => {
    if (mapping.channel !== channel) return false

    if (mapping.type === 'note_on') return mapping.control === note
    if (mapping.type === 'note_adjust') return mapping.control === note || mapping.controlAlternate === note

    return false
  })
}

const promptForAmount = async (adjustment) => {
  const { amount } = await prompts({
    type: 'text',
    name: 'amount',
    message: `Step amount for ${adjustment.label}`,
    initial: String(adjustment.defaultAmount),
    validate: (value) => {
      const parsed = Number.parseFloat(value)

      return !Number.isNaN(parsed) && parsed > 0 ? true : 'Must be a positive number'
    },
  })

  if (amount === undefined) return null

  return Number.parseFloat(amount)
}

const captureKnob = async (input, mappings, adjustment, knobType, signal) => {
  try {
    while (true) {
      console.log('Waiting for knob turn...')
      const eventData = await waitForMidiEvent(input, 'cc', signal)

      if (isCcDuplicate(mappings, eventData.channel, eventData.controller)) {
        console.log(
          `Controller ${eventData.controller} on channel ${eventData.channel} is already in use. Try a different knob.`,
        )
        continue
      }

      const { confirmed } = await prompts({
        type: 'confirm',
        name: 'confirmed',
        message: `Captured controller ${eventData.controller} on channel ${eventData.channel}. Confirm?`,
        initial: true,
      })

      if (confirmed === undefined) return null
      if (!confirmed) continue

      const amount = await promptForAmount(adjustment)

      if (amount === null) continue

      return {
        type: knobType,
        channel: eventData.channel,
        control: eventData.controller,
        parameter: adjustment.parameter,
        amount,
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') return null
    throw error
  }
}

const captureNotePair = async (input, mappings, adjustment, signal) => {
  try {
    while (true) {
      let increaseNote

      while (true) {
        console.log('Press the INCREASE button...')
        const eventData = await waitForMidiEvent(input, 'noteon', signal)

        if (isNoteDuplicate(mappings, eventData.channel, eventData.note)) {
          console.log(
            `Note ${eventData.note} on channel ${eventData.channel} is already in use. Try a different button.`,
          )
          continue
        }

        increaseNote = eventData

        console.log(`Captured increase: note ${increaseNote.note} on channel ${increaseNote.channel}`)

        break
      }

      let decreaseNote

      while (true) {
        console.log('Press the DECREASE button...')
        const eventData = await waitForMidiEvent(input, 'noteon', signal)

        if (eventData.channel !== increaseNote.channel) {
          console.log(`Decrease button must be on channel ${increaseNote.channel} (same as increase). Try again.`)
          continue
        }

        if (eventData.note === increaseNote.note) {
          console.log('Decrease button must be different from increase button. Try again.')
          continue
        }

        if (isNoteDuplicate(mappings, eventData.channel, eventData.note)) {
          console.log(
            `Note ${eventData.note} on channel ${eventData.channel} is already in use. Try a different button.`,
          )
          continue
        }

        decreaseNote = eventData

        console.log(`Captured decrease: note ${decreaseNote.note} on channel ${decreaseNote.channel}`)

        break
      }

      const { confirmed } = await prompts({
        type: 'confirm',
        name: 'confirmed',
        message: `Captured: increase is note ${increaseNote.note}, decrease is note ${decreaseNote.note} on channel ${increaseNote.channel}. Confirm?`,
        initial: true,
      })

      if (confirmed === undefined) return null
      if (!confirmed) continue

      const amount = await promptForAmount(adjustment)

      if (amount === null) continue

      return {
        type: 'note_adjust',
        channel: increaseNote.channel,
        control: increaseNote.note,
        controlAlternate: decreaseNote.note,
        parameter: adjustment.parameter,
        amount,
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') return null
    throw error
  }
}

const DONE = Symbol('done')

const pickFromList = async (remaining, thing) => {
  const choices = [
    { title: 'None (finish mapping)', value: DONE },
    ...remaining.map((item) => ({ title: item.label, value: item })),
  ]

  const { selected } = await prompts({
    type: 'autocomplete',
    name: 'selected',
    message: `Search for ${thing} to map (${remaining.length} available)`,
    choices,
    suggest: (searchQuery, suggestChoices) => {
      const query = searchQuery.toLowerCase()

      if (query === '') return suggestChoices

      return suggestChoices.filter((choice) => choice.title.toLowerCase().includes(query))
    },
  })

  return selected
}

const mapParameters = async (input, mappings, getSignal) => {
  const remaining = [...PARAMETERS]

  while (remaining.length > 0) {
    const adjustment = await pickFromList(remaining, 'a parameter')

    if (adjustment === undefined) return false
    if (adjustment === DONE) return true

    const { method } = await prompts({
      type: 'select',
      name: 'method',
      message: `How to adjust ${adjustment.label}?`,
      choices: [
        { title: 'Knob (Relative)', value: 'knob_relative' },
        { title: 'Knob (Absolute)', value: 'knob_absolute' },
        { title: 'Note Pair', value: 'note_pair' },
        { title: 'Back', value: 'back' },
      ],
    })

    if (method === undefined) return false
    if (method === 'back') continue

    if (method === 'knob_relative' || method === 'knob_absolute') {
      const knobType = method === 'knob_relative' ? 'cc_relative' : 'cc_absolute'
      const signal = getSignal()
      const result = await captureKnob(input, mappings, adjustment, knobType, signal)

      if (result === null) {
        if (signal.aborted) continue
        return false
      }

      mappings.push(result)
    } else {
      const signal = getSignal()
      const result = await captureNotePair(input, mappings, adjustment, signal)

      if (result === null) {
        if (signal.aborted) continue
        return false
      }

      mappings.push(result)
    }

    remaining.splice(remaining.indexOf(adjustment), 1)
  }

  return true
}

const mapActions = async (input, mappings, getSignal) => {
  const remaining = [...ACTIONS]

  while (remaining.length > 0) {
    const action = await pickFromList(remaining, 'an action')

    if (action === undefined) return false
    if (action === DONE) return true

    let eventData
    const signal = getSignal()

    try {
      while (true) {
        console.log('Waiting for button press...')
        eventData = await waitForMidiEvent(input, 'noteon', signal)

        if (isNoteDuplicate(mappings, eventData.channel, eventData.note)) {
          console.log(
            `Note ${eventData.note} on channel ${eventData.channel} is already in use. Try a different button.`,
          )
          continue
        }

        const { confirmed } = await prompts({
          type: 'confirm',
          name: 'confirmed',
          message: `Captured note ${eventData.note} on channel ${eventData.channel}. Confirm?`,
          initial: true,
        })

        if (confirmed === undefined) return false
        if (!confirmed) continue

        break
      }
    } catch (error) {
      if (error.name === 'AbortError') continue
      throw error
    }

    mappings.push({
      type: 'note_on',
      channel: eventData.channel,
      control: eventData.note,
      action: action.action,
    })

    remaining.splice(remaining.indexOf(action), 1)
  }

  return true
}

const generateEnvContent = (inputDevice, webSocketUrl, outputDevice, mappings) => {
  const lines = [`MIDI_INPUT_DEVICE=${inputDevice}`, `LIGHTROOM_WS_URL=${webSocketUrl}`]

  if (outputDevice) {
    lines.push(`MIDI_OUTPUT_DEVICE=${outputDevice}`)
  }

  for (const [index, mapping] of mappings.entries()) {
    switch (mapping.type) {
      case 'cc_relative': {
        lines.push(
          `MIDI_MAP_${index + 1}=CC_RELATIVE,${mapping.channel},${mapping.control},${mapping.amount.toFixed(2)},${mapping.parameter}`,
        )
        break
      }
      case 'cc_absolute': {
        lines.push(
          `MIDI_MAP_${index + 1}=CC_ABSOLUTE,${mapping.channel},${mapping.control},${mapping.amount.toFixed(2)},${mapping.parameter}`,
        )
        break
      }
      case 'note_adjust': {
        lines.push(
          `MIDI_MAP_${index + 1}=NOTE_ADJUST,${mapping.channel},${mapping.control},${mapping.controlAlternate},${mapping.amount.toFixed(2)},${mapping.parameter}`,
        )
        break
      }
      default: {
        lines.push(`MIDI_MAP_${index + 1}=NOTE_ON,${mapping.channel},${mapping.control},,${mapping.action}`)
        break
      }
    }
  }

  return lines.join('\n') + '\n'
}

const selectDevice = async () => {
  const inputs = listInputs()

  if (inputs.length === 0) {
    console.log('No MIDI input devices found. Connect a MIDI device and try again.')
    return null
  }

  const { device } = await prompts({
    type: 'select',
    name: 'device',
    message: 'Select MIDI device',
    choices: inputs.map((name) => ({ title: name, value: name })),
  })

  if (device === undefined) {
    console.log('Initialization cancelled.')
    return null
  }

  return device
}

const promptWebSocketUrl = async () => {
  const { webSocketUrl } = await prompts({
    type: 'text',
    name: 'webSocketUrl',
    message: 'Lightroom WebSocket URL',
    initial: 'ws://127.0.0.1:7682',
    validate: (value) => (URL.canParse(value) ? true : 'Must be a valid URL'),
  })

  if (webSocketUrl === undefined) {
    console.log('Initialization cancelled.')
    return null
  }

  return webSocketUrl
}

const selectOutputDevice = async (mappings) => {
  const hasAbsoluteMappings = mappings.some((mapping) => mapping.type === 'cc_absolute')

  if (!hasAbsoluteMappings) return null

  const outputs = listOutputs()

  if (outputs.length === 0) return null

  const { device } = await prompts({
    type: 'select',
    name: 'device',
    message: 'Select MIDI output device for knob centering',
    choices: [...outputs.map((name) => ({ title: name, value: name })), { title: 'Skip (no feedback)', value: null }],
  })

  if (device === undefined) {
    console.log('Initialization cancelled.')
    return
  }

  return device
}

export const init = async (configPath) => {
  const filePath = path.resolve(process.cwd(), configPath || '.env')

  let inputDevice
  let webSocketUrl
  let outputDevice
  let mappings = []

  if (fs.existsSync(filePath)) {
    loadEnv(configPath)

    const existingInputDevice = process.env.MIDI_INPUT_DEVICE || null
    const existingWebSocketUrl = process.env.LIGHTROOM_WS_URL || 'ws://127.0.0.1:7682'
    const existingOutputDevice = process.env.MIDI_OUTPUT_DEVICE || null
    const existingMappings = parseEnv(process.env)

    console.log(`\nExisting configuration found at '${filePath}'`)
    console.log(`  Input device:  ${existingInputDevice || 'none'}`)
    console.log(`  Output device: ${existingOutputDevice || 'none'}`)
    console.log(`  WebSocket:     ${existingWebSocketUrl}`)
    console.log(`  Mappings:      ${existingMappings.length}\n`)

    const { action } = await prompts({
      type: 'select',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { title: 'Continue editing', value: 'continue' },
        { title: 'Start fresh', value: 'fresh' },
      ],
    })

    if (action === undefined) {
      console.log('Initialization cancelled.')
      return
    }

    if (action === 'continue') {
      inputDevice = existingInputDevice
      webSocketUrl = existingWebSocketUrl
      outputDevice = existingOutputDevice
      mappings = existingMappings
    }
  }

  if (!inputDevice) {
    inputDevice = await selectDevice()
    if (inputDevice === null) return
  }

  let input

  try {
    input = new easymidi.Input(inputDevice)
  } catch (error) {
    console.log(`Failed to open MIDI device '${inputDevice}': ${error.message}`)
    return
  }

  let currentAbortController
  let onAbort

  try {
    console.log('\n--- Parameter Mappings ---\n')

    onAbort = () => {
      currentAbortController?.abort()
    }
    process.on('SIGINT', onAbort)

    const getSignal = () => {
      currentAbortController = new AbortController()
      return currentAbortController.signal
    }

    const parametersResult = await mapParameters(input, mappings, getSignal)

    if (!parametersResult) {
      console.log('Initialization cancelled.')
      return
    }

    console.log('\n--- Action Mappings ---\n')

    const actionsResult = await mapActions(input, mappings, getSignal)

    if (!actionsResult) {
      console.log('Initialization cancelled.')
      return
    }

    if (mappings.length === 0) {
      console.log('No mappings were configured. Initialization cancelled.')
      return
    }

    console.log('\n--- System ---\n')

    if (webSocketUrl === undefined) {
      webSocketUrl = await promptWebSocketUrl()

      if (webSocketUrl === null) return
    }

    if (outputDevice === undefined) {
      outputDevice = await selectOutputDevice(mappings)

      if (outputDevice === undefined) return
    }

    const environmentContent = generateEnvContent(inputDevice, webSocketUrl, outputDevice, mappings)

    fs.writeFileSync(filePath, environmentContent, { encoding: 'utf8' })

    console.log(
      `\nConfiguration saved with ${mappings.length} mapping${mappings.length === 1 ? '' : 's'} at '${filePath}'`,
    )
  } finally {
    if (onAbort) {
      process.removeListener('SIGINT', onAbort)
    }
    input.close()
  }
}
