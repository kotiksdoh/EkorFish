import { Platform, StyleSheet, type ViewStyle } from 'react-native';

export const WEB_VIEW_SURFACE_RADIUS = 24;

export const webViewSurfaceContainerStyle: ViewStyle = {
  flex: 1,
  overflow: 'hidden',
  borderTopLeftRadius: WEB_VIEW_SURFACE_RADIUS,
  borderTopRightRadius: WEB_VIEW_SURFACE_RADIUS,
};

export const webViewScreenWrapperStyle: ViewStyle = {
  flex: 1,
  marginTop: 8,
  overflow: 'hidden',
  borderTopLeftRadius: WEB_VIEW_SURFACE_RADIUS,
  borderTopRightRadius: WEB_VIEW_SURFACE_RADIUS,
};

export const webViewSurfaceStyles = StyleSheet.create({
  container: {
    ...webViewSurfaceContainerStyle,
    backgroundColor: 'transparent',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        borderTopLeftRadius: WEB_VIEW_SURFACE_RADIUS,
        borderTopRightRadius: WEB_VIEW_SURFACE_RADIUS,
      },
      default: {},
    }),
  },
});
