// CatalogDetailScreen.tsx
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ModalHeader } from '@/features/auth/ui/Header';
import { getProduct } from '@/features/catalog/catalogSlice';
import { AutoSlider } from '@/features/home';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Включаем LayoutAnimation для Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { productId, productName } = useLocalSearchParams<{
    productId: string;
    productName?: string; 
  }>();

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPurchaseOptionIndex, setSelectedPurchaseOptionIndex] = useState(0);
const [quantity, setQuantity] = useState(0);
const [selectedTab, setSelectedTab] = useState<'description' | 'characteristics'>('description');

// Добавляем логику для количества и цены



  const router = useRouter();
  const dispatch = useAppDispatch();
  const product = useAppSelector((state) => state.catalog.product);
  const selectedPurchaseOption = product?.purchaseOptions?.[selectedPurchaseOptionIndex];
  const totalPrice = selectedPurchaseOption ? (quantity * selectedPurchaseOption.price) : 0;

  useEffect(() => {
    if (selectedPurchaseOption) {
      setQuantity(selectedPurchaseOption.minQuantity);
    }
  }, [selectedPurchaseOption]);
  
  const handleDecreaseQuantity = () => {
    if (!selectedPurchaseOption) return;
    const newQuantity = quantity - selectedPurchaseOption.step;
    if (newQuantity >= selectedPurchaseOption.minQuantity) {
      setQuantity(newQuantity);
    }
  };
  
  const handleIncreaseQuantity = () => {
    if (!selectedPurchaseOption) return;
    const newQuantity = quantity + selectedPurchaseOption.step;
    if (newQuantity <= selectedPurchaseOption.maxQuantity) {
      setQuantity(newQuantity);
    }
  };
  
  const handleBuyNow = () => {
    console.log('Buy now:', { productId, quantity, totalPrice });
  };

  const loadProduct = () => {
    dispatch(getProduct(productId));
  };

  useEffect(() => {
    if (productId) {
      console.log('Initial load for catalog:', productId);
      loadProduct();
    }
  }, [productId]);

  const handleBack = () => {
    router.back();
  };

  const toggleExpanded = () => {
    // Анимация раскрытия/скрытия
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };
  // Проверяем, нужна ли кнопка раскрытия (если текст больше 2 строк)
  const needsExpandButton = product?.name && product.name.length > 40; // Настройте под свои нужды
  console.log('product', product?.images)
  return (
    <SafeAreaProvider>
      <ThemedView style={styles.safeArea} lightColor={'#EBEDF0'} darkColor='#040508'>
        <ModalHeader
          title={''}
          showBackButton={true}
          onBackPress={handleBack}
          content={<></>}
        />
        
        <View style={styles.mainContainer}>
          <ScrollView 
            style={styles.container}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={100}
            contentContainerStyle={styles.scrollContent}
          >
            <ThemedView style={styles.themeContainer} lightColor={'#FFFFFF'} darkColor='#040508'>
              <AutoSlider
                items={product?.images || []}
                autoPlayInterval={4000}
                showIndicators={true}
              />
              
              {/* Контейнер для названия продукта */}
              <View style={styles.productNameWrapper}>
                <ThemedText 
                  style={styles.themeName} 
                  lightColor='#1B1B1C' 
                  darkColor='#FBFCFF'
                  numberOfLines={isExpanded ? undefined : 2}
                  ellipsizeMode="tail"
                >
                  {product?.name || ''}
                  {/* dgdsg gdsjkgdjs dgjskgjds gdjskgjsd kdsdsdsds dsds ds */}
                </ThemedText>
                
                {/* Кнопка "раскрыть" если текст длинный */}
                {needsExpandButton && (
                  <TouchableOpacity 
                    style={styles.expandButton}
                    onPress={toggleExpanded}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-forward"} 
                      size={20} 
                      color="#8E8E93" 
                    />
                  </TouchableOpacity>
                )}
              </View>
            </ThemedView>
            <ThemedView style={styles.themeContainer} lightColor={'#FFFFFF'} darkColor='#040508'>
                <ThemedView lightColor={'#F2F4F7'} darkColor='#202022' style={styles.subContainer}>
                  <ThemedText lightColor={'#80818B'} darkColor='#FBFCFF80'>
                      {/* Вид цены – упаковками */}
                  </ThemedText>
                  <ThemedText lightColor={'#1B1B1C'} darkColor='#FBFCFF'>

                  </ThemedText>
                </ThemedView>


                <ThemedView lightColor={'#F2F4F7'} darkColor='#202022' style={styles.subContainer}>
                  <ThemedText lightColor={'#80818B'} darkColor='#FBFCFF80'>
                      {/* Вид цены – упаковками */}
                  </ThemedText>
                  <ThemedText lightColor={'#1B1B1C'} darkColor='#FBFCFF'>

                  </ThemedText>
                </ThemedView>
            </ThemedView>
          </ScrollView>
        </View>
      </ThemedView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  themeContainer: {
    borderRadius: 24,
    marginTop: 10,
    // minHeight: '100%',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  productNameWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    marginBottom: 16,
  },
  themeName: {
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 24,
    flex: 1,
    marginRight: 8,
    paddingRight: 4,
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  productContent: {
    marginTop: 8,
  },
  productDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: 8,
  },
  subContainer: {
    display: 'flex',
    flexDirection: 'column',
  }
});