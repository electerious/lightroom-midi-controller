#!/usr/bin/env node
import { program } from 'commander'
import packageInfo from '../package.json' with { type: 'json' }
import { devices } from './devices.js'
import { init } from './init.js'
import { run } from './run.js'

const help = `
Examples:
  $ lightroom-midi-controller              Start listening for MIDI events
  $ lightroom-midi-controller --verbose    Log every MIDI event and action
  $ lightroom-midi-controller --config /path/to/.env  Use a custom config file
  $ lightroom-midi-controller init         Configure MIDI mappings
  $ lightroom-midi-controller devices      List available MIDI devices`

program
  .name(packageInfo.name)
  .description(packageInfo.description)
  .version(packageInfo.version)
  .addHelpText('after', help)
  .option('--verbose', 'log every MIDI event and action', false)
  .option('--config <path>', 'path to .env config file')
  .action(run)

program
  .command('init')
  .description('creates a .env file in the current working directory to configure MIDI mappings')
  .action(async () => {
    const programOptions = program.opts()

    await init(programOptions.config)
  })

program
  .command('devices')
  .description('list available MIDI input and output devices')
  .action(() => {
    const programOptions = program.opts()

    devices(programOptions.config)
  })

program.parse()
