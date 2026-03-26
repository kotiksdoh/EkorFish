// features/shared/ui/ManagerReviewModal.tsx
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { createReview, getManagerReviewOptions, getMyInfo, setCompany } from '@/features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Image } from "expo-image";
import React, { useEffect, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    useColorScheme
} from 'react-native';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { baseUrl } from '../services/axios';
import { CustomCheckbox } from './components/CustomCheckBox';
import AnimatedTextInput from './components/CustomInput';
import { PrimaryButton } from './components/PrimartyButton';

interface ManagerReviewModalProps {
    visible: boolean;
    onClose: () => void;
    managerId: string;
    managerName: string;
    managerImage?: string;
}

const StarIcon = ({ filled, onPress, size = 40 }: { filled: boolean; onPress: () => void; size?: number }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
            <path
                d="M19.0523 2.80357C19.3586 1.89708 20.6407 1.89708 20.947 2.80357L24.6344 13.7156C24.7717 14.122 25.1529 14.3955 25.5818 14.3955H37.4283C38.4065 14.3955 38.8029 15.655 38.001 16.2153L28.4853 22.8629C28.121 23.1174 27.9684 23.5818 28.1106 24.0028L31.7611 34.8056C32.0701 35.7201 31.0323 36.4983 30.241 35.9455L20.5724 29.191C20.2284 28.9507 19.771 28.9507 19.427 29.191L9.75834 35.9455C8.96705 36.4983 7.92927 35.7201 8.23828 34.8056L11.8887 24.0028C12.031 23.5818 11.8784 23.1174 11.514 22.8629L1.99834 16.2152C1.19644 15.655 1.59283 14.3955 2.57103 14.3955H14.4176C14.8465 14.3955 15.2276 14.122 15.3649 13.7156L19.0523 2.80357Z"
                fill={filled ? "#FFB800" : "#C0C0C5"}
            />
        </svg>
    </TouchableOpacity>
);

// Компонент экрана благодарности
const ThankYouScreen = ({ managerName, onClose }: { managerName: string; onClose: () => void }) => {
    return (
        <View style={styles.thankYouContainer}>
            <View style={styles.thankYouContent}>

                <ThemedText style={styles.thankYouTitle}>
                    Спасибо за вашу оценку!
                </ThemedText>
                
                <ThemedText style={styles.thankYouText}>
                    Ваш отзыв поможет нам улучшить сервис. {managerName} получит вашу обратную связь
                </ThemedText>
            </View>

            <View style={styles.buttonContainer}>
                <PrimaryButton
                    title="Закрыть"
                    onPress={onClose}
                    variant="primary"
                    size="md"
                    activeOpacity={0.8}
                    fullWidth
                />
            </View>
        </View>
    );
};

export const ManagerReviewModal: React.FC<ManagerReviewModalProps> = ({
    visible,
    onClose,
    managerId,
    managerName,
    managerImage,
}) => {
    const systemTheme = useColorScheme();
    const currentTheme = systemTheme || "light";
    const dispatch = useAppDispatch();
    const { reviewOptions, isLoadingManagerReviewOption } = useAppSelector((state) => state.auth);
    const { currentCompany, me } = useAppSelector((state) => state.auth);

    const [rating, setRating] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showThankYou, setShowThankYou] = useState(false);

    const translateY = useSharedValue(1000);

    useEffect(() => {
        if (visible) {
            translateY.value = withTiming(0, { duration: 300 });
            dispatch(getManagerReviewOptions());
            // Сбрасываем состояние при открытии
            resetForm();
            setShowThankYou(false);
        } else {
            translateY.value = withTiming(1000, { duration: 300 });
        }
    }, [visible]);

    const handleClose = () => {
        translateY.value = withTiming(1000, { duration: 300 }, () => {
            runOnJS(onClose)();
            runOnJS(resetForm)();
            runOnJS(() => setShowThankYou(false))();
        });
    };

    const resetForm = () => {
        setRating(0);
        setSelectedOptions([]);
        setComment('');
        setIsSubmitting(false);
    };

    const handleStarPress = (star: number) => {
        setRating(star);
    };

    const handleOptionToggle = (optionId: number) => {
        setSelectedOptions(prev =>
            prev.includes(optionId)
                ? prev.filter(id => id !== optionId)
                : [...prev, optionId]
        );
    };

    const handleSubmit = async () => {
        if (rating === 0 || isSubmitting) return;
    
        setIsSubmitting(true);
        try {
            // Сначала отправляем отзыв
            await dispatch(createReview({
                managerId: managerId,
                star: rating,
                comment: comment,
                optionIds: selectedOptions,
            })).unwrap();
    
            // Затем обновляем данные пользователя и ждем результат
            const result = await dispatch(getMyInfo("")).unwrap();
            debugger
            // Используем обновленные данные из result
            if (result?.data?.data?.companies) {
                const updatedCompany = result.data.data.companies.find(
                    (company: any) => company.id === currentCompany?.id
                );
                if (updatedCompany && updatedCompany.manager) {
                    // Обновляем currentCompany с новыми данными, включая hasReviewed
                    dispatch(setCompany(updatedCompany));
                }
            }
    
            // После успешной отправки показываем экран благодарности
            setShowThankYou(true);
        } catch (error) {
            console.error('Ошибка при отправке отзыва:', error);
            Alert.alert('Ошибка', 'Не удалось отправить оценку. Попробуйте позже.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const isSubmitDisabled = rating === 0 || isSubmitting;

    return (
        <Modal
            visible={visible}
            animationType="none"
            transparent={true}
            onRequestClose={handleClose}
            statusBarTranslucent={true}
        >
            <TouchableWithoutFeedback onPress={handleClose}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                        <Animated.View
                            style={[
                                styles.modalContainer,
                                animatedStyle,
                                currentTheme === 'dark' && styles.modalContainerDark,
                            ]}
                        >
                            {/* Защелка для свайпа */}
                            <TouchableOpacity
                                style={styles.swipeHandleContainer}
                                activeOpacity={0.7}
                                onPress={handleClose}
                            >
                                <View style={styles.swipeHandle} />
                            </TouchableOpacity>

                            {showThankYou ? (
                                // Экран благодарности
                                <ThankYouScreen managerName={managerName} onClose={handleClose} />
                            ) : (
                                // Форма оценки
                                <>
                                    <ScrollView
                                        style={styles.scrollView}
                                        showsVerticalScrollIndicator={false}
                                        contentContainerStyle={styles.scrollContent}
                                    >
                                        {/* Заголовок */}
                                        <ThemedText style={styles.modalTitle}>
                                            Оценить менеджера
                                        </ThemedText>

                                        {/* Информация о менеджере */}
                                        <View style={styles.managerInfoContainer}>
                                            <View style={styles.managerAvatarContainer}>
                                                {managerImage ? (
                                                    <Image
                                                        source={{ uri: `${baseUrl}/${managerImage}` }}
                                                        style={styles.managerAvatar}
                                                    />
                                                ) : (
                                                    <View style={[styles.managerAvatar, styles.avatarPlaceholder]}>
                                                        <ThemedText style={styles.avatarPlaceholderText}>
                                                            {managerName?.charAt(0) || 'М'}
                                                        </ThemedText>
                                                    </View>
                                                )}
                                            </View>
                                            <ThemedText style={styles.managerName}>
                                                {managerName}
                                            </ThemedText>
                                        </View>

                                        {/* Звезды рейтинга */}
                                        <ThemedView style={styles.ratingContainer} lightColor='#F2F4F7' darkColor='#2E2E32'>
                                            <ThemedText style={styles.ratingLabel}>
                                                Как вам работа с менеджером?
                                            </ThemedText>
                                            <View style={styles.starsContainer}>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <StarIcon
                                                        key={star}
                                                        size={40}
                                                        filled={star <= rating}
                                                        onPress={() => handleStarPress(star)}
                                                    />
                                                ))}
                                            </View>
                                        </ThemedView>

                                        {/* Опции для выбора */}
                                        {reviewOptions.length > 0 && (
                                            <View style={styles.optionsContainer}>
                                                <ThemedText style={styles.optionsLabel}>
                                                    Что понравилось особенно?
                                                </ThemedText>
                                                <View style={styles.optionsList}>
                                                    {reviewOptions.map((option: any) => (
                                                        <TouchableOpacity
                                                            key={option.id}
                                                            style={styles.optionItem}
                                                            onPress={() => handleOptionToggle(option.id)}
                                                            activeOpacity={0.7}
                                                        >
                                                            <CustomCheckbox
                                                                style={styles.checkbox}
                                                                value={selectedOptions.includes(option.id)}
                                                                onValueChange={() => handleOptionToggle(option.id)}
                                                                lightColor="#F2F4F7"
                                                                darkColor="#202022"
                                                            />
                                                            <ThemedText style={styles.optionText}>
                                                                {option.value}
                                                            </ThemedText>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            </View>
                                        )}

                                        {/* Комментарий */}
                                        <View style={styles.commentContainer}>
                                            <AnimatedTextInput
                                                placeholder="Комментарий"
                                                placeholderTextColor="#80818B"
                                                value={comment}
                                                onChangeText={setComment}
                                                multiline
                                                style={styles.commentInput}
                                            />
                                        </View>
                                    </ScrollView>

                                    {/* Кнопка отправки */}
                                    <View style={styles.buttonContainer}>
                                        <PrimaryButton
                                            title={isSubmitting ? "Отправка..." : "Поставить оценку"}
                                            onPress={handleSubmit}
                                            variant="primary"
                                            size="md"
                                            activeOpacity={0.8}
                                            fullWidth
                                            disabled={isSubmitDisabled}
                                            loading={isSubmitting}
                                        />
                                    </View>
                                </>
                            )}
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContainer: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: "90%",
    },
    modalContainerDark: {
        backgroundColor: "#202022",
    },
    swipeHandleContainer: {
        alignItems: "center",
        paddingTop: 12,
        paddingBottom: 8,
        width: "100%",
    },
    swipeHandle: {
        width: 40,
        height: 4,
        backgroundColor: "#E0E0E0",
        borderRadius: 2,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "600",
        fontFamily: "Montserrat",
        marginBottom: 24,
        marginTop: 8,
        textAlign: "center",
    },
    managerInfoContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: "center",
        gap: 16,
        marginBottom: 24,
    },
    managerAvatarContainer: {
        // marginBottom: 12,
    },
    managerAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    avatarPlaceholder: {
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholderText: {
        fontSize: 32,
        fontWeight: '600',
        color: '#6B7280',
    },
    managerName: {
        fontSize: 18,
        fontWeight: "600",
        // textAlign: "center",
        flex: 1,
    },
    ratingContainer: {
        padding: 16,
        marginBottom: 24,
        borderRadius: 16
    },
    ratingLabel: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 16,
        textAlign: "center",
    },
    starsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
    },
    optionsContainer: {
        marginBottom: 32,
    },
    optionsLabel: {
        fontSize: 20,
        fontWeight: "600",
        fontFamily: "Montserrat",
        marginBottom: 16,
    },
    optionsList: {
        gap: 12,
    },
    optionItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 5,
    },
    checkbox: {
        width: 24,
        height: 24,
    },
    optionText: {
        fontSize: 14,
        fontFamily: "Montserrat",
        flex: 1,
    },
    commentContainer: {
        marginBottom: 24,
    },
    commentInput: {
        minHeight: 100,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        fontFamily: "Montserrat",
        textAlignVertical: "top",
    },
    buttonContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'transparent'
    },
    // Стили для экрана благодарности
    thankYouContainer: {
        flex: 1,
        justifyContent: 'space-between',
        paddingBottom: 20,
    },
    thankYouContent: {
        flex: 1,
        // alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    successIconContainer: {
        marginBottom: 24,
    },
    thankYouTitle: {
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 16,
    },
    thankYouText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#80818B",
    },
});

export default ManagerReviewModal;