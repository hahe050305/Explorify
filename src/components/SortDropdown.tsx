import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';
import COLORS from '../constants/colors';

type SortOption = {
  label: string;
  value: string;
};

interface Props {
  selected: string;
  onChange: (value: string) => void;
  options: SortOption[];
  containerStyle?: any;
}

/**
 * Modern, accessible dropdown component for sorting selections.
 * Features a refined pill trigger button with active state indicator and a sleek selection modal.
 */
const SortDropdown: React.FC<Props> = ({ selected, onChange, options, containerStyle }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const currentOption = options.find(opt => opt.value === selected) || options[0];

  const handleSelect = (val: string) => {
    onChange(val);
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Compact Trigger Button */}
      <TouchableOpacity
        style={styles.triggerButton}
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={`Sort: ${currentOption?.label ?? 'options'}`}>
        <Text style={styles.sortIcon}>⇅</Text>
        <Text style={styles.sortButtonText} numberOfLines={1}>
          Sort
        </Text>
        <Text style={styles.chevronIcon}>▾</Text>
      </TouchableOpacity>

      {/* Dropdown / Bottom Sheet Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Sort Products</Text>
                <Text style={styles.modalSubtitle}>Select how you want to sort items</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Options List */}
            <FlatList
              data={options}
              keyExtractor={item => item.value}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isSelected = item.value === selected;
                return (
                  <TouchableOpacity
                    style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                    activeOpacity={0.7}
                    onPress={() => handleSelect(item.value)}>
                    <View style={styles.optionTextRow}>
                      <Text
                        style={[
                          styles.optionLabel,
                          isSelected && styles.optionLabelSelected,
                        ]}>
                        {item.label}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  sortIcon: {
    fontSize: 18,
    color: COLORS.text,
    marginRight: 4,
    fontWeight: '700',
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  chevronIcon: {
    fontSize: 12,
    color: COLORS.subtext,
    marginLeft: 3,
    marginTop: -1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    paddingBottom: 28,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'left',
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  listContent: {
    paddingTop: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginVertical: 4,
    backgroundColor: 'transparent',
  },
  optionItemSelected: {
    backgroundColor: '#F0F4FF',
  },
  optionTextRow: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  optionLabelSelected: {
    fontWeight: '700',
    color: COLORS.accent,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioCircleSelected: {
    borderColor: COLORS.accent,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
  },
});

export default SortDropdown;
