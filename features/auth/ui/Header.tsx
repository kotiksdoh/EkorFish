import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface ModalHeaderProps {
    title?: string;
    onBackPress?: () => void;
    showBackButton?: boolean;
    content?: any;
  }
  
export const ModalHeader: React.FC<ModalHeaderProps> = ({ 
    title, 
    onBackPress, 
    showBackButton = true, 
    content 
}) => {

    const truncateTitle = (text: string | undefined, maxLength: number = 25) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <ThemedView lightColor={'#FFFFFF'} darkColor='#151516' style={headerStyles.allCont}>
            {title || showBackButton ?
            <ThemedView lightColor={'#FFFFFF'} darkColor='#151516' style={headerStyles.container}>
                {showBackButton && (
                    <TouchableOpacity style={headerStyles.backButton} onPress={onBackPress}>
                        <ThemedText style={headerStyles.backButtonText}>‹</ThemedText>
                    </TouchableOpacity>
                )}
                <ThemedText 
                    style={headerStyles.title} 
                    lightColor={'#1B1B1C'}
                    numberOfLines={1} 
                >
                    {truncateTitle(title)}
                </ThemedText>
            </ThemedView>
            : null}
            <View style={(!title || !showBackButton) && headerStyles.containerSub}>
            {content ? content : null}
            </View>
        </ThemedView>
    );
};

const headerStyles = StyleSheet.create({
    allCont: {
        width: '100%',
        borderBottomRightRadius: 24,
        borderBottomLeftRadius: 24,
    },
    container: {
        width: '100%',
        paddingTop: 62,
        borderBottomRightRadius: 24,
        borderBottomLeftRadius: 24,
        justifyContent: 'flex-end',
        paddingBottom: 24,
        paddingHorizontal: 20,
        position: 'relative',
        alignItems: 'center'
    },
    containerSub: {
        paddingTop: 62,

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
        fontWeight: 300
    },
    title: {
        fontSize: 18,
        fontWeight: '500',
        textAlign: 'center',
        flexShrink: 1, // Добавляем для правильной работы обрезки текста
    },
});