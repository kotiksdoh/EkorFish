import { BriefcaseIcon, CloseIcon, LogoIcon, MessageIcon, PhoneIcon, ProfileIcon } from '@/assets/icons/icons.js';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CustomCheckbox } from '@/features/shared/ui/components/CustomCheckBox';
import AnimatedTextInput from '@/features/shared/ui/components/CustomInput';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { PrimaryButton } from '@/features/home';
import { DatePickerWithIcon } from '@/features/shared/ui/components/DatePickerCustom';
// import SmartInput from '@/features/shared/ui/components/SmartInput';
import SmartInput from '@/features/shared/ui/components/SmartInput';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import manager from '../../../../assets/icons/png/manager.png';
import { compliteCompany, compliteProfile, getCode, getMyInfo, searchCompany, sendCode } from '../../authSlice';
import { ModalHeader } from '../Header';
// import Error from '../../../../assets/icons/png/error.png'
interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  onLogin: (phoneNumber: string) => void;
  enumFlag?: string;
}

export enum AuthScenario {
  DEFAULT = 'login', //дефолт сценарий для появления логин страницы
  NEED_ACC_TYPE = 'need_acc_type', // сценарий на выбора типа аккаунта 
  REG_NEED = 'reg_need', // сценарий для необходимой регисатрации
  NEED_COMPANY = 'need_company', //сценарий на попадание выбор типа аккаунта

  PHIS_USER = 'phis_user'// Экран подтверждения физ лица

}

export enum ScreensScenario {
  ACC_TYPE = 'acc_type', // экран выбора типа акк
  USER_REG = 'user_reg', // экран рега юзера
  COMPANY_SEARCH = 'company_search', // экран поиска компании
  COMPANY_REG = 'company_reg', // экран реги компании
  COMPANY_PICK = 'company_pick',// экран выбора компании

  PHIS_USER = 'phis_user'// Экран подтверждения физ лица
}

export const LoginModal: React.FC<LoginModalProps> = ({
  enumFlag,
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

  const [selectedAccountType, setSelectedAccountType] = useState('')

  // const [currentScenario, setCurrentScenarion] = useState<AuthScenario>(AuthScenario.NEED_ACC_TYPE)
  // const [currentScreen, setCurrentScreen] = useState<ScreensScenario>(ScreensScenario.COMPANY_SEARCH)


  const [currentScenario, setCurrentScenarion] = useState<AuthScenario>(AuthScenario.DEFAULT)
  const [currentScreen, setCurrentScreen] = useState<ScreensScenario>(ScreensScenario.ACC_TYPE)

  const [surname, setSurname] = useState('')
  const [name, setName] = useState('')
  const [secondName, setSecondName] = useState('')
  const [birthDate, setBirthDate] = useState('')

  const [orgName, setOrgName] = useState('')
  const [kpp, setKpp] = useState('')
  const [legalAddress, setLegalAddress] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [dateCreated, setDateCreated] = useState('')
  // const [phone, setPhone] = useState(phoneNumber)
  // const [email, setEmail] = useState('')

  const [inn, setInn] = useState('')

  const insets = useSafeAreaInsets();
  const codeInputRefs = useRef<TextInput[]>([]);
  const [isPasting, setIsPasting] = useState(false);

  const loading = useAppSelector((state) => state.auth.isLoading);
  const company = useAppSelector((state) => state.auth.company);
  const predUserData = useAppSelector((state) => state.auth.predUserData);
  // const company = {
  //   id: 1,
  //   inn: 1111,
  //   kpp: 1111,
  //   name: 'OOO Romashka',
  //   foundationDate: '17.01.2002',
  //   legalAddress: 'OOO Romashka',
  //   contactPerson: 'OOO Romashka'
  // }
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
    })).then((res: any) => {
      if(getCode.fulfilled.match(res)){
        setShowCodeInput(true);
        setIsTimerActive(true);
        setError(null);
      }else{
        return;
      }
    })
  };
  const handlePasteCode = async (pastedText: string) => {
    // Очищаем текст от всего, кроме цифр
    const cleanedCode = pastedText.replace(/\D/g, '');
    
    // Берем первые 4 цифры
    const codeDigits = cleanedCode.substring(0, 4).split('');
    
    if (codeDigits.length === 4) {
      // Заполняем все поля
      const newCode = [...confirmationCode];
      codeDigits.forEach((digit, index) => {
        if (index < 4) {
          newCode[index] = digit;
        }
      });
      
      setConfirmationCode(newCode);
      
      // Фокусируемся на последнем поле
      if (codeInputRefs.current[3]) {
        codeInputRefs.current[3].focus();
      }
      
      // Автоматически отправляем на проверку
      setTimeout(() => {
        verifyCode(newCode.join(''));
      }, 100);
    } else if (codeDigits.length > 0) {
      // Если вставили меньше 4 цифр, заполняем сколько есть
      const newCode = [...confirmationCode];
      codeDigits.forEach((digit, index) => {
        if (index < 4) {
          newCode[index] = digit;
          if (codeInputRefs.current[index]) {
            codeInputRefs.current[index].focus();
          }
        }
      });
      setConfirmationCode(newCode);
    }
  };
  const handleCodeInputChange = (text: string, index: number) => {
    // Автоматически обрабатываем вставку длинного текста
    if (text.length > 1) {
      // Очищаем текст от всего, кроме цифр
      const cleanedCode = text.replace(/\D/g, '');
      const codeDigits = cleanedCode.substring(0, 4).split('');
      
      if (codeDigits.length === 4) {
        // Заполняем все поля
        const newCode = [...confirmationCode];
        codeDigits.forEach((digit, idx) => {
          if (idx < 4) {
            newCode[idx] = digit;
          }
        });
        
        setConfirmationCode(newCode);
        
        // Фокусируемся на последнем поле
        if (codeInputRefs.current[3]) {
          codeInputRefs.current[3].focus();
        }
        
        // Автоматически отправляем на проверку
        setTimeout(() => {
          verifyCode(newCode.join(''));
        }, 100);
        return;
      }
    }
    
    // Обычная обработка одного символа
    const singleChar = text.length > 0 ? text.charAt(text.length - 1) : '';
    
    const newCode = [...confirmationCode];
    newCode[index] = singleChar;
    setConfirmationCode(newCode);
    
    if (singleChar && index < 3) {
      codeInputRefs.current[index + 1]?.focus();
    }
    
    if (!singleChar && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
    
    if (newCode.every(char => char !== '')) {
      verifyCode(newCode.join(''));
    }
  };


  const handleKeyPress = (event: any, index: number) => {
    if (event.nativeEvent.key === 'Backspace' && !confirmationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };


  const verifyCode = (code: string) => {
    dispatch(sendCode({contact: phoneNumber, verificationCode: code})).then((res: any) => 
    {
      if(sendCode.fulfilled.match(res)){
        //TODO дальнейший сценарий
        // setError(null);
        // onLogin(phoneNumber);
        debugger
        console.log('res.payload', res.payload)
        console.log('res.payload.data', res.payload.data)
        console.log('res.payload.data.data', res.payload.data.data)


        if(res.payload.data.data.needUserType){
            setCurrentScenarion(AuthScenario.NEED_ACC_TYPE)
            setCurrentScreen(ScreensScenario.ACC_TYPE)
            debugger
        }else if(!res.payload.data.data.needUserType && res.payload.data.data.needInformationForType === 'Individual'){
            setCurrentScenarion(AuthScenario.REG_NEED)
            setCurrentScreen(ScreensScenario.USER_REG)
            debugger
        }else if(!res.payload.data.data.needUserType && res.payload.data.data.needInformationForType === 'Legal')
        {
            setCurrentScenarion(AuthScenario.NEED_ACC_TYPE)
            setCurrentScreen(ScreensScenario.ACC_TYPE)
            debugger
        }else if(!res.payload.data.data.needUserType && (res.payload.data.data.needInformationForType === null || res.payload.data.data.needInformationForType === undefined) ){
          console.log('dfdfdfffff')
          dispatch(getMyInfo('')).then((res) => {
            if(getMyInfo.fulfilled.match(res)){
              // resetModal()
              // handleClose()
              console.log('res?.payload?.data?.data',res?.payload?.data?.data)
              if(res?.payload?.data?.data?.companies.length > 0){
                  resetModal()
                  handleClose()
              }else{
              setCurrentScenarion(AuthScenario.PHIS_USER)
              setCurrentScreen(ScreensScenario.PHIS_USER)
              }
              console.log(res)
            }
          })
        }
        // setCurrentScenarion()
        
        debugger
        // resetModal();
      }else{
        setError('Неверный код подтверждения');
        setConfirmationCode(['', '', '', '']);
        codeInputRefs.current[0]?.focus();
      }
      debugger
    }
    )
  };

  const handleResendCode = () => {
    dispatch(getCode({
      contact: phoneNumber
    })).then((res: any) => {
      if(getCode.fulfilled.match(res)){
        if (!isTimerActive) {
          setTimer(60);
          setIsTimerActive(true);
          setError(null);
        }
      }else{
        return;
      }
    })

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

  const handelCompliteProfile = () => {
    dispatch(compliteProfile({
      // email: email,
      firstName: name,
      lastName: surname,
      patronymic: secondName,
      birthDate: birthDate,
      // contact: phone
    })).then((res) => 
      {
      if(compliteProfile.fulfilled.match(res)){
        dispatch(getMyInfo('')).then((res) => {
          if(getMyInfo.fulfilled.match(res)){
            setCurrentScreen(ScreensScenario.ACC_TYPE)
            setCurrentScenarion(AuthScenario.DEFAULT)
            resetModal()
            handleClose()
          }
        })
      }
      }
    )
  }

  const handleAcceptCompany = () => {
    dispatch(compliteCompany({
      "name": orgName,
      "inn": inn,
      "foundationDate": dateCreated,
      "kpp": kpp,
      "legalAddress": legalAddress,
      "contactPerson": contactPerson
    })).then((res) => 
      {
      if(compliteCompany.fulfilled.match(res)){
        dispatch(getMyInfo('')).then((res) => {
          if(getMyInfo.fulfilled.match(res)){
            setCurrentScreen(ScreensScenario.ACC_TYPE)
            setCurrentScenarion(AuthScenario.DEFAULT)
            resetModal()
            handleClose()
          }
        })
      }
      }
    )
  }
  const handelCompliteOrg = () => {
    dispatch(compliteCompany({
      "id": company?.id,
      "name": company?.name,
      "inn": company?.inn,
      "foundationDate": company?.foundationDate,
      "kpp": company?.kpp,
      "legalAddress": company?.legalAddress,
      "contactPerson": company?.contactPerson
    })).then((res) => 
      {
      if(compliteProfile.fulfilled.match(res)){
        // resetModal()
        // handleClose()
        dispatch(getMyInfo('')).then((res) => {
          if(getMyInfo.fulfilled.match(res)){
            setCurrentScreen(ScreensScenario.ACC_TYPE)
            setCurrentScenarion(AuthScenario.DEFAULT)
            resetModal()
            handleClose()
          }
        })

      }
      }
    )
  }
  const handleInitUser = () => {
    dispatch(getMyInfo('')).then((res) => {
      if(getMyInfo.fulfilled.match(res)){
        setCurrentScreen(ScreensScenario.ACC_TYPE)
        setCurrentScenarion(AuthScenario.DEFAULT)
        resetModal()
        handleClose()
      }
    })
  }
  const handleSearchCompany = () => {
    dispatch(searchCompany({search: inn})).then((res: any) =>
      {
        if(searchCompany.rejected.match(res)){
          setCurrentScreen(ScreensScenario.COMPANY_PICK)
        }else{
          setCurrentScreen(ScreensScenario.COMPANY_PICK)
        }
      }
    )
  }
  const systemTheme = useColorScheme(); 
  const currentTheme = systemTheme || 'light' 
  const codeInputBackgroundColor = currentTheme === 'dark' ? '#ECEFFA0D' : '#F2F4F7';
  const codeInputColor = currentTheme === 'dark' ? '#FBFCFF' : '#1B1B1C';
  const managerButtonsColor = currentTheme === 'dark' ? '#2E2E32' : '#FFFFFF';
  const isDarkMode = currentTheme === 'dark';

const getCardStyle = (isSelected: boolean) => {
  if (isDarkMode) {
    return isSelected 
      ? stylesAccType.accountTypeCardSelectedDark
      : stylesAccType.accountTypeCardDefaultDark;
  } else {
    return isSelected
      ? stylesAccType.accountTypeCardSelected
      : stylesAccType.accountTypeCardDefault;
  }
};
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <SafeAreaProvider>
      {currentScenario === 'login' ?
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
              <LogoIcon theme={currentTheme}/>
              </View>
              <ThemedText style={styles.logoText} lightColor={'#80818B'} darkColor='#70798E'>
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
                  
                  <ThemedText style={styles.modalDescription} lightColor={'#80818B'} darkColor='#FBFCFF80'>
                    Мы отправим сообщение с кодом{'\n'}для входа.
                  </ThemedText>

                  <View style={styles.inputContainer}>
                    {/* <AnimatedTextInput
                      // style={styles.input}
                      placeholder="Номер телефона или E-mail"
                      placeholderTextColor="#80818B"
                      keyboardType="phone-pad"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      // autoFocus
                    /> */}
                    <SmartInput
                      placeholder="Номер телефона или E-mail"
                      placeholderTextColor="#80818B"
                      value={phoneNumber}
                      onChangeText={(cleanText, formattedText, isPhone) => {
                        console.log('Чистый номер для бэка:', cleanText); // "79999998899"
                        console.log('Форматированный текст:', formattedText); // "+7 (999) 999-88-99"
                        console.log('Это телефон?', isPhone); // true или false
                        setPhoneNumber(cleanText);
                      }}
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
                        lightColor={'#F2F4F7'}
                        darkColor={'#202022'}
                      />
                    </View>
                    <ThemedText style={styles.checkboxText} lightColor={'#80818B'} darkColor='#FBFCFF80'>
                      Я принимаю{' '}
                      <ThemedText lightColor='#203686' darkColor='#4C94FF' style={styles.checkboxLink}>Политику конфиденциальности</ThemedText>
                      {'\n'}и{' '}
                      <ThemedText lightColor='#203686' darkColor='#4C94FF' style={styles.checkboxLink}>Согласие на обработку персональных данных</ThemedText>
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
                </>
              ) : (
                // ЭКРАН ПОДТВЕРЖДЕНИЯ КОДА
                <>
                  {/* Заголовок */}
                  <ThemedText style={styles.modalTitleAfterPhone} lightColor={'#1B1B1C'}>
                    Код подтверждения
                  </ThemedText>
                  
                  {/* Описание */}
                  <ThemedText style={styles.modalDescriptionAfterPhone} lightColor={'#80818B'} darkColor='#FBFCFF80'>
                    Мы отправили 4-x значный код{'\n'}на номер +{phoneNumber}.
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
                          { backgroundColor: codeInputBackgroundColor, color: codeInputColor },
                          error && styles.codeInputError,
                          loading && styles.codeInputDisabled
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
                        editable={!loading}
                        selectTextOnFocus={!loading}
                        contextMenuHidden={loading}
                      />
                    ))}
                  </View>
                  {/* Сообщение об ошибке */}
                  {/* {error && (
                    <ThemedText style={styles.errorText} lightColor={'#FF3B30'}>
                      {error}
                    </ThemedText>
                  )} */}

                  {/* Таймер и кнопка повторной отправки */}
                  <View style={styles.resendContainer}>
                    {isTimerActive ? (
                      <ThemedText style={styles.timerText} lightColor={'#80818B'} darkColor={'#4C94FF'}>
                        Отправить код еще раз • 00:{timer.toString().padStart(2, '0')}
                      </ThemedText>
                    ) : (
                      <TouchableOpacity  disabled={loading} onPress={handleResendCode} activeOpacity={0.7}>
                        <ThemedText style={styles.resendText} lightColor={'#203686'} darkColor='#4C94FF'>
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
      : (currentScenario === AuthScenario.NEED_ACC_TYPE && currentScreen === ScreensScenario.ACC_TYPE) ?
          <ThemedView lightColor={'#EBEDF0'} darkColor='#040508' style={styles.modalContent}>
            <ModalHeader
              title='Регистрация'
              showBackButton={true}
              onBackPress={
                () =>{
                    setCurrentScenarion(AuthScenario.DEFAULT)
                    //
                    resetModal()
                    // setConfirmationCode(['', '', '', '']);
                    // setTimer(60);
                    // setIsTimerActive(false);
                    // setError(null);
                    // setShowCodeInput(false);
                    // setPhoneNumber()
                }
              }
            />
            <ThemedView style={stylesAccType.modalContentInnerReg} lightColor={'#FFFFFF'}>
              
              {/* Заголовок выбора типа аккаунта */}
              <ThemedText style={stylesAccType.accountTypeTitle}>
                Выберите тип аккаунта
              </ThemedText>
              
              {/* Контейнер для карточек выбора */}
              <View style={stylesAccType.accountTypeContainer}>
                
                {/* Карточка "Частное лицо" */}
              <TouchableOpacity 
                style={[
                  stylesAccType.accountTypeCard,
                  getCardStyle(selectedAccountType === 'personal')
                ]}
                onPress={() => setSelectedAccountType('personal')}
              >
                <View style={stylesAccType.accountTypeIcon}>
                  <ProfileIcon 
                    theme={currentTheme}
                    isSelected={selectedAccountType === 'personal'}
                    fill={currentTheme === 'dark' ? 
                      (selectedAccountType === 'personal' ? '#4C94FF' : '#FBFCFF80')
                      :
                      (selectedAccountType === 'personal' ? '#1B1B1C' : '#1B1B1C')
                    }
                  />
                </View>
                <ThemedText darkColor={
                      selectedAccountType === 'personal' ? '#4C94FF' : '#FBFCFF80'
                } 
                lightColor={
                    selectedAccountType === 'personal' ? '#203686' : '#1B1B1C'
                } style={[
                  stylesAccType.accountTypeText,
                ]}>
                  Частное лицо
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  stylesAccType.accountTypeCard,
                  getCardStyle(selectedAccountType === 'business')
                ]}
                onPress={() => setSelectedAccountType('business')}
              >
                <View style={stylesAccType.accountTypeIcon}>
                  <BriefcaseIcon 
                    theme={currentTheme}
                    isSelected={selectedAccountType === 'business'}
                    fill={currentTheme === 'dark' ? 
                      (selectedAccountType === 'business' ? '#4C94FF' : '#FBFCFF80')
                      :
                      (selectedAccountType === 'business' ? '#1B1B1C' : '#1B1B1C')
                    }

                  />
                </View>
                <ThemedText darkColor={
                      selectedAccountType === 'business' ? '#4C94FF' : '#FBFCFF80'
                } 
                lightColor={
                    selectedAccountType === 'business' ? '#203686' : '#1B1B1C'
                } style={[
                  stylesAccType.accountTypeText,
                ]}>
                  Бизнес-аккаунт
                </ThemedText>
              </TouchableOpacity>
                
              </View>
              
              {/* Кнопка "Продолжить" */}
              <PrimaryButton
                title="Продолжить"
                onPress={() => {
                  // currentScreen === ScreensScenario.USER_REG
                  console.log('ffffff', AsyncStorage.getItem('token'))
                  if(selectedAccountType === 'personal'){
                    setCurrentScreen(ScreensScenario.USER_REG)
                  }else{
                    setCurrentScreen(ScreensScenario.COMPANY_SEARCH)
                  }
                }}
                variant="primary"
                size="md"
                loading={loading}
                activeOpacity={0.8}
                fullWidth
                disabled={!selectedAccountType}
                style={stylesAccType.continueButton}
              />
              
            </ThemedView>
          </ThemedView>
      : (currentScenario === AuthScenario.REG_NEED || currentScreen === ScreensScenario.USER_REG) ?
      <ThemedView lightColor={'#EBEDF0'} darkColor='#040508' style={styles.modalContent}>
        <ModalHeader
          title='Регистрация'
          showBackButton={true}
          onBackPress={
            () =>{
              if(currentScenario === AuthScenario.NEED_ACC_TYPE){
                setCurrentScenarion(AuthScenario.NEED_ACC_TYPE)
                setCurrentScreen(ScreensScenario.ACC_TYPE)
              }else{
                setCurrentScenarion(AuthScenario.DEFAULT)
              }
            }
          }
        />
        <ThemedView style={stylesRegUser.modalContentInnerRegUser} lightColor={'#FFFFFF'}>
          <View>
          <ThemedText style={stylesAccType.accountTypeTitle}>
            Заполните ваши данные
          </ThemedText>
          <View style={stylesRegUser.inputConteiner}>
            <AnimatedTextInput
              placeholder="Фамилия"
              placeholderTextColor="#80818B"
              value={surname}
              onChangeText={setSurname}
            />
            <AnimatedTextInput
              placeholder="Имя"
              placeholderTextColor="#80818B"
              value={name}
              onChangeText={setName}
            />
            <AnimatedTextInput
              placeholder="Отчество"
              placeholderTextColor="#80818B"
              value={secondName}
              onChangeText={setSecondName}
            />
            <DatePickerWithIcon
              placeholder="Дата рождения"
              placeholderTextColor="#80818B"
              // TODO
              value={birthDate}
              onChangeText={setBirthDate}
            />
            {/* <AnimatedTextInput
              placeholder="Телефон"
              placeholderTextColor="#80818B"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <AnimatedTextInput
              placeholder="E-mail"
              placeholderTextColor="#80818B"
              value={email}
              onChangeText={setEmail}
            /> */}
          </View>
          </View>
          <View style={stylesRegUser.buttonUserReg}>
          <PrimaryButton
            title="Продолжить"
            onPress={() => handelCompliteProfile()}
            variant="primary"
            size="md"
            loading={loading}
            activeOpacity={0.8}
            fullWidth
            disabled={!birthDate || !secondName || !name || !surname || loading}
            style={stylesAccType.continueButton}
          />
          </View>
        </ThemedView>
      </ThemedView>
      : currentScreen === ScreensScenario.COMPANY_SEARCH ?

      <ThemedView lightColor={'#EBEDF0'} darkColor='#040508' style={styles.modalContent}>
        <ModalHeader
          title= {
            ( predUserData?.needUserType === false && predUserData?.needInformationForType === 'Legal') 
              ? 'Привязка к компании' 
              : 'Регистрация'
            }
          // 'Привязка к компании'
          showBackButton={true}
          onBackPress={() => {
              setCurrentScenarion(AuthScenario.NEED_ACC_TYPE)
              setCurrentScreen(ScreensScenario.ACC_TYPE)
          }}
        />

        <ThemedView lightColor={'#FFFFFF'} style={[stylesRegUser.modalContentInnerRegUser, { flex: 1 }]}>
          <View >
            {/* <ThemedText style={stylesAccType.accountTypeTitle}>
              Данные вашей компании
            </ThemedText> */}
            { ( predUserData?.needUserType === false && predUserData?.needInformationForType === 'Legal')  ?
            <ThemedText style={stylesSearchComp.textUp}>
              Ваш номер телефона найден, но не привязан к компании. Пожалуйста, введите ИНН вашей организации.
            </ThemedText>
            : <></>
            }
            <View style={stylesRegUser.inputConteiner}>
              <AnimatedTextInput
                placeholder="ИНН"
                placeholderTextColor="#80818B"
                value={inn}
                onChangeText={setInn}
                maxLength={10}
                // keyboardType="phone-pad"
                // autoFocus={true} // Автофокус на поле
              />
            </View>
            { !inn ? 
            <ThemedText lightColor='#80818B' darkColor='#FBFCFF80' style={stylesSearchComp.textDown}>
              На данном этапе можно добавить только одну компанию. Остальные вы сможете привязать позже в личном кабинете.
            </ThemedText>
            : <></>
            }
          </View>
          <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        // style={stylesRegUser.modalContentInnerRegUser}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
          <View style={[
            stylesSearchComp.buttonUserReg // Поднимаем кнопку
          ]}>
            <PrimaryButton
              title="Найти компанию"
              onPress={() => handleSearchCompany()}
              variant="primary"
              size="md"
              loading={loading}
              activeOpacity={0.8}
              fullWidth
              disabled={loading || inn.length < 10}
              style={stylesAccType.continueButton}
            />
          </View>
          </KeyboardAvoidingView>

        </ThemedView>
      </ThemedView>
      : currentScreen === ScreensScenario.COMPANY_PICK ?
      <ThemedView lightColor={'#EBEDF0'} darkColor='#040508' style={styles.modalContent}>
        <ModalHeader
          title= {
            ( predUserData?.needUserType === false && predUserData?.needInformationForType === 'Legal') 
              ? 'Привязка к компании' 
              : 'Регистрация'
            }
          showBackButton={true}
          onBackPress={() => {
              setCurrentScreen(ScreensScenario.COMPANY_SEARCH)
          }}
        />
          {
          // Object.keys(company).length === 0 
          company === null ?
        <ThemedView style={stylesError.modalContentErr} lightColor={'#FFFFFF'}>
            <View style={stylesError.errorContainer}>
              <Image
                source={require('../../../../assets/icons/png/error.png')} // Замените на путь к вашей картинке
                style={styles.image}
                resizeMode="contain"
              />
              <ThemedText style={stylesError.mainErr}>
                Ошибка
              </ThemedText>
              <ThemedText lightColor='#80818B' style={stylesError.secondErr}>
                Компания с таким ИНН не найдена или привязана к другому номеру
              </ThemedText>
              {/* <View> */}
                <PrimaryButton
                  title="Ввести данные компании"
                  onPress={() => {
                    setCurrentScreen(ScreensScenario.COMPANY_REG)
                    // setInn('')
                    }
                  }
                  variant="primary"
                  size="md"
                  loading={loading}
                  activeOpacity={0.8}
                  fullWidth
                  disabled={loading}
                  style={stylesError.continueButton}
                />
              {/* </View> */}
            </View>
        </ThemedView>

          :
        <>
        <ThemedView style={stylesCompany.main} lightColor={'#FFFFFF'}>

            <View>
              <ThemedText style={stylesAccType.accountTypeTitle}>
                  Проверьте данные
              </ThemedText>
              <ThemedText lightColor='#80818B'>
                  Мы нашли несколько компаний привязанных к вашему логину:
              </ThemedText>
              <ThemedView 
                lightColor='#F2F4F7'
                darkColor='#F2F4F7'
                style={stylesCompany.companyContainer}
              >
                {/* Название компании */}
                <ThemedText 
                  style={stylesCompany.companyName}
                  lightColor='#1B1B1C'
                  darkColor='#1B1B1C'
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {company?.name}
                </ThemedText>
                
                {/* ИНН/КПП */}
                <View style={stylesCompany.row}>
                  <ThemedText 
                    style={stylesCompany.label}
                    lightColor='#80818B'
                    darkColor='#80818B'
                  >
                    ИНН/КПП:
                  </ThemedText>
                  <ThemedText 
                    style={stylesCompany.value}
                    lightColor='#1B1B1C'
                    darkColor='#1B1B1C'
                  >
                    {company?.inn}/{company?.kpp}
                  </ThemedText>
                </View>
                
                {/* Юридический адрес */}
                <View style={stylesCompany.row}>
                  <ThemedText 
                    style={stylesCompany.label}
                    lightColor='#80818B'
                    darkColor='#80818B'
                  >
                    Юр. адрес:
                  </ThemedText>
                  <ThemedText 
                    style={stylesCompany.value}
                    lightColor='#1B1B1C'
                    darkColor='#1B1B1C'
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {company?.legalAddress}
                  </ThemedText>
                </View>
              </ThemedView>
              <View style={stylesCompany.button}>
                <PrimaryButton
                    title="Подтвердить"
                    onPress={() => handelCompliteOrg()}
                    variant="primary"
                    size="md"
                    loading={loading}
                    activeOpacity={0.8}
                    fullWidth
                    disabled={loading}
                    style={stylesAccType.continueButton}
                  />
              </View>
            </View>
        </ThemedView>
        <ThemedView style={stylesCompany.main} lightColor={'#FFFFFF'}>
          <ThemedText style={stylesAccType.accountTypeTitle}>
            Если данные не верны,{'\n'}свяжитесь с менеджером
          </ThemedText>
              <ThemedView style={stylesManager.container} lightColor='#F2F4F7' darkColor='#202022'>
              <ThemedText 
                style={stylesManager.yourManager}
                lightColor='#80818B'
                darkColor='#80818B'
              >
                Ваш менеджер
              </ThemedText>
              
              <View style={stylesManager.managerInfo}>
                {/* Фото менеджера */}
                <View style={stylesManager.avatarContainer}>
                  <Image
                    source={manager}
                    // source={{ uri: 'https://example.com/manager-photo.jpg' }} 
                    style={stylesManager.avatar}
                    resizeMode="cover"
                  />
                </View>
                
                {/* Имя менеджера */}
                <View style={stylesManager.nameContainer}>
                  <ThemedText 
                    style={stylesManager.managerName}
                    lightColor='#1B1B1C'
                    darkColor='#FBFCFF'
                    numberOfLines={2}
                  >
                    Иванова Мария Сергеевна
                  </ThemedText>
                </View>
              </View>
              
              <View style={stylesManager.actionsContainer}>
                <ThemedView style={stylesManager.bigButton} lightColor='#FFFFFF' darkColor='#2E2E32'>
                <TouchableOpacity 
                //
                  style={[ stylesManager.actionButton]}
                  onPress={() => console.log('Написать сообщение')}
                  activeOpacity={0.7}
                >
                  <View style={stylesManager.buttonContent}>
                    <MessageIcon fill={currentTheme === 'dark' ? '#FBFCFF' : '#203686'} width={24} height={24} />
                    <ThemedText 
                      style={stylesManager.buttonText}
                      lightColor='#203686'
                      darkColor='#FBFCFF'
                    >
                      Написать
                    </ThemedText>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[ stylesManager.actionButton]}
                  onPress={() => console.log('Позвонить')}
                  activeOpacity={0.7}
                >
                  <View style={stylesManager.buttonContent}>
                    <PhoneIcon fill={currentTheme === 'dark' ? '#FBFCFF' : '#203686'} width={24} height={24} />
                    <ThemedText 
                      style={stylesManager.buttonText}
                      lightColor='#203686'
                      darkColor='#FBFCFF'
                    >
                      Позвонить
                    </ThemedText>
                  </View>
                </TouchableOpacity>
                </ThemedView>
              </View>
          </ThemedView>
        </ThemedView>

        </>
          }
      </ThemedView>
      : currentScreen === ScreensScenario.COMPANY_REG ?
      <ThemedView lightColor={'#EBEDF0'} darkColor='#040508' style={styles.modalContent}>
        <ModalHeader
          title= {
            ( predUserData?.needUserType === false && predUserData?.needInformationForType === 'Legal') 
              ? 'Привязка к компании' 
              : 'Регистрация'
            }
          showBackButton={true}
          onBackPress={() => {
              setCurrentScreen(ScreensScenario.COMPANY_SEARCH)
          }}
        />
        <ThemedView style={stylesRegUser.modalContentInnerRegUser} lightColor={'#FFFFFF'}>
          <View>
          <ThemedText style={stylesAccType.accountTypeTitle}>
            Введите данные компании
          </ThemedText>
          {/* const [orgName, setOrgName] = useState('')
  const [kpp, setKpp] = useState('')
  const [legalAddress, setLegalAddress] = useState('')
  const [contactPerson, setContactPerson] = useState('') */}
          <View style={stylesRegCompany.regCompanyBlock}>
            <AnimatedTextInput
              placeholder="Полное наименование организации"
              placeholderTextColor="#80818B"
              value={orgName}
              onChangeText={setOrgName}
            />
            <AnimatedTextInput
              placeholder="ИНН"
              placeholderTextColor="#80818B"
              value={inn}
              onChangeText={setInn}
              maxLength={10}
              // keyboardType="phone-pad"
            />
            <AnimatedTextInput
              placeholder="КПП"
              placeholderTextColor="#80818B"
              value={kpp}
              onChangeText={setKpp}
            />
            <AnimatedTextInput
              placeholder="Юридический адрес"
              placeholderTextColor="#80818B"
              value={legalAddress}
              onChangeText={setLegalAddress}
            />
            <AnimatedTextInput
              placeholder="ФИО контактного лица"
              placeholderTextColor="#80818B"
              value={contactPerson}
              onChangeText={setContactPerson}
            />
            <DatePickerWithIcon
              placeholder="Дата образования вашей компании"
              placeholderTextColor="#80818B"
              // TODO
              value={dateCreated}
              onChangeText={setDateCreated}
            />
          
          </View>
          </View>
          <View style={stylesRegUser.buttonUserReg}>
          <PrimaryButton
            title="Продолжить"
            onPress={() => handleAcceptCompany()}
            variant="primary"
            size="md"
            loading={loading}
            activeOpacity={0.8}
            fullWidth
            disabled={!orgName || !inn || !kpp || !legalAddress || !contactPerson || !dateCreated ||  loading}
            style={stylesAccType.continueButton}
          />
          </View>
        </ThemedView>
      </ThemedView>
      : currentScreen === ScreensScenario.PHIS_USER ? 
      <ThemedView lightColor={'#FFFFFF'} style={styles.modalContent}>
        <ThemedView lightColor={'#FFFFFF'} style={phisUser.innerContainer}>
            <View style={phisUser.attention}>
            <Image
                source={require('../../../../assets/icons/png/warning.png')} 
                style={styles.image}
                resizeMode="contain"
              />
              <ThemedText style={phisUser.attentionMainText}>
                Внимание!
              </ThemedText>
              <ThemedText lightColor='#80818B' darkColor='#FBFCFF80' style={phisUser.attentionSecondText}>
                Данный номер телефона в нашей базе числится как аккаунт физического лица.
              </ThemedText>
            </View>
            <View style={phisUser.underWarningText}>
              <ThemedText>
                Если вы планировали войти как юридическое лицо или у вас есть бизнес-аккаунт, пожалуйста, свяжитесь с вашим менеджером для внесения исправлений.
              </ThemedText>

              <ThemedView style={stylesManager.container} lightColor='#F2F4F7' darkColor='#202022'>
              <ThemedText 
                style={stylesManager.yourManager}
                lightColor='#80818B'
                darkColor='#80818B'
              >
                Ваш менеджер
              </ThemedText>
              
              <View style={stylesManager.managerInfo}>
                {/* Фото менеджера */}
                <View style={stylesManager.avatarContainer}>
                  <Image
                    source={manager}
                    // source={{ uri: 'https://example.com/manager-photo.jpg' }} 
                    style={stylesManager.avatar}
                    resizeMode="cover"
                  />
                </View>
                
                {/* Имя менеджера */}
                <View style={stylesManager.nameContainer}>
                  <ThemedText 
                    style={stylesManager.managerName}
                    lightColor='#1B1B1C'
                    darkColor='#FBFCFF'
                    numberOfLines={2}
                  >
                    Иванова Мария Сергеевна
                  </ThemedText>
                </View>
              </View>
              
              <View style={stylesManager.actionsContainer}>
                <ThemedView style={stylesManager.bigButton} lightColor='#FFFFFF' darkColor='#2E2E32'>
                <TouchableOpacity 
                //
                  style={[ stylesManager.actionButton]}
                  onPress={() => console.log('Написать сообщение')}
                  activeOpacity={0.7}
                >
                  <View style={stylesManager.buttonContent}>
                    <MessageIcon fill={currentTheme === 'dark' ? '#FBFCFF' : '#203686'} width={24} height={24} />
                    <ThemedText 
                      style={stylesManager.buttonText}
                      lightColor='#203686'
                      darkColor='#FBFCFF'
                    >
                      Написать
                    </ThemedText>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[ stylesManager.actionButton]}
                  onPress={() => console.log('Позвонить')}
                  activeOpacity={0.7}
                >
                  <View style={stylesManager.buttonContent}>
                    <PhoneIcon fill={currentTheme === 'dark' ? '#FBFCFF' : '#203686'} width={24} height={24} />
                    <ThemedText 
                      style={stylesManager.buttonText}
                      lightColor='#203686'
                      darkColor='#FBFCFF'
                    >
                      Позвонить
                    </ThemedText>
                  </View>
                </TouchableOpacity>
                </ThemedView>
              </View>
          </ThemedView>
            </View>
            <View style={phisUser.button}>
            <PrimaryButton
            title="Продолжить"
            onPress={() => handleInitUser()}
            variant="primary"
            size="md"
            loading={loading}
            activeOpacity={0.8}
            fullWidth
            // disabled={}
            
          />
          </View>
        </ThemedView>

      </ThemedView>
      : <></>}
      </SafeAreaProvider>
    </Modal>
  );
};

const styles = StyleSheet.create({
  image: {
    width: 86,
    height: 86,
  },
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
    marginRight: 13
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 0,
    // backgroundColor: '#F2F4F7'
  },
  checkboxText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  checkboxLink: {
    textDecorationLine: 'none',
    fontWeight: '500',
    // color: '#203686',
    fontSize: 13,
  },
  modalLoginButton: {
    height: 56,
    // backgroundColor: '#203686',
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
    // color: '#1B1B1C',
    textAlign: 'center',
  },
  codeInputError: {
    borderWidth: 1,
    borderColor: '#FF3B30',
    backgroundColor: '#FF3B3010',
  },
  codeInputDisabled: {
    backgroundColor: '#F2F4F7',
    opacity: 0.5,
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
  resendTextDisabled: {
    opacity: 0.5,
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

const stylesAccType = StyleSheet.create({
  modalContent: {
    flex: 1,
  },
  modalContentInner: {
    flex: 1,
    padding: 16,
  },
  modalContentInnerReg: {
    marginTop: 8,
    padding: 16,
    borderRadius: 24
  },
  accountTypeTitle: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 16,
    // textAlign: 'center',
  },
  accountTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 8
  },
  accountTypeCard: {
    // width: 181,
    height: 92,
    borderRadius: 16,
    paddingBottom: 16,
    paddingTop: 16,
    paddingLeft: 31,
    paddingRight: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountTypeCardDefault: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F3F7',
    color: '#1B1B1C'
  },
  accountTypeCardSelected: {
    backgroundColor: '#ECF5FE',
    borderWidth: 1,
    borderColor: '#203686',
    color: '#203686'

  },
  accountTypeCardDefaultDark: {
    backgroundColor: '#151516',
    borderWidth: 1,
    borderColor: '#252527',
  },
  accountTypeCardSelectedDark: {
    backgroundColor: 'rgba(56, 129, 238, 0.1)', // прозрачный синий
    borderWidth: 1,
    borderColor: '#3881EE',
  },
  
  accountTypeIcon: {
    marginBottom: 8,
  },
  accountTypeText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  continueButton: {
    marginTop: 'auto',
  },
})

const stylesRegUser = StyleSheet.create({
  inputConteiner: {
    gap: 16
  },
  modalContentInnerRegUser: {
    marginTop: 8,
    padding: 16,
    borderRadius: 24,
    height: '90%',
    justifyContent:'space-between'
  },
  buttonUserReg: {
    // marginTop: 'auto',
    marginBottom: 120
  }
})

const stylesSearchComp = StyleSheet.create({
  inputConteiner: {
    gap: 16
  },
  modalContentInnerRegUser: {
    marginTop: 8,
    padding: 16,
    borderRadius: 24,
    height: '90%',
    justifyContent:'space-between'
  },
  buttonUserReg: {
    // marginTop: 'auto',
    marginBottom: 60
  },
  textUp:{
    fontWeight: 500,
    marginBottom: 24,
    fontSize: 16
  },
  textDown:{
    fontWeight: 400,
    fontSize: 14,
    marginTop: 4
  }
})

const stylesError = StyleSheet.create({
  modalContentErr: {
    marginTop: 8,
    padding: 16,
    borderRadius: 24,
    height: '100%',
    justifyContent:'space-between'
  },
  errorContainer: {
    display: 'flex',
    justifyContent:'center',
    alignItems: 'center',
    marginTop: '40%',
    marginBottom: '50%'
  },
  mainErr:{
    fontWeight: 600,
    fontSize: 24,
    marginTop: 24,

  },
  secondErr:{
    fontWeight: 500,
    fontSize: 16,
    marginTop: 8,
    marginBottom:24,
  },
  continueButton: {
    // marginTop: 24,
  },
})

const stylesRegCompany = StyleSheet.create({
  regCompanyBlock: {
      marginTop: 24,
      gap: 16
  }
})

const stylesCompany = StyleSheet.create({
  button: {

  },
  main:{
    // paddingHorizontal: 16
    marginTop: 8,
    padding: 16,
    borderRadius: 24,
    // height: '100%',
    justifyContent:'space-between'
  },
  companyContainer: {
    width: '100%',
    minHeight: 104,
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
    alignSelf: 'center', 
  },
  companyName: {
    fontFamily: 'Montserrat',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 20, // 16 * 1.25 = 20
    letterSpacing: 0,
    marginBottom: 16,
    fontVariant: ['lining-nums', 'proportional-nums'],
  },
  row: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  label: {
    fontFamily: 'Montserrat',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 18.2, // 14 * 1.3 = 18.2
    letterSpacing: 0,
    // flex: 1, // Занимает 1 часть
    marginRight: 8,
  },
  value: {
    fontFamily: 'Montserrat',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 18.2,
    letterSpacing: 0,
    // flex: 2, // Занимает 2 части (в 2 раза шире лейбла)
    textAlign: 'right',
    fontVariant: ['lining-nums', 'proportional-nums'],
  },
});

const stylesManager = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 232,
    borderRadius: 16,
    paddingTop: 12,
    paddingRight: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    alignSelf: 'center',
    marginTop: 16,
  },
  bigButton:{
    display:'flex',
    flexDirection:'row',
    borderRadius: 16,
    paddingHorizontal: 32,
    gap: 28
  },

  yourManager: {
    fontFamily: 'Montserrat',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 18.2, // 14 * 1.3 = 18.2
    letterSpacing: -0.02, // -2%
    marginBottom: 16,
    fontVariant: ['lining-nums', 'proportional-nums'],
  },
  managerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 100,
  },
  nameContainer: {
    flex: 1,
  },
  managerName: {
    fontFamily: 'Montserrat',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: 0,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // gap: 8,
  },
  actionButton: {
    // flex: 1,
    height: 48,
    borderRadius: 16,
    // backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
    // paddingRight: 12,
    paddingBottom: 8,
    // paddingLeft: 12,
    // borderWidth: 1,
    // borderColor: '#F0F3F7',
    // shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontFamily: 'Montserrat',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 16, // 16 * 1.0 = 16
    letterSpacing: 0,
    // fontVariant: ['lining-nums', 'proportional-nums'],
  },
});
const phisUser = StyleSheet.create({
  innerContainer: {
    width: '100%',
    minHeight: 232,
    borderRadius: 16,
    paddingTop: 12,
    paddingRight: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    alignSelf: 'center',
    marginTop: 20,
  },
  attention:{
    display:'flex',
    justifyContent:'center',
    alignItems:'center'
    // flexDirection:
  },
  attentionMainText:{
    fontWeight: 600,
    fontSize: 24,
    marginTop: 24
  },
  attentionSecondText:{
    textAlign: 'center',
    fontWeight: 500,
    fontSize: 16,
    marginTop: 8,

  },
  underWarningText:{
    marginTop: 24,
    fontSize: 16,
    fontWeight: 500,
    marginBottom: 24
  },
  button:{
    marginTop: '28%'
  }
})
