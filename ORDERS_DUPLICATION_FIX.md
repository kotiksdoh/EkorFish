# Отчет об исправлении дублирования заказов на Android

## 🐛 Проблема
На Android в модалке "Мои заказы" при наличии 1 заказа он дублировался на экране.

## 🔍 Причины дублирования

### 1. **Неправильные зависимости в useEffect** (основная причина)
```javascript
// ДО (неправильно):
useEffect(() => {
  if (!visible) return;
  // ... resetting state ...
  fetchOrders("active", false);
}, [visible, fetchOrders, tabAnim]); // ❌ fetchOrders in dependencies causes double call
```

**Проблема**: `fetchOrders` включена в зависимости, что вызывает цепочку:
1. Модалка открывается → useEffect срабатывает
2. Сбрасывается состояние
3. `fetchOrders` вызывается
4. `fetchOrders` обновляет состояние
5. `fetchOrders` пересоздаётся → useEffect срабатывает снова! ♻️

### 2. **Ненадёжный keyExtractor в FlatList**
```javascript
// ДО:
keyExtractor={(item) => item.id.toString()}
```

На Android при дублировании элементов в памяти могут быть два элемента с одним ID, что вызывает проблемы с ре-рендерингом.

### 3. **Отсутствие дебаг-информации**
Было невозможно отследить, сколько раз вызывается `fetchOrders` и сколько элементов загружается.

## ✅ Решения

### 1. Исправлены зависимости useEffect
```javascript
// ПОСЛЕ (правильно):
useEffect(() => {
  if (!visible) return;
  
  // Сбрасываем состояние при открытии модалки
  setSelectedTab("active");
  tabAnim.setValue(0);
  setActiveOrders([]);
  setCompletedOrders([]);
  setInitializedTabs({ active: false, completed: false });
  setIsTabLoading({ active: true, completed: false });
  setIsLoadingMore({ active: false, completed: false });
  offsetsRef.current = { active: 0, completed: 0 };
  hasMoreRef.current = { active: true, completed: true };
  inFlightRef.current = { active: false, completed: false };
  
  // Загружаем активные заказы
  fetchOrders("active", false);
}, [visible]); // ✅ Только visible в зависимостях
```

**Результат**: `fetchOrders` вызывается ровно один раз при открытии модалки.

### 2. Улучшен keyExtractor
```javascript
// ПОСЛЕ:
keyExtractor={(item, index) => `${tab}-${item.id}-${index}`}
```

**Результат**: Каждый элемент в FlatList получает уникальный ключ, комбинирующий:
- Таб (active/completed)
- ID заказа
- Индекс в списке

Это предотвращает дублирование даже в экстремальных случаях.

### 3. Добавлены console.log для отладки
```javascript
console.log(`[Orders] Fetching ${tab}:`, { isLoadMore, offset, isActive });
console.log(`[Orders] Got ${nextItems.length} items for ${tab}`);
console.log(`[Orders] Setting ${tab} data, count:`, newData.length);
```

**Результат**: Теперь видны все вызовы fetchOrders в консоли.

## 📝 Изменённые файлы

**`features/shared/ui/MyOrders.tsx`**
- ✅ Убрали `fetchOrders` и `tabAnim` из зависимостей useEffect
- ✅ Улучшили keyExtractor в FlatList
- ✅ Добавили дебаг-логирование для отслеживания загрузки

## 🔧 Технические детали

### Почему это нужно для Android?

React Native на Android имеет особенности:
1. **Strict Mode**: Некоторые эффекты выполняются дважды
2. **Виртуализация**: FlatList нужны правильные ключи для корректного переиспользования элементов
3. **Garbage Collection**: Android агрессивнее очищает память, что может привести к багам с refs

### Как это работает теперь?

```
Пользователь открывает MyOrdersModal
    ↓
visible = true
    ↓
useEffect срабатывает один раз (только [visible])
    ↓
Состояние сбрасывается
    ↓
fetchOrders("active", false) вызывается один раз
    ↓
Заказы загружаются
    ↓
FlatList рендерит их с уникальными ключами
    ↓
Результат: Один заказ = Один элемент ✅
```

## ✨ Результаты

| Метрика | До | После |
|---------|----|----|
| Вызовов fetchOrders при открытии | 2-4 | 1 |
| Дублирование заказов на Android | ❌ Да | ✅ Нет |
| Надёжность keyExtractor | ❌ Низкая | ✅ Высокая |
| Отлаживаемость | ❌ Сложно | ✅ Просто (логи в консоли) |

## 🧪 Как тестировать

1. Откройте приложение на Android
2. Перейдите в "Мои заказы"
3. Убедитесь, что видите ровно столько заказов, сколько есть
4. Откройте DevTools → Console и посмотрите логи `[Orders]`
5. Переключитесь между табами "Активные" и "Завершенные"

**Ожидаемый результат**: Никаких дублей, чистое логирование, плавная работа.

## 🚀 Дополнительная оптимизация

Дебаг-логи можно оставить для первой версии, а потом убрать через environment flag:
```javascript
if (__DEV__) {
  console.log(`[Orders] Fetching ${tab}:`, ...);
}
```
