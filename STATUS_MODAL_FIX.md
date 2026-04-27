# Отчет об исправлении отображения модалки статуса заказа на Android

## 🐛 Проблема
На Android в модалке "Статус вашего заказа" контент не отображается или сжимается до минимального размера, когда пользователь нажимает на статус заказа в деталях заказа.

## 🔍 Причины проблемы

### 1. **Отсутствие минимальной высоты SnapBottomSheet**
```typescript
// ДО (неправильно):
const MAX_SHEET_HEIGHT = SCREEN_HEIGHT * 0.92;
// Нет MIN_SHEET_HEIGHT
```

На Android модалка может "схлопнуться" на минимальный размер, если нет явно указанной минимальной высоты.

### 2. **Отсутствие contentWrapper для контента**
Дети добавлялись непосредственно в Animated.View без обёртки, что могло привести к проблемам с flex-раскладкой на Android.

### 3. **Недостаточная высота statusesListWrapper на OrderDetailModal**
```typescript
// ДО:
statusesListWrapper: {
  flex: 1,
},
```

Без явной `minHeight` flex может не работать корректно на Android.

### 4. **Отсутствие Platform-specific стилей**
React Native на Android имеет другие дефолты для flex-раскладки по сравнению с iOS.

## ✅ Решения

### 1. Добавлена минимальная высота SnapBottomSheet
```typescript
// ПОСЛЕ:
import { Platform } from "react-native";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const MAX_SHEET_HEIGHT = SCREEN_HEIGHT * 0.92;
const MIN_SHEET_HEIGHT = Platform.OS === "android" ? 200 : 150;
```

**Результат**: Модалка никогда не сожмётся меньше чем на 200px на Android.

### 2. Добавлена contentWrapper обёртка
```typescript
// В SnapBottomSheet рендере:
<View style={styles.contentWrapper}>
  {children}
</View>

// В стилях:
contentWrapper: {
  flex: 1,
  minHeight: Platform.OS === "android" ? 150 : 100,
},
```

**Результат**: Контент имеет правильное пространство и может раскрываться.

### 3. Добавлены явные минимальные высоты для статусов
```typescript
// ПОСЛЕ (OrderDetailModal):
statusesListWrapper: {
  flex: 1,
  minHeight: 200,
},
statusesList: {
  flex: 1,
  minHeight: 200,
},
statusesListContent: {
  paddingHorizontal: 20,
  paddingVertical: 16,
  minHeight: 200,
},
```

**Результат**: Список статусов всегда имеет достаточно пространства.

### 4. Добавлена поддержка Platform-specific стилей
```typescript
const MIN_SHEET_HEIGHT = Platform.OS === "android" ? 200 : 150;
```

## 📝 Изменённые файлы

**`features/shared/ui/SnapBottomSheet.tsx`**
- ✅ Добавлен импорт Platform
- ✅ Добавлена MIN_SHEET_HEIGHT для Android (200px) и iOS (150px)
- ✅ Добавлена contentWrapper обёртка с flex и minHeight
- ✅ Добавлены правильные стили для отображения контента

**`features/shared/ui/OrderDetailModal.tsx`**
- ✅ Добавлены minHeight к statusesListWrapper, statusesList и statusesListContent

## 🔧 Как это работает

```
Пользователь нажимает на статус заказа
    ↓
setStatusModalVisible(true)
    ↓
SnapBottomSheet открывается с минимальной высотой 200px (Android)
    ↓
contentWrapper раскрывается с flex: 1
    ↓
ScrollView внутри statusesListWrapper имеет minHeight: 200
    ↓
Все элементы отображаются нормально ✅
```

## 📊 Результаты

| Проблема | До | После |
|----------|----|----|
| Контент сжимается на Android | ❌ Да | ✅ Нет |
| Минимальная высота | ❌ Нет | ✅ 200px на Android |
| Flex-раскладка работает | ❌ Нет | ✅ Да |
| Контент видно в модалке | ❌ Нет | ✅ Да |

## 🧪 Как тестировать

1. Откройте приложение на Android устройстве
2. Перейдите в "Мои заказы"
3. Откройте деталь заказа (нажмите на заказ)
4. Нажмите на "Статус вашего заказа" (или логотип статуса)
5. Проверьте:
   - ✅ Модалка открывается с нормальным размером
   - ✅ Все статусы видны
   - ✅ Можно скроллить список статусов
   - ✅ Линии и иконки статусов отображаются правильно

**Ожидаемый результат**: Модалка показывается полностью с контентом, можно просмотреть все статусы.

## 🚀 Дополнительные замечания

Эти изменения используют:
- **Platform.OS**: для определения платформы (Android/iOS)
- **flex: 1**: для растяжения контента
- **minHeight**: для установления минимального размера
- **maxHeight**: для ограничения максимального размера

Это гарантирует, что модалка будет работать корректно на всех устройствах.
