/* ═══ Tracker Factory ═════════════════════════════════════════════════════
   Registry for all supported trackers. Add new trackers here.
*/
import type { ITracker, TrackerType } from './types'
import { VeoTracker } from './veo'

// Add new tracker implementations here
const trackerRegistry: Record<TrackerType, () => ITracker> = {
  veo: () => new VeoTracker(),
  wyscout: () => {
    throw new Error('Wyscout tracker not yet implemented')
  },
  hudl: () => {
    throw new Error('Hudl tracker not yet implemented')
  },
  kinexon: () => {
    throw new Error('Kinexon tracker not yet implemented')
  },
  playermaker: () => {
    throw new Error('PlayerMaker tracker not yet implemented')
  },
}

export function getTracker(type: TrackerType): ITracker {
  const factory = trackerRegistry[type]
  if (!factory) {
    throw new Error(`Unknown tracker type: ${type}`)
  }
  return factory()
}

export function getSupportedTrackers(): TrackerType[] {
  return Object.keys(trackerRegistry) as TrackerType[]
}

export * from './types'
