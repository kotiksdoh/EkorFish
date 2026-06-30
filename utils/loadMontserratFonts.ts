import { MONTSERRAT_FONT_FILES } from '@/constants/montserratFonts';
import * as Font from 'expo-font';

export async function loadMontserratFonts(): Promise<void> {
  await Font.loadAsync(MONTSERRAT_FONT_FILES);
}
