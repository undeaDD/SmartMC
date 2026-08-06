const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

// NativeTabs on iOS occasionally mis-lays-out icons sourced from a React
// component (icon/label shifting in release builds -- expo/expo#42364).
// Copying the same filled SVGs the Android tab-icon font is built from
// (assets/icons/tabs/*.svg) into an Xcode asset catalog and referencing them
// via the `xcasset` prop instead sidesteps the bug entirely: iOS then
// renders the icon as a native template image rather than going through
// React's image-source resolution path. Android is unaffected and keeps
// using the existing VectorIcon (`src`) approach -- see app/(tabs)/_layout.tsx's
// `vectorIconSrc` helper, which is already iOS/Android-gated for this reason.
//
// Ported from bestell.bar-app's plugins/withIOSCustomizations.js (withTabIcons).
const TAB_ICONS = [
  { source: 'home.svg', name: 'tab-home' },
  { source: 'devices.svg', name: 'tab-devices' },
  { source: 'profile.svg', name: 'tab-profile' },
];

function withTabIcons(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iosDir = config.modRequest.platformProjectRoot;
      const appDirName = fs
        .readdirSync(iosDir)
        .find(
          (entry) =>
            fs.statSync(path.join(iosDir, entry)).isDirectory() &&
            entry !== 'Pods' &&
            !entry.endsWith('.xcodeproj') &&
            !entry.endsWith('.xcworkspace'),
        );
      const xcassetsDir = path.join(iosDir, appDirName, 'Images.xcassets');

      for (const { source, name } of TAB_ICONS) {
        const svgPath = path.join(projectRoot, 'assets', 'icons', 'tabs', source);
        const imagesetDir = path.join(xcassetsDir, `${name}.imageset`);
        fs.mkdirSync(imagesetDir, { recursive: true });
        fs.copyFileSync(svgPath, path.join(imagesetDir, `${name}.svg`));
        fs.writeFileSync(
          path.join(imagesetDir, 'Contents.json'),
          `${JSON.stringify(
            {
              images: [{ idiom: 'universal', filename: `${name}.svg` }],
              info: { version: 1, author: 'xcode' },
              properties: {
                'preserves-vector-representation': true,
                'template-rendering-intent': 'template',
              },
            },
            null,
            2,
          )}\n`,
        );
      }

      return config;
    },
  ]);
}

module.exports = withTabIcons;
