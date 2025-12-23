import { CloseIcon, LogoIcon } from '@/assets/icons/icons.js';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CustomCheckbox } from '@/features/shared/ui/components/CustomCheckBox';
import AnimatedTextInput from '@/features/shared/ui/components/CustomInput';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { PrimaryButton } from '@/features/home';
import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCode } from '../../authSlice';

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  onLogin: (phoneNumber: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  visible,
  onClose,
  onLogin,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const insets = useSafeAreaInsets();
  const codeInputRefs = useRef<TextInput[]>([]);

  const loading = useAppSelector((state) => state.auth.isLoading);

  const dispatch = useAppDispatch()
  // Инициализируем refs
  useEffect(() => {
    codeInputRefs.current = codeInputRefs.current.slice(0, 4);
  }, []);

  const handleLogin = () => {
    if (!phoneNumber || !agreedToTerms) {
      return;
    }
    dispatch(getCode({
      contact: phoneNumber
    }))
      // Симуляция отправки кода
      // TODO реализовать логику
      setShowCodeInput(true);
      setIsTimerActive(true);
      setError(null);
  };

  const handleCodeInputChange = (text: string, index: number) => {
    // Ограничиваем ввод одним символом
    const singleChar = text.length > 1 ? text.charAt(text.length - 1) : text;
    
    const newCode = [...confirmationCode];
    newCode[index] = singleChar;
    setConfirmationCode(newCode);
    
    // Автоматически переходим к следующему полю при вводе
    if (singleChar && index < 3) {
      codeInputRefs.current[index + 1]?.focus();
    }
    
    // Переход к предыдущему полю при удалении
    if (!singleChar && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
    
    // Проверяем, если все поля заполнены
    if (newCode.every(char => char !== '')) {
      verifyCode(newCode.join(''));
    }
  };

  // Обработка backspace
  const handleKeyPress = (event: any, index: number) => {
    if (event.nativeEvent.key === 'Backspace' && !confirmationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const verifyCode = (code: string) => {
    // Пример ошибки (заглушка)
    const hasError = false; // Здесь будет реальная проверка
    
    if (hasError) {
      setError('Неверный код подтверждения');
      // Подсвечиваем поля красным
      setConfirmationCode(['', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } else {
      setError(null);
      // Если код верный, вызываем onLogin
      onLogin(phoneNumber);
      resetModal();
    }
  };

  const handleResendCode = () => {
    if (!isTimerActive) {
      setTimer(60);
      setIsTimerActive(true);
      setError(null);
      // Здесь будет запрос на повторную отправку кода
    }
  };

  // Таймер для повторной отправки
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, timer]);

  // Сброс состояния модального окна
  const resetModal = () => {
    setPhoneNumber('');
    setAgreedToTerms(false);
    setConfirmationCode(['', '', '', '']);
    setTimer(60);
    setIsTimerActive(false);
    setError(null);
    setShowCodeInput(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const isLoginButtonDisabled = !phoneNumber || !agreedToTerms;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      {/* <SafeAreaView style={styles.modalContainer}> */}
      <SafeAreaProvider>
      {/* <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}> */}
      {/* <View style={{ paddingTop: insets.top }}> */}
        <ThemedView lightColor={'#EBEDF0'} style={styles.modalContent}>
          <ThemedView  style={styles.modalContentInner} lightColor={'#FFFFFF'}>
            {/* Крестик закрытия */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <CloseIcon width={20} height={20} />
            </TouchableOpacity>

            {/* Логотип */}
            <View style={styles.logoContainer}>
              <View style={styles.logoContainerInner}>
              <LogoIcon />
              </View>
              <ThemedText style={styles.logoText} lightColor={'#80818B'}>
                Поставки продуктов{'\n'}для HoReCa
              </ThemedText>
            </View>

            <View style={styles.afterLogoContent}>
              {!showCodeInput ? (
                // ЭКРАН АВТОРИЗАЦИИ
                <>
                  <ThemedText style={styles.modalTitle} lightColor={'#1B1B1C'}>
                    Авторизация
                  </ThemedText>
                  
                  <ThemedText style={styles.modalDescription} lightColor={'#80818B'}>
                    Мы отправим сообщение с кодом{'\n'}для входа.
                  </ThemedText>

                  <View style={styles.inputContainer}>
                    <AnimatedTextInput
                      // style={styles.input}
                      placeholder="Номер телефона или E-mail"
                      placeholderTextColor="#80818B"
                      keyboardType="phone-pad"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      autoFocus
                    />
                  </View>

                  {/* Чекбокс согласия */}
                  <View style={styles.checkboxContainer}>
                    <View style={styles.checkboxContainerInner}>
                      <CustomCheckbox
                        style={styles.checkbox}
                        value={agreedToTerms}
                        onValueChange={setAgreedToTerms}
                    
                      />
                    </View>
                    <ThemedText style={styles.checkboxText} lightColor={'#80818B'}>
                      Я принимаю{' '}
                      <Text style={styles.checkboxLink}>Политику конфиденциальности</Text>
                      {'\n'}и{' '}
                      <Text style={styles.checkboxLink}>Согласие на обработку персональных данных</Text>
                    </ThemedText>
                  </View>

                  {/* Кнопка Войти */}
                  <PrimaryButton
                    title="Войти"
                    onPress={handleLogin}
                    variant="primary"
                    size="md"
                    loading={loading}
                    activeOpacity={0.8}
                    fullWidth
                    disabled={isLoginButtonDisabled || loading}
                  />
                  {/* <TouchableOpacity
                    style={[
                      styles.modalLoginButton,
                      isLoginButtonDisabled && styles.modalLoginButtonDisabled
                    ]}
                    onPress={handleLogin}
                    disabled={isLoginButtonDisabled || loading}
                  
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalLoginButtonText}>Войти</Text>
                  </TouchableOpacity> */}
                </>
              ) : (
                // ЭКРАН ПОДТВЕРЖДЕНИЯ КОДА
                <>
                  {/* Заголовок */}
                  <ThemedText style={styles.modalTitleAfterPhone} lightColor={'#1B1B1C'}>
                    Код подтверждения
                  </ThemedText>
                  
                  {/* Описание */}
                  <ThemedText style={styles.modalDescriptionAfterPhone} lightColor={'#80818B'}>
                    Мы отправили 4-x значный код{'\n'}на номер {phoneNumber}.
                  </ThemedText>

                  {/* Контейнер для 4 инпутов */}
                  <View style={styles.codeInputsContainer}>
                    {[0, 1, 2, 3].map((_, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => {
                          if (ref) {
                            codeInputRefs.current[index] = ref;
                          }
                        }}
                        style={[
                          styles.codeInput,
                          error && styles.codeInputError
                        ]}
                        value={confirmationCode[index]}
                        onChangeText={(text) => handleCodeInputChange(text, index)}
                        onKeyPress={(event) => handleKeyPress(event, index)}
                        keyboardType="number-pad"
                        maxLength={1}
                        textAlign="center"
                        autoFocus={index === 0}
                        placeholder=""
                        placeholderTextColor={error ? '#FF3B30' : '#80818B'}
                      />
                    ))}
                  </View>

                  {/* Сообщение об ошибке */}
                  {error && (
                    <ThemedText style={styles.errorText} lightColor={'#FF3B30'}>
                      {error}
                    </ThemedText>
                  )}

                  {/* Таймер и кнопка повторной отправки */}
                  <View style={styles.resendContainer}>
                    {isTimerActive ? (
                      <ThemedText style={styles.timerText} lightColor={'#80818B'}>
                        Отправить код еще раз через 00:{timer.toString().padStart(2, '0')}
                      </ThemedText>
                    ) : (
                      <TouchableOpacity onPress={handleResendCode} activeOpacity={0.7}>
                        <ThemedText style={styles.resendText} lightColor={'#203686'}>
                          Отправить код еще раз
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </View>
          </ThemedView>
        </ThemedView>
      {/* </View> */}
      {/* </SafeAreaView> */}
      </SafeAreaProvider>
      {/* </SafeAreaView> */}
    </Modal>


  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    
  },
  modalContent: {
    // backgroundColor: '#ffff',
    // paddingTop: 30, 
    minHeight: '100%',
  },
  modalContentInner:{

    minHeight: '70%',
    paddingHorizontal: 20,
    paddingTop: 62,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  logoContainer: {
    alignItems: 'flex-start',
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    alignContent: 'center'
  },
  logoContainerInner:{
    marginTop: 5
  },
  logoText: {
    fontWeight: '500',
    fontSize: 14,
    lineHeight:17
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
  },
  afterLogoContent: {
    marginTop: 40,
  },
  modalDescription: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalDescriptionAfterPhone: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center'

  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    height: 50,
    width: '100%',
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1B1B1C',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    borderRadius: 6,
  },
  checkboxContainerInner: {
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 14
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 0,
    backgroundColor: '#F2F4F7'
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  checkboxLink: {
    textDecorationLine: 'none',
    fontWeight: '600',
    color: '#203686'
  },
  modalLoginButton: {
    height: 56,
    backgroundColor: '#203686',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalLoginButtonDisabled: {
    backgroundColor: 'rgba(32, 54, 134, 0.5)',
  },
  modalLoginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Стили для экрана подтверждения кода
  modalTitleAfterPhone: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center'
  },
  codeInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  codeInput: {
    width: 50,
    height: 50,
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    color: '#1B1B1C',
    textAlign: 'center',
  },
  codeInputError: {
    borderWidth: 1,
    borderColor: '#FF3B30',
    backgroundColor: '#FF3B3010',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 14,
    fontWeight: 500,
    color: 'rgba(32, 54, 134, 0.5)'
  },
  resendText: {
    fontSize: 14,
    fontWeight: 500,
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});