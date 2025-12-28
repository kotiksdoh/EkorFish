import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface ModalHeaderProps {
    title?: string;
    onBackPress?: () => void;
    showBackButton?: boolean;
  }
  
export const ModalHeader: React.FC<ModalHeaderProps> = ({ title, onBackPress, showBackButton = true }) => (
    <ThemedView  lightColor={'#FFFFFF'} darkColor='#151516' style={headerStyles.container}>
      {showBackButton && (
        <TouchableOpacity style={headerStyles.backButton} onPress={onBackPress}>
          <ThemedText style={headerStyles.backButtonText}>‹</ThemedText>
        </TouchableOpacity>
      )}
      <ThemedText style={headerStyles.title} lightColor={'#1B1B1C'}>
        {title}
      </ThemedText>
    </ThemedView>
  );

  const headerStyles = StyleSheet.create({
    container: {
      width: '100%',
    //   height: 120,
      paddingTop: 62,
      borderBottomRightRadius: 24,
      borderBottomLeftRadius: 24,
      // backgroundColor: '#FFFFFF',
      justifyContent: 'flex-end',
      paddingBottom: 24,
      paddingHorizontal: 20,
      position: 'relative',
    //   display: 'flex',
    //   flexDirection: 'row',
      alignItems: 'center'
    },
    backButton: {
      position: 'absolute',
      left: 20,
      bottom: 12,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backButtonText: {
      fontSize: 32,
      color: '#1B1B1C',
      fontWeight: 300
    },
    title: {
      fontSize: 18,
      fontWeight: '500',
      textAlign: 'center',
    },
  });
  