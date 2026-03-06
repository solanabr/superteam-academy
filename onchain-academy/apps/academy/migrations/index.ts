import * as migration_20260304_215007 from './20260304_215007';
import * as migration_20260306_184311 from './20260306_184311';

export const migrations = [
  {
    up: migration_20260304_215007.up,
    down: migration_20260304_215007.down,
    name: '20260304_215007',
  },
  {
    up: migration_20260306_184311.up,
    down: migration_20260306_184311.down,
    name: '20260306_184311'
  },
];
