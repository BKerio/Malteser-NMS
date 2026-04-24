import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Switch } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme, colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
                <Ionicons name={isDark ? "moon" : "sunny"} size={22} color={colors.primary} />
              </View>
              <Text style={[styles.rowText, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#cbd5e1', true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.section, styles.logoutSection, { borderColor: '#ef4444' }]}
          onPress={() => router.replace('/(auth)/login')}
        >
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="log-out" size={22} color="#ef4444" />
              </View>
              <Text style={[styles.rowText, { color: '#ef4444' }]}>Sign Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ef4444" />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowText: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutSection: {
    marginTop: 'auto',
    backgroundColor: '#fff',
  },
});
