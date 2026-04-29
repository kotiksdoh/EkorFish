import { CatalogScreen } from '@/features/catalog/ui/screens/CatalogScreen';
import { StyleSheet, View } from 'react-native';

export default function DashBoardScreen() {
  return (
    <View style={styles.container}>
      <CatalogScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
});
