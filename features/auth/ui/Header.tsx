import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface HeaderProps {
    title?: string;
    onBackPress?: () => void;
  }
  
export default function DeliveryInfoCard() {
  return (
    <ThemedView style={styles.container}>
            
    </ThemedView>
  );
}

const styles = StyleSheet.create({
    container:{

    }
});