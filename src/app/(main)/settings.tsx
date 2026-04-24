import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  Platform,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import Slider from '@react-native-community/slider';

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme, colors } = useTheme();
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [textSize, setTextSize] = useState(1.0);
  const [boldText, setBoldText] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  const handleLogoutConfirm = () => {
    setIsLogoutModalVisible(false);
    router.replace('/(auth)/login');
  };

  const SettingItem = ({ icon, title, subtitle, onPress, iconType = 'Ionicons', color = '#000' }: any) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.card }]} 
      onPress={onPress}
    >
      <View style={styles.cardIconContainer}>
        {iconType === 'Ionicons' ? (
          <Ionicons name={icon} size={22} color={color} />
        ) : iconType === 'Material' ? (
          <MaterialCommunityIcons name={icon} size={22} color={color} />
        ) : (
          <FontAwesome5 name={icon} size={20} color={color} />
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Logout Confirmation Modal */}
      <Modal
        visible={isLogoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={styles.modalIconCircle}>
              <MaterialCommunityIcons name="logout" size={40} color="#0a1d37" />
            </View>
            
            <Text style={[styles.modalTitle, { color: colors.text }]}>Logout</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              Are you sure you want to log out?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.stayButton]} 
                onPress={() => setIsLogoutModalVisible(false)}
              >
                <Text style={styles.stayButtonText}>Stay</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmLogoutButton]} 
                onPress={handleLogoutConfirm}
              >
                <Text style={styles.confirmLogoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Navy Header */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Application Settings</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Settings */}
        <SettingItem 
          icon="person" 
          title="Update my account" 
          subtitle="Edit personal details and profile images"
          onPress={() => {}}
        />

        <SettingItem 
          icon="help-circle" 
          title="Help & Support" 
          subtitle="How to use the app, payments, and more"
          onPress={() => {}}
        />

        <SettingItem 
          icon="moon" 
          title="Dark Mode" 
          subtitle={isDark ? "Currently using dark theme" : "Currently using light theme"}
          onPress={toggleTheme}
          color={isDark ? colors.primary : '#334155'}
        />

        <SettingItem 
          icon="log-out" 
          title="Logout" 
          subtitle="Sign out of this device"
          onPress={() => setIsLogoutModalVisible(true)}
          color="#ef4444"
        />

        <SettingItem 
          icon="Monitor" 
          title="Responsive preview" 
          subtitle="See how layouts adapt on Windows, macOS or Linux"
          onPress={() => {}}
        />

        {/* Accessibility Section */}
        <View style={[styles.accessibilityCard, { backgroundColor: colors.card }]}>
          {/* Accessibility Mode */}
          <View style={styles.accessRow}>
            <View style={styles.accessLeft}>
              <Ionicons name="accessibility" size={24} color={colors.text} style={styles.accessIcon} />
              <View>
                <Text style={[styles.accessTitle, { color: colors.text }]}>Accessibility Mode</Text>
                <Text style={[styles.accessSubtitle, { color: colors.textSecondary }]}>Larger text and higher contrast</Text>
              </View>
            </View>
            <Switch
              value={accessibilityMode}
              onValueChange={setAccessibilityMode}
              trackColor={{ false: '#cbd5e1', true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {/* Text Size Slider */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <MaterialCommunityIcons name="format-size" size={24} color={colors.text} />
              <Text style={[styles.sliderLabel, { color: colors.text }]}>Text size</Text>
              <Text style={[styles.sliderValue, { color: colors.textSecondary }]}>{textSize.toFixed(1)}x</Text>
            </View>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0.5}
              maximumValue={2.0}
              value={textSize}
              onValueChange={setTextSize}
              minimumTrackTintColor="#22c55e"
              maximumTrackTintColor="#cbd5e1"
              thumbTintColor="#22c55e"
            />
          </View>

          {/* Bold Text Toggle */}
          <View style={styles.accessRow}>
            <View style={styles.accessLeft}>
              <MaterialCommunityIcons name="format-bold" size={24} color={colors.text} style={styles.accessIcon} />
              <Text style={[styles.accessTitle, { color: colors.text }]}>Bold text</Text>
            </View>
            <Switch
              value={boldText}
              onValueChange={setBoldText}
              trackColor={{ false: '#cbd5e1', true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#0a1d37', // Dark navy from image
    paddingBottom: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif-medium',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
  },
  accessibilityCard: {
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  accessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  accessLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accessIcon: {
    marginRight: 16,
  },
  accessTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  accessSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sliderContainer: {
    marginBottom: 25,
    paddingHorizontal: 4,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 16,
    flex: 1,
  },
  sliderValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '90%',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 0.47,
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stayButton: {
    backgroundColor: '#1e2322', // Teal color from design
  },
  stayButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmLogoutButton: {
    backgroundColor: '#0a1d37', // Navy color from design
  },
  confirmLogoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
