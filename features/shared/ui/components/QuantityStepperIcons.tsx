import { IconQuantityMinus, IconQuantityPlus } from "@/assets/icons/icons";
import { useColorScheme } from "@/hooks/use-color-scheme";

type QuantityStepperIconProps = {
  disabled?: boolean;
};

function getQuantityStepperColor(isDarkMode: boolean) {
  return isDarkMode ? "#FBFCFF" : "#1B1B1C";
}

export function QuantityStepperMinusIcon({
  disabled = false,
}: QuantityStepperIconProps) {
  const isDarkMode = useColorScheme() === "dark";

  return (
    <IconQuantityMinus
      color={getQuantityStepperColor(isDarkMode)}
      disabled={disabled}
    />
  );
}

export function QuantityStepperPlusIcon({
  disabled = false,
}: QuantityStepperIconProps) {
  const isDarkMode = useColorScheme() === "dark";

  return (
    <IconQuantityPlus
      color={getQuantityStepperColor(isDarkMode)}
      disabled={disabled}
    />
  );
}
