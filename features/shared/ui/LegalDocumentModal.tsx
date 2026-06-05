import { ModalHeader } from '@/features/auth/ui/Header';
import { ThemedView } from '@/components/themed-view';
import {
  getLegalDocumentTitle,
  LegalDocumentViewer,
} from '@/features/shared/ui/LegalDocumentViewer';
import type { LegalDocumentId } from '@/features/shared/legal/buildLegalHtml';
import React from 'react';
import { Modal, StyleSheet } from 'react-native';

type LegalDocumentModalProps = {
  visible: boolean;
  documentId: LegalDocumentId | null;
  operatorEmail?: string;
  onClose: () => void;
};

export const LegalDocumentModal: React.FC<LegalDocumentModalProps> = ({
  visible,
  documentId,
  operatorEmail,
  onClose,
}) => {
  if (!documentId) {
    return null;
  }

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <ThemedView lightColor="#EBEDF0" darkColor="#040508" style={styles.container}>
        <ModalHeader
          title={getLegalDocumentTitle(documentId)}
          showBackButton
          onBackPress={onClose}
        />
        <ThemedView
          lightColor="#FFFFFF"
          darkColor="#151516"
          style={styles.content}
        >
          <LegalDocumentViewer
            documentId={documentId}
            operatorEmail={operatorEmail}
          />
        </ThemedView>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
});
