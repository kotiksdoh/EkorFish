// features/shared/ui/ManagerReviewModal.tsx
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { createReview, getManagerReviewOptions, getMyInfo, setCompany } from '@/features/auth/authSlice';
import { useAppTheme } from '@/hooks/use-theme-color';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Image } from "expo-image";
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAwareScroll } from '@/features/shared/hooks/useKeyboardAwareScroll';
import Svg, { Path } from "react-native-svg";
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
        <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
            <Path
                d="M19.0523 2.80357C19.3586 1.89708 20.6407 1.89708 20.947 2.80357L24.6344 13.7156C24.7717 14.122 25.1529 14.3955 25.5818 14.3955H37.4283C38.4065 14.3955 38.8029 15.655 38.001 16.2153L28.4853 22.8629C28.121 23.1174 27.9684 23.5818 28.1106 24.0028L31.7611 34.8056C32.0701 35.7201 31.0323 36.4983 30.241 35.9455L20.5724 29.191C20.2284 28.9507 19.771 28.9507 19.427 29.191L9.75834 35.9455C8.96705 36.4983 7.92927 35.7201 8.23828 34.8056L11.8887 24.0028C12.031 23.5818 11.8784 23.1174 11.514 22.8629L1.99834 16.2152C1.19644 15.655 1.59283 14.3955 2.57103 14.3955H14.4176C14.8465 14.3955 15.2276 14.122 15.3649 13.7156L19.0523 2.80357Z"
                fill={filled ? "#FFB800" : "#C0C0C5"}
            />
        </Svg>
    </TouchableOpacity>
);

// Компонент экрана благодарности
const ThankYouScreen = ({
    managerName,
    onClose,
    bottomInset,
}: {
    managerName: string;
    onClose: () => void;
    bottomInset: number;
}) => {
    return (
        <View style={styles.thankYouContainer}>
            <View style={styles.thankYouContent}>

                <ThemedText style={styles.thankYouTitle}>
                    Спасибо за вашу оценку!
                </ThemedText>
                
                <ThemedText style={styles.thankYouText} lightColor="#80818B" darkColor="#FBFCFF80">
                    Ваш отзыв поможет нам улучшить сервис. {managerName} получит вашу обратную связь
                </ThemedText>
            </View>

            <View style={[styles.buttonContainer, { paddingBottom: bottomInset }]}>
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
    const { isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const dispatch = useAppDispatch();
    const bottomInset = Math.max(insets.bottom, 16);
    const footerPadding = bottomInset + 16;
    const scrollBottomPadding = useMemo(
        () => footerPadding + 72,
        [footerPadding],
    );
    const [rating, setRating] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showThankYou, setShowThankYou] = useState(false);
    const {
        scrollRef,
        keyboardHeight,
        handleScroll,
        onInputFocus: handleCommentFocus,
        androidKeyboardMargin,
    } = useKeyboardAwareScroll({
        enabled: visible && !showThankYou,
    });
    const { reviewOptions, isLoadingManagerReviewOption } = useAppSelector((state) => state.auth);
    const { currentCompany } = useAppSelector((state) => state.auth);

    useEffect(() => {
        if (visible) {
            if (managerId) {
                dispatch(getManagerReviewOptions());
            }
            // Сбрасываем состояние при открытии
            resetForm();
            setShowThankYou(false);
        } else {
            resetForm();
            setShowThankYou(false);
        }
    }, [visible]);

    const handleClose = () => {
        Keyboard.dismiss();
        resetForm();
        setShowThankYou(false);
        onClose();
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

            // Для сценария физлица менеджер может жить в individualProfile, а не в companies
            const updatedProfileManager = result?.data?.data?.individualProfile?.manager;
            if (currentCompany?.type === "individual" && updatedProfileManager) {
                dispatch(
                    setCompany({
                        ...currentCompany,
                        manager: updatedProfileManager,
                    }),
                );
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
                        <View
                            style={[
                                styles.modalContainer,
                                showThankYou && styles.modalContainerCompact,
                                isDark && styles.modalContainerDark,
                                androidKeyboardMargin > 0 && {
                                    marginBottom: androidKeyboardMargin,
                                },
                            ]}
                        >
                            {/* Защелка для свайпа */}
                            <TouchableOpacity
                                style={styles.swipeHandleContainer}
                                activeOpacity={0.7}
                                onPress={handleClose}
                            >
                                <View style={[styles.swipeHandle, isDark && styles.swipeHandleDark]} />
                            </TouchableOpacity>

                            {showThankYou ? (
                                <ThankYouScreen
                                    managerName={managerName}
                                    onClose={handleClose}
                                    bottomInset={footerPadding}
                                />
                            ) : (
                                // Форма оценки
                                <>
                                    <KeyboardAvoidingView
                                        style={styles.keyboardAvoiding}
                                        behavior={Platform.OS === "ios" ? "padding" : undefined}
                                        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
                                    >
                                    <ScrollView
                                        ref={scrollRef}
                                        style={styles.scrollView}
                                        showsVerticalScrollIndicator={false}
                                        keyboardShouldPersistTaps="handled"
                                        keyboardDismissMode="on-drag"
                                        onScroll={handleScroll}
                                        scrollEventThrottle={16}
                                        contentContainerStyle={[
                                            styles.scrollContent,
                                            {
                                                paddingBottom:
                                                    scrollBottomPadding +
                                                    (keyboardHeight > 0 ? 24 : 0),
                                            },
                                        ]}
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
                                                    <View
                                                        style={[
                                                            styles.managerAvatar,
                                                            styles.avatarPlaceholder,
                                                            isDark && styles.avatarPlaceholderDark,
                                                        ]}
                                                    >
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
                                        {isLoadingManagerReviewOption ? (
                                            <View style={styles.reviewOptionsLoader}>
                                                <ActivityIndicator size="small" color={isDark ? "#4C94FF" : "#203686"} />
                                                <ThemedText lightColor="#80818B" darkColor="#FBFCFF80">
                                                    Загрузка вариантов оценки...
                                                </ThemedText>
                                            </View>
                                        ) : reviewOptions.length > 0 && (
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
                                                                disabled={false}
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
                                                onFocus={handleCommentFocus}
                                                style={[
                                                    styles.commentInput,
                                                    isDark && styles.commentInputDark,
                                                ]}
                                            />
                                        </View>
                                    </ScrollView>

                                    <View
                                        style={[
                                            styles.buttonContainer,
                                            styles.buttonContainerFixed,
                                            { paddingBottom: footerPadding },
                                            isDark && styles.buttonContainerFixedDark,
                                        ]}
                                    >
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
                                    </KeyboardAvoidingView>
                                </>
                            )}
                        </View>
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
        height: "88%",
        minHeight: 420,
    },
    modalContainerCompact: {
        height: 280,
        minHeight: 280,
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
    swipeHandleDark: {
        backgroundColor: "#4A4A50",
    },
    keyboardAvoiding: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
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
    avatarPlaceholderDark: {
        backgroundColor: '#2E2E32',
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
    reviewOptionsLoader: {
        marginBottom: 24,
        gap: 10,
        alignItems: "center",
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
        marginBottom: 8,
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
    commentInputDark: {
        borderColor: "#3A3A3F",
    },
    buttonContainer: {
        paddingHorizontal: 20,
        paddingTop: 12,
        backgroundColor: "transparent",
    },
    buttonContainerFixed: {
        borderTopWidth: 1,
        borderTopColor: "#F0F3F7",
    },
    buttonContainerFixedDark: {
        borderTopColor: "#3A3A3F",
    },
    // Стили для экрана благодарности
    thankYouContainer: {
        flex: 1,
        justifyContent: "space-between",
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