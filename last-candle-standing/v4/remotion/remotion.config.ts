// The film imports the house 2.5D package (yochi-2p5d/remotion/src/lib) read-only, in place, so it always uses the
// validated implementation. Its react/remotion imports must resolve to this project's single copy.
import path from 'path';
import { Config } from '@remotion/cli/config';

Config.overrideWebpackConfig((c) => ({
  ...c,
  resolve: {
    ...c.resolve,
    alias: {
      ...(c.resolve?.alias as object),
      react: path.resolve(process.cwd(), 'node_modules/react'),
      'react-dom': path.resolve(process.cwd(), 'node_modules/react-dom'),
      remotion: path.resolve(process.cwd(), 'node_modules/remotion'),
    },
  },
}));
Config.setChromiumOpenGlRenderer('swangle');
