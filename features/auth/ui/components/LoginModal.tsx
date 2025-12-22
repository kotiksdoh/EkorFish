import CloseIcon from '@/assets/icons/AuthIcons/Close.svg';
import LogoIcon from '@/assets/icons/AuthIcons/logo.svg';
import { ThemedText } from '@/components/themed-text';
import { CustomCheckbox } from '@/features/shared/ui/components/CustomCheckBox';
import AnimatedTextInput from '@/features/shared/ui/components/CustomInput';

import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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
            <LogoIcon  />
            <ThemedText style={styles.logoContainer} lightColor={'#80818B'} >Поставки продуктов{'\n'}для HoReCa</ThemedText>
          </View>

          <View style={styles.afterLogoContent}>
          {/* Заголовок */}
          <ThemedText style={styles.modalTitle} lightColor={'#1B1B1C'}>Авторизация</ThemedText>
            {/* Описание */}
            <ThemedText style={styles.modalDescription} lightColor={'#80818B'}>
              Мы отправим сообщение с кодом{'\n'}для входа.
            </ThemedText>

            {/* Поле ввода номера */}
            <View style={styles.inputContainer}>
              {/* <TextInput
                style={styles.input}
                placeholder="Номер телефона или E-mail"
                placeholderTextColor="#80818B"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                maxLength={11}
              /> */}
              <AnimatedTextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>

            {/* Чекбокс согласия */}
            <View style={styles.checkboxContainer}>
              <View style={styles.checkboxContainerInner}>
              <CustomCheckbox
                style={styles.checkbox}
                value={agreedToTerms}
                onValueChange={setAgreedToTerms}
                // color={agreedToTerms ? '#203686' : undefined}
                // hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              />
              </View>
              <ThemedText style={styles.checkboxText} lightColor={'#80818B'} >
                Я принимаю{' '}
                <Text style={styles.checkboxLink}>Политику конфиденциальности</Text>
                {'\n'}и{' '}
                <Text style={styles.checkboxLink}>Согласие на обработку персональных данных</Text>
              </ThemedText>
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
    backgroundColor: '#ffff',
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
    display:'flex',
    flexDirection: 'row',
    gap: 12,
    alignContent: 'center'
  },
  logoText: {
    fontWeight: 500,
    fontSize: 14,

  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    // color: '#203686',
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
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    height: 50,
    width: '100%',
    backgroundColor: '#03051E08',
    borderRadius: 12,
    paddingHorizontal: 12,
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
    // width: 20,
    // height: 20,
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
    // color: '#203686',
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
});