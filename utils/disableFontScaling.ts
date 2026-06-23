import { Text, TextInput, type TextInputProps, type TextProps } from 'react-native';

type ComponentWithDefaultProps<P> = {
  defaultProps?: Partial<P>;
};

const RNText = Text as typeof Text & ComponentWithDefaultProps<TextProps>;
const RNTextInput = TextInput as typeof TextInput & ComponentWithDefaultProps<TextInputProps>;

if (RNText.defaultProps == null) RNText.defaultProps = {};
RNText.defaultProps.allowFontScaling = false;

if (RNTextInput.defaultProps == null) RNTextInput.defaultProps = {};
RNTextInput.defaultProps.allowFontScaling = false;
