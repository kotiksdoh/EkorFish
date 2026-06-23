import { Text, TextInput, type TextInputProps, type TextProps } from 'react-native';

import { FIXED_TEXT_PROPS } from './fixedTextStyle';

type ComponentWithDefaultProps<P> = {
  defaultProps?: Partial<P>;
};

const RNText = Text as typeof Text & ComponentWithDefaultProps<TextProps>;
const RNTextInput = TextInput as typeof TextInput & ComponentWithDefaultProps<TextInputProps>;

if (RNText.defaultProps == null) RNText.defaultProps = {};
Object.assign(RNText.defaultProps, FIXED_TEXT_PROPS);

if (RNTextInput.defaultProps == null) RNTextInput.defaultProps = {};
Object.assign(RNTextInput.defaultProps, FIXED_TEXT_PROPS);
