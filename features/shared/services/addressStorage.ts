// features/shared/services/addressStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const SELECTED_ADDRESSES_KEY = 'selected_addresses';

export interface SavedAddress {
  companyId: string;
  addressId: string;
  address: any; // полный объект адреса
  timestamp: number;
}

// Сохранить выбранный адрес для компании
export const saveSelectedAddress = async (companyId: string, address: any) => {
  try {
    // Получаем текущие сохраненные адреса
    const savedAddressesJson = await AsyncStorage.getItem(SELECTED_ADDRESSES_KEY);
    const savedAddresses: Record<string, SavedAddress> = savedAddressesJson 
      ? JSON.parse(savedAddressesJson) 
      : {};

    // Сохраняем новый адрес для компании
    savedAddresses[companyId] = {
      companyId,
      addressId: address.id,
      address,
      timestamp: Date.now(),
    };

    // Сохраняем обратно в AsyncStorage
    await AsyncStorage.setItem(SELECTED_ADDRESSES_KEY, JSON.stringify(savedAddresses));
    
    return true;
  } catch (error) {
    console.error('Error saving selected address:', error);
    return false;
  }
};

// Получить сохраненный адрес для компании
export const getSavedAddress = async (companyId: string): Promise<SavedAddress | null> => {
  try {
    const savedAddressesJson = await AsyncStorage.getItem(SELECTED_ADDRESSES_KEY);
    if (!savedAddressesJson) return null;

    const savedAddresses: Record<string, SavedAddress> = JSON.parse(savedAddressesJson);
    return savedAddresses[companyId] || null;
  } catch (error) {
    console.error('Error getting saved address:', error);
    return null;
  }
};

// Получить все сохраненные адреса
export const getAllSavedAddresses = async (): Promise<Record<string, SavedAddress>> => {
  try {
    const savedAddressesJson = await AsyncStorage.getItem(SELECTED_ADDRESSES_KEY);
    return savedAddressesJson ? JSON.parse(savedAddressesJson) : {};
  } catch (error) {
    console.error('Error getting all saved addresses:', error);
    return {};
  }
};

// Удалить сохраненный адрес для компании
export const removeSavedAddress = async (companyId: string) => {
  try {
    const savedAddressesJson = await AsyncStorage.getItem(SELECTED_ADDRESSES_KEY);
    if (!savedAddressesJson) return;

    const savedAddresses: Record<string, SavedAddress> = JSON.parse(savedAddressesJson);
    delete savedAddresses[companyId];

    await AsyncStorage.setItem(SELECTED_ADDRESSES_KEY, JSON.stringify(savedAddresses));
    return true;
  } catch (error) {
    console.error('Error removing saved address:', error);
    return false;
  }
};

// Очистить все сохраненные адреса
export const clearAllSavedAddresses = async () => {
  try {
    await AsyncStorage.removeItem(SELECTED_ADDRESSES_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing saved addresses:', error);
    return false;
  }
};

// Проверить, сохранен ли адрес для компании
export const hasSavedAddress = async (companyId: string): Promise<boolean> => {
  const saved = await getSavedAddress(companyId);
  return saved !== null;
};