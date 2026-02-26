import { CloseIcon } from '@/assets/icons/icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface ModalHeaderProps {
    title?: string;
    onBackPress?: () => void;
    showBackButton?: boolean;
    content?: any;
    showCloseButton?:boolean
  }
  
export const ModalHeader: React.FC<ModalHeaderProps> = ({ 
    title, 
    onBackPress, 
    showBackButton = true, 
    content,
    showCloseButton
}) => {

    const truncateTitle = (text: string | undefined, maxLength: number = 25) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <ThemedView lightColor={'#FFFFFF'} darkColor='#151516' style={headerStyles.allCont}>
            {title || showBackButton || showCloseButton ?
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
                {showCloseButton && (
                    <TouchableOpacity style={headerStyles.closeIcon} onPress={onBackPress}>
                        <CloseIcon/>
                    </TouchableOpacity>
                )}
            </ThemedView>
            : null}
            {!showCloseButton ?
            <View style={(!title || !showBackButton) && headerStyles.containerSub}>
            {content ? content : null}
            </View>
            : null
            }
        </ThemedView>
    );
};

const headerStyles = StyleSheet.create({
    allCont: {
        overflow: 'hidden',
        width: '100%',
        borderBottomRightRadius: 24,
        borderBottomLeftRadius: 24,
        zIndex: 1, 
        elevation: 1,
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
        alignItems: 'center',
        overflow: 'hidden',
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
    closeIcon:{
        position: 'absolute',
        right: 20,
        bottom: 16,
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