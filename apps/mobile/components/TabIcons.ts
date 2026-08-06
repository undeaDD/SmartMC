import { createIconSet } from '@react-native-vector-icons/common';
import glyphMap from '@/assets/fonts/tab-icons-codepoints.json';

const TabIcons = createIconSet(glyphMap, 'TabIcons', 'TabIcons.ttf');

export default TabIcons;
export type TabIconName = keyof typeof glyphMap;
