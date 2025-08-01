import FilesystemStrategy from './FilesystemStrategy'
import GCPStrategy from './GCPStrategy'

export enum FilesDriverStrategiesTypes {
  FILESYSTEM = 'filesystem',
  GCP = 'gcp',
}

export const FilesDriverStrategies: {
  [_key in FilesDriverStrategiesTypes]: any;
} = {
  [FilesDriverStrategiesTypes.FILESYSTEM]: FilesystemStrategy,
  [FilesDriverStrategiesTypes.GCP]: GCPStrategy,
}
