import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.welcomeText, { color: colors.text }]}>Hello, User!</Text>
          <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>Welcome to Multerser</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: colors.card }]}
            onPress={() => router.push('/(main)/settings')}
          >
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.card }]}>
            <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="rocket-outline" size={48} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Everything is Ready</Text>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
            Your login and authentication system is now fully functional with Dark Mode support.
          </Text>
        </View>
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
    paddingHorizontal: 24,
    paddingTop: 20,
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitleText: {
    fontSize: 16,
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
