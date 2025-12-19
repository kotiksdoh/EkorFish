import CloseIcon from '@/assets/icons/AuthIcons/Close.svg';
import Checkbox from 'expo-checkbox'; // Импортируем нормальный чекбокс
import React, { useState } from 'react';
import {
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
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

  const handleLogin = () => {
    if (!phoneNumber || !agreedToTerms) {
      // Можно добавить валидацию или показ ошибки
      return;
    }
    onLogin(phoneNumber);
    setPhoneNumber('');
    setAgreedToTerms(false);
  };

  const isLoginButtonDisabled = !phoneNumber || !agreedToTerms;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          
          {/* Крестик закрытия */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <CloseIcon width={20} height={20}  />
          </TouchableOpacity>

          {/* Логотип */}
          <View style={styles.logoContainer}>
            {/* <SvgIcon name="logo" size={48} color="#203686" /> */}
          </View>

          {/* Заголовок */}
          <Text style={styles.modalTitle}>Авторизация</Text>

          {/* Описание */}
          <Text style={styles.modalDescription}>
            Мы отправим сообщение с кодом{'\n'}для входа.
          </Text>

          {/* Поле ввода номера */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Номер телефона"
              placeholderTextColor="rgba(32, 54, 134, 0.5)"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={11}
            />
          </View>

          {/* Чекбокс согласия */}
          <View style={styles.checkboxContainer}>
            <Checkbox
              style={styles.checkbox}
              value={agreedToTerms}
              onValueChange={setAgreedToTerms}
              color={agreedToTerms ? '#203686' : undefined}
            />
            <Text style={styles.checkboxText}>
              Я принимаю{' '}
              <Text style={styles.checkboxLink}>Политику конфиденциальности</Text>
              {'\n'}и{' '}
              <Text style={styles.checkboxLink}>Согласие на обработку персональных данных</Text>
            </Text>
          </View>

          {/* Кнопка Войти */}
          <TouchableOpacity
            style={[
              styles.modalLoginButton,
              isLoginButtonDisabled && styles.modalLoginButtonDisabled
            ]}
            onPress={handleLogin}
            disabled={isLoginButtonDisabled}
            activeOpacity={0.8}
          >
            <Text style={styles.modalLoginButtonText}>Войти</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    // backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#EBEDF0',
    // borderTopLeftRadius: 24,
    // borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
    minHeight: '100%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  logoContainer: {
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#203686',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#203686',
    lineHeight: 24,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    height: 50,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#203686',
    borderWidth: 1,
    borderColor: 'rgba(32, 54, 134, 0.2)',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: '#203686',
    lineHeight: 20,
  },
  checkboxLink: {
    textDecorationLine: 'underline',
    fontWeight: '600',
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
});