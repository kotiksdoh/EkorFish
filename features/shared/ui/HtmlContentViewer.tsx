import { wrapHtmlContent } from '@/features/shared/utils/wrapHtmlContent';
import { webViewSurfaceStyles } from '@/features/shared/ui/webViewSurfaceStyles';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useCallback, useMemo } from 'react';
import { Linking, View } from 'react-native';
import { WebView } from 'react-native-webview';

type HtmlContentViewerProps = {
  html: string;
  title?: string;
};

export const HtmlContentViewer: React.FC<HtmlContentViewerProps> = ({
  html,
  title,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const wrappedHtml = useMemo(
    () => wrapHtmlContent(html, { isDark, title }),
    [html, isDark, title],
  );

  const handleShouldStartLoad = useCallback((request: { url: string }) => {
    const { url } = request;
    if (
      url.startsWith('mailto:') ||
      url.startsWith('tel:') ||
      url.startsWith('http://') ||
      url.startsWith('https://')
    ) {
      void Linking.openURL(url);
      return false;
    }
    return true;
  }, []);

  return (
    <View style={webViewSurfaceStyles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: wrappedHtml }}
        javaScriptEnabled={false}
        style={webViewSurfaceStyles.webView}
        showsVerticalScrollIndicator
        nestedScrollEnabled
        onShouldStartLoadWithRequest={handleShouldStartLoad}
      />
    </View>
  );
};
