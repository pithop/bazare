import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../theme';

// Bottom sheet réutilisable : poignée, titre, croix, contenu scrollable
export default function Sheet({ visible, onClose, title, subtitle, children, maxHeight = '88%' }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { maxHeight }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    paddingBottom: 28,
  },
  handle: {
    alignSelf: 'center', width: 42, height: 5, borderRadius: 3,
    backgroundColor: COLORS.borderLight, marginTop: 10,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6,
  },
  headerText: { flex: 1, marginRight: 10 },
  title: { color: COLORS.text, fontSize: SIZES.xxl, fontWeight: '800' },
  subtitle: { color: COLORS.textMuted, fontSize: SIZES.md, marginTop: 2 },
  closeBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flex: 0 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
});
