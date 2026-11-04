import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { money, type MealPrice } from './model';

const photos = {
  20000: require('@/assets/images/menu/xoi-20k.png'),
  25000: require('@/assets/images/menu/xoi-25k.png'),
  30000: require('@/assets/images/menu/xoi-30k.png'),
};

export function MealPhoto({ price }: { price: MealPrice }) {
  return <Image source={photos[price]} contentFit="cover" style={styles.photo} accessibilityLabel={`Ảnh minh hoạ phần xôi ${money(price)}`} />;
}

export function MealCard({ price, caption, selected, disabled, onPress }: {
  price: MealPrice; caption: string; selected: boolean; disabled: boolean; onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable testID={`meal-${price}`} accessibilityRole="radio" accessibilityLabel={`Chọn phần xôi ${money(price)}`} accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: theme.backgroundElement, borderColor: selected ? theme.accent : theme.border, opacity: disabled ? 0.5 : pressed ? 0.86 : 1 }]}>
      <MealPhoto price={price} />
      <View style={styles.body}>
        <View style={styles.details}>
          <ThemedText type="smallBold" style={styles.title}>Xôi mặn · {price / 1000}k</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">{caption}</ThemedText>
        </View>
        <View style={styles.price}>
          <ThemedText type="smallBold" style={{ color: theme.link }}>{money(price)}</ThemedText>
          <ThemedText type="smallBold" style={{ color: selected ? theme.link : theme.textSecondary }}>{selected ? '✓ Đã chọn' : 'Chọn phần'}</ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 2, borderRadius: 22, overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 1.5, backgroundColor: '#F6EAD9' },
  body: { padding: 16, gap: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  details: { flex: 1, gap: 4 },
  price: { alignItems: 'flex-end', gap: 6 },
  title: { fontSize: 18 },
});
