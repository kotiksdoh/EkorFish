import { BriefcaseIcon, CloseIcon, LogoIcon, ProfileIcon } from '@/assets/icons/icons.js';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CustomCheckbox } from '@/features/shared/ui/components/CustomCheckBox';
import AnimatedTextInput from '@/features/shared/ui/components/CustomInput';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { PrimaryButton } from '@/features/home';
import { DatePickerWithIcon } from '@/features/shared/ui/components/DatePickerCustom';
import SmartInput from '@/features/shared/ui/components/SmartInput';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { compliteCompany, compliteProfile, getCode, searchCompany, sendCode } from '../../authSlice';
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
}

export enum ScreensScenario {
  ACC_TYPE = 'acc_type', // экран выбора типа акк
  USER_REG = 'user_reg', // экран рега юзера
  COMPANY_SEARCH = 'company_search', // экран поиска компании
  COMPANY_REG = 'company_reg', // экран реги компании
  COMPANY_PICK = 'company_pick',// экран выбора компании
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

  const [currentScenario, setCurrentScenarion] = useState<AuthScenario>(AuthScenario.DEFAULT)
  const [currentScreen, setCurrentScreen] = useState<ScreensScenario>(ScreensScenario.ACC_TYPE)

  const [surname, setSurname] = useState('')
  const [name, setName] = useState('')
  const [secondName, setSecondName] = useState('')
  const [birthDate, setBirthDate] = useState('17.01.2002')

  const [orgName, setOrgName] = useState('')
  const [kpp, setKpp] = useState('')
  const [legalAddress, setLegalAddress] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [dateCreated, setDateCreated] = useState('17.01.2002')
  // const [phone, setPhone] = useState(phoneNumber)
  // const [email, setEmail] = useState('')

  const [inn, setInn] = useState('')

  const insets = useSafeAreaInsets();
  const codeInputRefs = useRef<TextInput[]>([]);
  const [isPasting, setIsPasting] = useState(false);

  const loading = useAppSelector((state) => state.auth.isLoading);
  const company = useAppSelector((state) => state.auth.company);


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
        }else if(!res.payload.data.data.needUserType && res.payload.data.data.needInformationForType === null){
            resetModal()
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
        resetModal()
        handleClose()
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
      if(compliteProfile.fulfilled.match(res)){
        resetModal()
        handleClose()
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
      "legalAddress": company.legalAddress,
      "contactPerson": company.contactPerson
    })).then((res) => 
      {
      if(compliteProfile.fulfilled.match(res)){
        resetModal()
        handleClose()
      }
      }
    )
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
                      <TouchableOpacity  disabled={loading} onPress={handleResendCode} activeOpacity={0.7}>
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
      : (currentScenario === AuthScenario.NEED_ACC_TYPE && currentScreen === ScreensScenario.ACC_TYPE) ?
          <ThemedView lightColor={'#EBEDF0'} style={styles.modalContent}>
            <ModalHeader
              title='Регистрация'
              showBackButton={true}
              onBackPress={
                () =>{
                    setCurrentScenarion(AuthScenario.DEFAULT)
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
                    selectedAccountType === 'personal' ? stylesAccType.accountTypeCardSelected : stylesAccType.accountTypeCardDefault
                  ]}
                  onPress={() => setSelectedAccountType('personal')}
                >
                  {/* Иконка для частного лица (замени на свою SVG иконку) */}
                  <View style={stylesAccType.accountTypeIcon}>
                    <ProfileIcon/>
                  </View>
                  <ThemedText style={stylesAccType.accountTypeText}>
                    Частное лицо
                  </ThemedText>
                </TouchableOpacity>
                
                {/* Карточка "Бизнес-аккаунт" */}
                <TouchableOpacity 
                  style={[
                    stylesAccType.accountTypeCard,
                    selectedAccountType === 'business' ? stylesAccType.accountTypeCardSelected : stylesAccType.accountTypeCardDefault
                  ]}
                  onPress={() => setSelectedAccountType('business')}
                >
                  {/* Иконка для бизнеса (замени на свою SVG иконку) */}
                  <View style={stylesAccType.accountTypeIcon}>
                    <BriefcaseIcon/>
                  </View>
                  <ThemedText style={stylesAccType.accountTypeText}>
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
      <ThemedView lightColor={'#EBEDF0'} style={styles.modalContent}>
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

      <ThemedView lightColor={'#EBEDF0'} style={styles.modalContent}>
        <ModalHeader
          title='Привязка к компании'
          showBackButton={true}
          onBackPress={() => {
              setCurrentScenarion(AuthScenario.NEED_ACC_TYPE)
              setCurrentScreen(ScreensScenario.ACC_TYPE)
          }}
        />
        <ThemedView style={stylesRegUser.modalContentInnerRegUser} lightColor={'#FFFFFF'}>
          <View>
            <ThemedText style={stylesAccType.accountTypeTitle}>
              Данные вашей компании
            </ThemedText>
            <View style={stylesRegUser.inputConteiner}>
              <AnimatedTextInput
                placeholder="ИНН"
                placeholderTextColor="#80818B"
                value={inn}
                onChangeText={setInn}
              />
            </View>
          </View>
          <View style={stylesRegUser.buttonUserReg}>
            <PrimaryButton
                title="Найти компанию"
                onPress={() => handleSearchCompany()}
                variant="primary"
                size="md"
                loading={loading}
                activeOpacity={0.8}
                fullWidth
                disabled={loading}
                style={stylesAccType.continueButton}
              />
            </View>
        </ThemedView>
      </ThemedView>
      : currentScreen === ScreensScenario.COMPANY_PICK ?
      <ThemedView lightColor={'#EBEDF0'} style={styles.modalContent}>
        <ModalHeader
          title='Привязка к компании'
          showBackButton={true}
          onBackPress={() => {
              setCurrentScreen(ScreensScenario.COMPANY_SEARCH)
          }}
        />
        <ThemedView style={stylesRegUser.modalContentInnerRegUser} lightColor={'#FFFFFF'}>
          {
          // Object.keys(company).length === 0 
          company === null ?
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
                Компания с таким ИНН не найдена
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
          :
            <View>
              <ThemedText style={stylesAccType.accountTypeTitle}>
                  Проверьте данные
              </ThemedText>
              <ThemedText lightColor='#80818B'>
                  Мы нашли вашу компанию в нашей базе:
              </ThemedText>
              <View>
                <ThemedText>
                  {company?.name}
                </ThemedText>
                <View>
                  <ThemedText>
                    ИНН/КПП
                  </ThemedText>
                  <ThemedText>
                    {company?.inn}/{company?.kpp}
                  </ThemedText>
                </View>
                <View>
                  <ThemedText>
                    Юр. адрес
                  </ThemedText>
                  <ThemedText>
                    {company?.legalAddress}
                  </ThemedText>
                </View>
              </View>
              <View style={stylesRegUser.buttonUserReg}>
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

          }
        </ThemedView>
      </ThemedView>
      : currentScreen === ScreensScenario.COMPANY_REG ?
      <ThemedView lightColor={'#EBEDF0'} style={styles.modalContent}>
        <ModalHeader
          title='Привязка к компании'
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
            onPress={() => handelCompliteOrg()}
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
      : null}
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

const stylesError = StyleSheet.create({
  errorContainer: {
    display: 'flex',
    justifyContent:'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 'auto'
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