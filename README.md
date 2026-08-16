# lightroom-midi-controller

[![Test](https://github.com/electerious/lightroom-midi-controller/actions/workflows/test.yml/badge.svg)](https://github.com/electerious/lightroom-midi-controller/actions/workflows/test.yml)

Control Adobe Lightroom using a MIDI controller. Map knobs to parameter adjustments and buttons to actions, then edit photos without touching your mouse or keyboard.

> 💡 This project is not affiliated with Adobe Systems Incorporated in any way. It is an independent tool that connects MIDI hardware to the Lightroom External Controller API.

## Contents

- [Description](#description)
- [Requirements](#requirements)
- [Usage](#usage)
- [Configuration](#configuration)
- [Options](#options)
- [Examples](#examples)
- [Miscellaneous](#miscellaneous)

## Description

`lightroom-midi-controller` bridges MIDI hardware and Adobe Lightroom by translating MIDI events into Lightroom adjustments over WebSocket. Turn a knob on your controller to increase exposure, press a button to jump to the next photo — all without touching your mouse or keyboard.

The tool listens for MIDI CC (continuous control) and NOTE ON events from a configured device. When a mapped control is turned or pressed, the corresponding action is sent to Lightroom through its External Controller API. An interactive setup wizard guides you through mapping every knob and button, so no manual config editing is required.

Using the External Controller API directly would require handling WebSocket connections, JSON messages, and the API's protocol yourself. `lightroom-midi-controller` handles all of that, letting you focus on editing.

## Requirements

- Adobe Lightroom (v8.4 or newer)
- [Node.js](https://nodejs.org/en/) (v24.15.0 or newer)
- [npm](https://npmjs.com) (v10 or newer)
- A MIDI controller with knobs, buttons, or both

## Usage

### 1. Start Lightroom CC

Launch Adobe Lightroom on your computer.

### 2. Enable the External Controller API

Enable the External Controller API in Lightroom CC by going to `Preferences > Interface` and checking the box for "Enable external controllers".

### 3. Connect your MIDI controller

Plug in your MIDI controller and make sure it's recognized by your system.

### 4. Create a configuration

Run the interactive setup wizard to map your controller's knobs and buttons to Lightroom parameters and actions:

```bash
npx lightroom-midi-controller init
```

The wizard prompts you to select your MIDI device, then guides you through turning each knob and pressing each button to create the mappings. A `.env` file is created in your working directory with the result.

### 5. Start the controller

Start the controller by running the following command in your terminal:

```bash
npx lightroom-midi-controller
```

You should now see a Lightroom dialog asking you to allow the connection from the external controller. Click "Pair" to grant access. Once paired, your mapped knobs and buttons will control Lightroom immediately.

## Configuration

The `.env` file created by `npx lightroom-midi-controller init` stores the MIDI device name, Lightroom WebSocket URL, and all control mappings:

```
MIDI_INPUT_DEVICE=Arturia KeyLab
LIGHTROOM_WS_URL=ws://127.0.0.1:7682
MIDI_OUTPUT_DEVICE=Arturia KeyLab
MIDI_MAP_1=CC_RELATIVE,0,7,0.10,Exposure2012
MIDI_MAP_2=CC_ABSOLUTE,0,8,1.00,Contrast2012
MIDI_MAP_3=NOTE_ON,0,60,,nextPhoto
```

### Mapping Format

Each `MIDI_MAP_N` line defines one mapped control:

#### Knob Mappings

```
MIDI_MAP_N=CC_RELATIVE,<channel>,<controller>,<step>,<parameter>
MIDI_MAP_N=CC_ABSOLUTE,<channel>,<controller>,<step>,<parameter>
```

| Field         | Description                                              |
| ------------- | -------------------------------------------------------- |
| `CC_RELATIVE` | Use `CC_RELATIVE` for relative (endless) rotary encoders |
| `CC_ABSOLUTE` | Use `CC_ABSOLUTE` for absolute (0–127) knobs             |
| `channel`     | MIDI channel (0–15)                                      |
| `controller`  | MIDI CC number (0–127)                                   |
| `step`        | Amount to adjust per tick (e.g. `0.10` for exposure)     |
| `parameter`   | Lightroom parameter name (e.g. `Exposure2012`)           |

This format is used when the interactive wizard maps a single knob to a parameter.

**`CC_RELATIVE` (Relative Encoders):** Use this when your controller sends a separate CC message per detent — typically value `1` for one step right and `127` for one step left. Every tick adjusts the Lightroom parameter by the configured step amount. The value is interpreted as a direction command, not a position.

**`CC_ABSOLUTE` (Absolute Knobs):** Use this when your controller reports the knob's physical position (0–127) instead of discrete ticks. The software computes the turn direction by comparing consecutive values and handles wrap-around when the value passes 127 or 0. This avoids value jumping — the knob acts as a relative control regardless of its physical position.

#### Note Pair Mappings

```
MIDI_MAP_N=NOTE_ADJUST,<channel>,<noteIncrease>,<noteDecrease>,<step>,<parameter>
```

| Field          | Description                                           |
| -------------- | ----------------------------------------------------- |
| `NOTE_ADJUST`  | Always `NOTE_ADJUST` for note pair mappings           |
| `channel`      | MIDI channel (0–15)                                   |
| `noteIncrease` | MIDI note number for increasing the parameter (0–127) |
| `noteDecrease` | MIDI note number for decreasing the parameter (0–127) |
| `step`         | Amount to adjust per press (e.g. `0.10` for exposure) |
| `parameter`    | Lightroom parameter name (e.g. `Exposure2012`)        |

This format is used when the interactive wizard maps two buttons (increase/decrease) to a single parameter instead of a continuous knob.

#### Single Note Mappings

```
MIDI_MAP_N=NOTE_ON,<channel>,<note>,<action>
```

| Field     | Description                              |
| --------- | ---------------------------------------- |
| `NOTE_ON` | Always `NOTE_ON` for button mappings     |
| `channel` | MIDI channel (0–15)                      |
| `note`    | MIDI note number (0–127)                 |
| `action`  | Lightroom action name (e.g. `nextPhoto`) |

Note that button mappings leave the fourth field (step) empty since actions don't use it.

### Supported Parameters

Knobs can be mapped to any adjustable Lightroom parameter. The interactive wizard offers the most common ones, but any parameter supported by the Lightroom External Controller API works:

#### Light

| Parameter        | Description             |
| ---------------- | ----------------------- |
| `Exposure2012`   | Adjusts the exposure    |
| `Contrast2012`   | Adjusts the contrast    |
| `Highlights2012` | Adjusts the highlights  |
| `Shadows2012`    | Adjusts the shadows     |
| `Whites2012`     | Adjusts the whites      |
| `Blacks2012`     | Adjusts the black point |

#### Color

| Parameter      | Description                   |
| -------------- | ----------------------------- |
| `Temperature`  | Adjusts the color temperature |
| `Tint`         | Adjusts the tint              |
| `Saturation`   | Adjusts the saturation        |
| `Vibrance`     | Adjusts the vibrance          |
| `WhiteBalance` | Sets the white balance preset |

#### Presence

| Parameter     | Description         |
| ------------- | ------------------- |
| `Clarity2012` | Adjusts the clarity |
| `Dehaze`      | Adjusts the dehaze  |
| `Texture`     | Adjusts the texture |

#### Tone Curve

| Parameter               | Description                       |
| ----------------------- | --------------------------------- |
| `CurveRefineSaturation` | Adjusts the tone curve saturation |

#### HSL / Color Mixer

| Parameter                     | Description                             |
| ----------------------------- | --------------------------------------- |
| `HueAdjustmentRed`            | Adjusts the hue of red tones            |
| `HueAdjustmentOrange`         | Adjusts the hue of orange tones         |
| `HueAdjustmentYellow`         | Adjusts the hue of yellow tones         |
| `HueAdjustmentGreen`          | Adjusts the hue of green tones          |
| `HueAdjustmentAqua`           | Adjusts the hue of aqua tones           |
| `HueAdjustmentBlue`           | Adjusts the hue of blue tones           |
| `HueAdjustmentPurple`         | Adjusts the hue of purple tones         |
| `HueAdjustmentMagenta`        | Adjusts the hue of magenta tones        |
| `SaturationAdjustmentRed`     | Adjusts the saturation of red tones     |
| `SaturationAdjustmentOrange`  | Adjusts the saturation of orange tones  |
| `SaturationAdjustmentYellow`  | Adjusts the saturation of yellow tones  |
| `SaturationAdjustmentGreen`   | Adjusts the saturation of green tones   |
| `SaturationAdjustmentAqua`    | Adjusts the saturation of aqua tones    |
| `SaturationAdjustmentBlue`    | Adjusts the saturation of blue tones    |
| `SaturationAdjustmentPurple`  | Adjusts the saturation of purple tones  |
| `SaturationAdjustmentMagenta` | Adjusts the saturation of magenta tones |
| `LuminanceAdjustmentRed`      | Adjusts the luminance of red tones      |
| `LuminanceAdjustmentOrange`   | Adjusts the luminance of orange tones   |
| `LuminanceAdjustmentYellow`   | Adjusts the luminance of yellow tones   |
| `LuminanceAdjustmentGreen`    | Adjusts the luminance of green tones    |
| `LuminanceAdjustmentAqua`     | Adjusts the luminance of aqua tones     |
| `LuminanceAdjustmentBlue`     | Adjusts the luminance of blue tones     |
| `LuminanceAdjustmentPurple`   | Adjusts the luminance of purple tones   |
| `LuminanceAdjustmentMagenta`  | Adjusts the luminance of magenta tones  |
| `RedHue`                      | Adjusts the hue of red tones            |
| `RedSaturation`               | Adjusts the saturation of red tones     |
| `GreenHue`                    | Adjusts the hue of green tones          |
| `GreenSaturation`             | Adjusts the saturation of green tones   |
| `BlueHue`                     | Adjusts the hue of blue tones           |
| `BlueSaturation`              | Adjusts the saturation of blue tones    |

#### B&W Mixer

| Parameter          | Description                               |
| ------------------ | ----------------------------------------- |
| `GrayMixerRed`     | Adjusts the red channel in B&W mixing     |
| `GrayMixerOrange`  | Adjusts the orange channel in B&W mixing  |
| `GrayMixerYellow`  | Adjusts the yellow channel in B&W mixing  |
| `GrayMixerGreen`   | Adjusts the green channel in B&W mixing   |
| `GrayMixerAqua`    | Adjusts the aqua channel in B&W mixing    |
| `GrayMixerBlue`    | Adjusts the blue channel in B&W mixing    |
| `GrayMixerPurple`  | Adjusts the purple channel in B&W mixing  |
| `GrayMixerMagenta` | Adjusts the magenta channel in B&W mixing |
| `AutoGrayscaleMix` | Applies an automatic B&W mix              |

#### Color Grading

| Parameter            | Description                           |
| -------------------- | ------------------------------------- |
| `ColorGradeBlending` | Adjusts color grading blending amount |
| `ShadowTint`         | Adjusts the tint of shadows           |
| `SplitToningBalance` | Adjusts the split toning balance      |

#### Detail

| Parameter            | Description                         |
| -------------------- | ----------------------------------- |
| `Sharpness`          | Adjusts the sharpening amount       |
| `SharpenRadius`      | Adjusts the sharpening radius       |
| `SharpenDetail`      | Adjusts the sharpening detail       |
| `SharpenEdgeMasking` | Adjusts the sharpening edge masking |

#### Noise Reduction

| Parameter                         | Description                                 |
| --------------------------------- | ------------------------------------------- |
| `LuminanceSmoothing`              | Adjusts luminance noise reduction smoothing |
| `LuminanceNoiseReductionContrast` | Adjusts luminance noise reduction contrast  |
| `LuminanceNoiseReductionDetail`   | Adjusts luminance noise reduction detail    |
| `ColorNoiseReduction`             | Adjusts color noise reduction               |
| `ColorNoiseReductionDetail`       | Adjusts color noise reduction detail        |
| `ColorNoiseReductionSmoothness`   | Adjusts color noise reduction smoothness    |

#### Lens Corrections

| Parameter                    | Description                                               |
| ---------------------------- | --------------------------------------------------------- |
| `LensProfileEnable`          | Enables or disables the lens profile correction           |
| `LensProfileDistortionScale` | Adjusts the lens distortion correction scale              |
| `LensProfileVignettingScale` | Adjusts the lens vignetting correction scale              |
| `CorrectionAmount`           | Adjusts the distortion correction amount                  |
| `DefringeGreenAmount`        | Adjusts the green defringe amount                         |
| `DefringePurpleAmount`       | Adjusts the purple defringe amount                        |
| `AutoLateralCA`              | Toggles automatic lateral chromatic aberration correction |

#### Effects

| Parameter                           | Description                                |
| ----------------------------------- | ------------------------------------------ |
| `PostCropVignetteAmount`            | Adjusts the vignette amount after cropping |
| `PostCropVignetteFeather`           | Adjusts the vignette feather amount        |
| `PostCropVignetteHighlightContrast` | Adjusts the vignette highlight contrast    |
| `PostCropVignetteMidpoint`          | Adjusts the vignette midpoint              |
| `PostCropVignetteRoundness`         | Adjusts the vignette roundness             |
| `GrainAmount`                       | Adjusts the amount of grain                |
| `GrainFrequency`                    | Adjusts the frequency of grain             |
| `GrainSize`                         | Adjusts the size of grain                  |

#### Crop & Transform

| Parameter            | Description                                                                             |
| -------------------- | --------------------------------------------------------------------------------------- |
| `cropTop`            | Adjusts the crop from the top                                                           |
| `cropBottom`         | Adjusts the crop from the bottom                                                        |
| `cropLeft`           | Adjusts the crop from the left                                                          |
| `cropRight`          | Adjusts the crop from the right                                                         |
| `straightenAngle`    | Adjusts the straighten/crop angle                                                       |
| `PerspectiveUpright` | Adjusts perspective upright mode (0=Off, 1=Auto, 2=Full, 3=Level, 4=Vertical, 5=Guided) |

#### HDR

| Parameter              | Description                         |
| ---------------------- | ----------------------------------- |
| `HDREditMode`          | Toggles HDR edit mode (0=Off, 1=On) |
| `HDRMaxValue`          | Adjusts the HDR maximum value       |
| `visualizeHDRRanges`   | Toggles visualization of HDR ranges |
| `previewForSDRDisplay` | Toggles preview for SDR display     |
| `SDRBlend`             | Adjusts SDR blend amount            |
| `SDRBrightness`        | Adjusts SDR brightness              |
| `SDRClarity`           | Adjusts SDR clarity                 |
| `SDRContrast`          | Adjusts SDR contrast                |
| `SDRHighlights`        | Adjusts SDR highlights              |
| `SDRShadows`           | Adjusts SDR shadows                 |
| `SDRWhites`            | Adjusts SDR whites                  |

#### Calibration

| Parameter               | Description                         |
| ----------------------- | ----------------------------------- |
| `CameraProfile`         | Sets the camera profile             |
| `DepthCorrectionAmount` | Adjusts the depth correction amount |
| `DepthSource`           | Sets the depth source               |

#### Enhance

| Parameter                | Description                   |
| ------------------------ | ----------------------------- |
| `EnhanceDenoise`         | Toggles AI denoise            |
| `EnhanceDenoiseAmount`   | Adjusts the AI denoise amount |
| `EnhanceRawDetails`      | Toggles enhance raw details   |
| `EnhanceSuperResolution` | Toggles super resolution      |

#### Lens Blur

| Parameter                  | Description                                 |
| -------------------------- | ------------------------------------------- |
| `LensBlur.Active`          | Toggles the lens blur panel                 |
| `LensBlur.BlurAmount`      | Adjusts the lens blur amount                |
| `LensBlur.CatEyeAmount`    | Adjusts the cat eye blur amount             |
| `LensBlur.HighlightsBoost` | Adjusts the lens blur highlights boost      |
| `LensBlur.ShowOverlay`     | Toggles the lens blur overlay visualization |

#### Point Color

| Parameter                  | Description                                              |
| -------------------------- | -------------------------------------------------------- |
| `PointColorHueShift`       | Adjusts the hue shift in the targeted color range        |
| `PointColorLumScale`       | Adjusts the luminance scale in the targeted color range  |
| `PointColorRangeAmount`    | Adjusts the range of the targeted color                  |
| `PointColorSatScale`       | Adjusts the saturation scale in the targeted color range |
| `PointColorVisualizeRange` | Toggles visualization of the color range selection       |

#### Look & Presets

| Parameter              | Description                               |
| ---------------------- | ----------------------------------------- |
| `Look.Amount`          | Adjusts the look/preset amount            |
| `OverrideLookVignette` | Overrides the vignette from a look/preset |

#### Local Adjustments (Masking)

| Parameter                    | Description                             |
| ---------------------------- | --------------------------------------- |
| `LocalBlacks2012`            | Adjusts local blacks                    |
| `LocalClarity2012`           | Adjusts local clarity                   |
| `LocalContrast2012`          | Adjusts local contrast                  |
| `LocalCurveRefineSaturation` | Adjusts local tone curve saturation     |
| `LocalDefringe`              | Adjusts local defringe amount           |
| `LocalDehaze`                | Adjusts local dehaze                    |
| `LocalExposure2012`          | Adjusts local exposure                  |
| `LocalGrain`                 | Adjusts local grain                     |
| `LocalHighlights2012`        | Adjusts local highlights                |
| `LocalLuminanceNoise`        | Adjusts local luminance noise reduction |
| `LocalMoire`                 | Adjusts local moiré reduction           |
| `LocalSaturation`            | Adjusts local saturation                |
| `LocalShadows2012`           | Adjusts local shadows                   |
| `LocalSharpness`             | Adjusts local sharpness                 |
| `LocalTemperature`           | Adjusts local temperature               |
| `LocalTexture`               | Adjusts local texture                   |
| `LocalTint`                  | Adjusts local tint                      |
| `LocalWhites2012`            | Adjusts local whites                    |

Buttons can be mapped to these actions:

| Action                       | Description                                        |
| ---------------------------- | -------------------------------------------------- |
| `nextPhoto`                  | Go to next photo                                   |
| `previousPhoto`              | Go to previous photo                               |
| `goBack`                     | Navigate back                                      |
| `goForward`                  | Navigate forward                                   |
| `selectAll`                  | Select all photos                                  |
| `selectNone`                 | Deselect all photos                                |
| `toggleBeforeAfter`          | Toggle before/after view                           |
| `zoomIn`                     | Zoom in                                            |
| `zoomOut`                    | Zoom out                                           |
| `toggleZoom`                 | Toggle zoom                                        |
| `zoomInSome`                 | Zoom in one step                                   |
| `zoomOutSome`                | Zoom out one step                                  |
| `zoomToFit`                  | Zoom to fit                                        |
| `zoomToFill`                 | Zoom to fill                                       |
| `zoomToOneToOne`             | Zoom to 100%                                       |
| `setAutoTone`                | Apply auto tone                                    |
| `toggleHDR`                  | Toggle HDR on/off                                  |
| `toggleBlackAndWhite`        | Toggle B&W on/off                                  |
| `resetAllDevelopAdjustments` | Reset all adjustments                              |
| `resetToOpen`                | Revert to open state                               |
| `resetCrop`                  | Reset crop                                         |
| `undo`                       | Undo last operation                                |
| `redo`                       | Redo last operation                                |
| `rating0`                    | Set rating to 0                                    |
| `rating1`                    | Set rating to 1                                    |
| `rating2`                    | Set rating to 2                                    |
| `rating3`                    | Set rating to 3                                    |
| `rating4`                    | Set rating to 4                                    |
| `rating5`                    | Set rating to 5                                    |
| `ratingIncrease`             | Increase rating                                    |
| `ratingDecrease`             | Decrease rating                                    |
| `flagPick`                   | Set flag to picked                                 |
| `flagReject`                 | Set flag to rejected                               |
| `flagUnflag`                 | Clear flag                                         |
| `flagPickToggle`             | Toggle pick flag                                   |
| `flagRejectToggle`           | Toggle reject flag                                 |
| `colorLabelRed`              | Set color label to red                             |
| `colorLabelYellow`           | Set color label to yellow                          |
| `colorLabelGreen`            | Set color label to green                           |
| `colorLabelBlue`             | Set color label to blue                            |
| `colorLabelPurple`           | Set color label to purple                          |
| `colorLabelNone`             | Remove color label                                 |
| `rotateLeft`                 | Rotate 90° left                                    |
| `rotateRight`                | Rotate 90° right                                   |
| `flipHorizontal`             | Flip horizontally                                  |
| `flipVertical`               | Flip vertically                                    |
| `copyEditSettings`           | Copy edit settings                                 |
| `pasteEditSettings`          | Paste edit settings                                |
| `showClipping`               | Toggle clipping overlay                            |
| `exportWithPrevious`         | Export with last settings                          |
| `editInPhotoshop`            | Edit in Photoshop                                  |
| `duplicatePhoto`             | Duplicate current photo                            |
| `resetSpotRemoval`           | Clear all heal/remove adjustments                  |
| `resetRedeye`                | Clear all redeye removal adjustments               |
| `rotateAspectRatio`          | Rotate aspect ratio between portrait and landscape |
| `toggleConstrainAspectRatio` | Toggle aspect ratio constraint on/off              |
| `openExport`                 | Open the Export dialog                             |
| `openEnhance`                | Open the Enhance dialog                            |
| `openHDRMerge`               | Open the HDR Merge dialog                          |
| `openPanoramaMerge`          | Open the Panorama Merge dialog                     |
| `openHDRPanoramaMerge`       | Open the HDR Panorama Merge dialog                 |
| `clearSearch`                | Clear search criteria                              |
| `clearFilters`               | Clear search filters                               |
| `showFilters`                | Toggle search filters visibility                   |
| `openPreferences`            | Open the preferences dialog                        |
| `showCopyEditSettings`       | Show dialog for choosing Edit settings to copy     |
| `flagIncrease`               | Increase flag state                                |
| `flagDecrease`               | Decrease flag state                                |
| `deleteAllMasks`             | Delete all mask groups and components              |

Additional actions supported by the Lightroom External Controller API can also be used by manually editing the `.env` file.

## Options

### CLI Options

```
Usage: lightroom-midi-controller [options] [command]

Options:
  --verbose        Log every MIDI event and resulting action
  --config <path>  Path to .env config file
  -V, --version    Output the version number
  -h, --help       Display help for command

Commands:
  init             Create a .env file to configure MIDI mappings
  devices          List available MIDI devices
```

### Environment Variables

| Variable             | Description                               | Default               |
| -------------------- | ----------------------------------------- | --------------------- |
| `MIDI_INPUT_DEVICE`  | MIDI input device name                    | (required)            |
| `MIDI_OUTPUT_DEVICE` | MIDI output device for LED ring centering | (optional)            |
| `LIGHTROOM_WS_URL`   | Lightroom WebSocket URL                   | `ws://127.0.0.1:7682` |
| `MIDI_MAP_N`         | MIDI mapping definition (see above)       | —                     |

### Lightroom WS URL

Lightroom typically listens on port `7682`, but if that port is unavailable it falls back to a different one. The port Lightroom uses is saved in its `connections.json` file:

Mac: `~/Library/Application Support/Adobe/Lightroom CC/Connections`

Windows: `AppData\Local\Adobe\Lightroom CC\Connections`

## Examples

### Using a custom config file

Specify a different `.env` file to switch between controller profiles:

```bash
npx lightroom-midi-controller --config /path/to/.env.production
```

### Debugging with verbose output

Enable verbose logging to see every incoming MIDI event and the action it triggers:

```bash
npx lightroom-midi-controller --verbose
```

### Listing available devices

See which MIDI input and output devices are connected to your system:

```bash
npx lightroom-midi-controller devices
```

## Miscellaneous

### Known Issues

#### Knob Types: Relative vs. Absolute

MIDI controllers can report knob turns in two ways:

- **Relative encoders** send a direction command per tick (`1` = right, `127` = left). Use the `CC_RELATIVE` mapping type. These work out of the box without extra configuration.
- **Absolute knobs** report the knob's physical position (0–127). Use the `CC_ABSOLUTE` mapping type. The software derives the turn direction from consecutive values and handles wrap-around at the 0/127 boundary.

If your controller has an LED ring or motorized fader that can receive MIDI CC messages, set `MIDI_OUTPUT_DEVICE` in your `.env` file. The software will automatically center absolute knobs at position 64 on startup and after 2 seconds of inactivity, giving you equal room to turn in either direction and providing a clear visual starting point.

#### Crop Parameters

Crop parameters (`cropTop`, `cropLeft`, `cropBottom`, `cropRight`) cannot be adjusted via `increment`/`decrement`. This is a limitation of Adobe's controller API and affects at least Lightroom CC 8.4 on Windows.

### Related

- [lightroom-controller](https://github.com/electerious/lightroom-controller) - HTTP server for controlling Lightroom.

### Donate

I am working hard on continuously developing and maintaining my projects. Please consider making a donation to keep the project going strong and me motivated.

- [Become a GitHub sponsor](https://github.com/sponsors/electerious)
- [Donate via PayPal](https://paypal.me/electerious)
- [Buy me a coffee](https://www.buymeacoffee.com/electerious)

### Links

- [Follow me on Bluesky](https://bsky.app/profile/electerious.bsky.social)
- [Follow me on Threads](https://www.threads.com/@electerious)
