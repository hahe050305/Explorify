import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';

type SortOption = {
  label: string;
  value: string;
};

interface Props {
  selected: string;
  onChange: (value: string) => void;
  options: SortOption[];
}

/**
 * Accessible dropdown component for sorting selections.
 * Uses native Picker on Android and iOS, wrapped in an accessible View.
 */
const SortDropdown: React.FC<Props> = ({ selected, onChange, options }) => {
  return (
    <View style={styles.container} accessible accessibilityLabel="Sort options">
      <Text style={styles.label}>Sort by:</Text>
      <Picker
        selectedValue={selected}
        onValueChange={onChange}
        style={styles.picker}
        mode="dropdown"
        accessibilityLabel="Sorting picker"
      >
        {options.map(opt => (
          <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
        ))}
      </Picker>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  label: {
    marginRight: 8,
    fontSize: 14,
    color: '#555',
  },
  picker: {
    flex: 1,
    ...Platform.select({
      android: { height: 40 },
      ios: { height: 180 },
    }),
  },
});

export default SortDropdown;
