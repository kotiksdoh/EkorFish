import React, { useCallback, useMemo } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import {
  buildLegalDocumentHtml,
  LEGAL_DOCUMENT_TITLES,
  type LegalDocumentId,
} from '@/features/shared/legal/buildLegalHtml';
import { useColorScheme } from '@/hooks/use-color-scheme';

type LegalDocumentViewerProps = {
  documentId: LegalDocumentId;
  operatorEmail?: string;
};

export function getLegalDocumentTitle(documentId: LegalDocumentId): string {
  return LEGAL_DOCUMENT_TITLES[documentId];
}

export const LegalDocumentViewer: React.FC<LegalDocumentViewerProps> = ({
  documentId,
  operatorEmail,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const html = useMemo(
    () =>
      buildLegalDocumentHtml({
        documentId,
        isDark,
        operatorEmail,
      }),
    [documentId, isDark, operatorEmail],
  );

  const handleShouldStartLoad = useCallback((request: { url: string }) => {
    const { url } = request;
    if (url.startsWith('mailto:')) {
      void Linking.openURL(url);
      return false;
    }
    return true;
  }, []);

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
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
