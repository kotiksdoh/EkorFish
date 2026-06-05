import { wrapHtmlContent } from '@/features/shared/utils/wrapHtmlContent';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useCallback, useMemo } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
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
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: wrappedHtml }}
        javaScriptEnabled={false}
        style={styles.webView}
        showsVerticalScrollIndicator
        nestedScrollEnabled
        onShouldStartLoadWithRequest={handleShouldStartLoad}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
