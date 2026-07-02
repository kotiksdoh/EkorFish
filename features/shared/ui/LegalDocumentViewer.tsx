import React, { useCallback, useMemo } from 'react';
import { Linking, View } from 'react-native';
import { WebView } from 'react-native-webview';
import {
  buildLegalDocumentHtml,
  LEGAL_DOCUMENT_TITLES,
  type LegalDocumentId,
} from '@/features/shared/legal/buildLegalHtml';
import { webViewSurfaceStyles } from '@/features/shared/ui/webViewSurfaceStyles';
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
    <View style={webViewSurfaceStyles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        javaScriptEnabled={false}
        style={webViewSurfaceStyles.webView}
        showsVerticalScrollIndicator
        nestedScrollEnabled
        onShouldStartLoadWithRequest={handleShouldStartLoad}
      />
    </View>
  );
};
