import { BrandColors, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBackendConnection } from '@/features/be-connection/provider';

export function useTheme() {
  const scheme = useColorScheme();
  const { brandThemeEnabled } = useBackendConnection();
  const mode = scheme === 'dark' ? 'dark' : 'light';

  return brandThemeEnabled ? BrandColors[mode] : Colors[mode];
}
