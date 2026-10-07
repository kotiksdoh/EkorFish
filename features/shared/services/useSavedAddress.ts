// features/shared/hooks/useSavedAddress.ts
import { useState, useEffect } from 'react';
import { getSavedAddress, saveSelectedAddress, removeSavedAddress } from '../services/addressStorage';

export const useSavedAddress = (companyId: string | undefined) => {
    const [savedAddress, setSavedAddress] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!companyId) {
            setSavedAddress(null);
            return;
        }

        // Сразу сбрасываем адрес прошлой компании, пока грузим для новой.
        setSavedAddress(null);
        void loadSavedAddress(companyId);
    }, [companyId]);

    const loadSavedAddress = async (id: string = companyId || "") => {
        if (!id) return;
        
        setIsLoading(true);
        try {
            const saved = await getSavedAddress(id);
            setSavedAddress(saved ? saved.address : null);
        } catch (error) {
            console.error('Error loading saved address:', error);
            setSavedAddress(null);
        } finally {
            setIsLoading(false);
        }
    };

    const saveAddress = async (address: any) => {
        if (!companyId) return false;
        
        try {
            await saveSelectedAddress(companyId, address);
            setSavedAddress(address);
            return true;
        } catch (error) {
            console.error('Error saving address:', error);
            return false;
        }
    };

    const removeAddress = async () => {
        if (!companyId) return false;
        
        try {
            await removeSavedAddress(companyId);
            setSavedAddress(null);
            return true;
        } catch (error) {
            console.error('Error removing saved address:', error);
            return false;
        }
    };

    return {
        savedAddress,
        isLoading,
        saveAddress,
        removeAddress,
        refresh: () => loadSavedAddress(),
    };
};
