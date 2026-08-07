import { Platform as P } from 'react-native';

type PlatformType = {
  OS: 'ios' | 'android' | 'windows' | 'macos' | 'web' | 'iosnew';
  Version: string | number;
  Id: string;
  isIOS: boolean;
  isAndroid: boolean;
};

const m = {
  ios: 1,
  android: 2,
  windows: 3,
  macos: 4,
  web: 5,
  iosnew: 6,
} as const;

const v = Number(String(P.Version).split('.')[0]);
const os = P.OS as string;

const OS = os === 'ios' && v >= 26 ? 'iosnew' : (os as PlatformType['OS']);

const AppPlatform: PlatformType = {
  OS,
  Version: P.Version,
  Id: `p${m[OS] ?? 0} - o${P.Version}`,
  isIOS: os === 'ios',
  isAndroid: os === 'android',
};

export default AppPlatform;
