import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const [showId, setShowId] = useState(false);

  const QuickAccessItem = ({ icon, label, color = '#0a1d37' }: any) => (
    <TouchableOpacity style={styles.quickAccessItem}>
      <View style={[styles.quickAccessIcon, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={28} color="#fff" />
      </View>
      <Text style={[styles.quickAccessLabel, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: '#f8f9fc' }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.avatarContainer}>
                <Image 
                  source={{ uri: 'https://i.pravatar.cc/150?u=brian' }} 
                  style={styles.avatar} 
                />
              </View>
              <View style={styles.userText}>
                <Text style={styles.greeting}>Good Evening 👋,</Text>
                <Text style={styles.userName}>Brian kerio.</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="search" size={24} color="#334155" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="notifications-outline" size={24} color="#334155" />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
            </View>
          </View>
          {/* Membership Card */}
          <View style={styles.membershipCardContainer}>
            <ImageBackground 
              source={{ uri: 'https://www.transparenttextures.com/patterns/cubes.png' }}
              style={styles.membershipCard}
              imageStyle={{ opacity: 0.1, tintColor: '#000' }}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardWelcome}>Karibu, PCEA SGM CHURCH</Text>
              </View>
              
              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="mail-outline" size={16} color="#64748b" />
                  <Text style={styles.detailText}>briankerio47@gmail.com</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={16} color="#64748b" />
                  <Text style={styles.detailText}>Role: Member</Text>
                </View>
              </View>

              <View style={styles.idSection}>
                <View style={styles.idLabelContainer}>
                  <Text style={styles.idLabel}>My Kanisa No:</Text>
                  <Text style={styles.idNumber}>PCEA-267XYK</Text>
                </View>
                <TouchableOpacity onPress={() => setShowId(!showId)}>
                  <Ionicons name={showId ? "eye-outline" : "eye-off-outline"} size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
            </ImageBackground>
          </View>

          {/* Quick Access Grid */}
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickAccessGrid}>
            <QuickAccessItem icon="wallet-outline" label="Contributions Summary" />
            <QuickAccessItem icon="cellphone-nfc" label="M-Pesa Giving" />
            <QuickAccessItem icon="bullhorn-outline" label="Church Announcements" />
            <QuickAccessItem icon="flag-outline" label="My Pledges" />
            <QuickAccessItem icon="account-group-outline" label="My Groups" />
            <QuickAccessItem icon="calendar-month-outline" label="Church Events" />
          </View>
          
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Custom Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(main)/home')}>
          <Ionicons name="grid" size={24} color="#0a1d37" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="chatbox-outline" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>Inbox</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.centerButton}>
          <View style={styles.centerButtonInner}>
            <MaterialCommunityIcons name="wallet" size={30} color="#fff" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="people-outline" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>Family</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(main)/settings')}>
          <Ionicons name="settings-outline" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#f59e0b',
    padding: 2,
    marginRight: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  userText: {
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 13,
    color: '#64748b',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a1d37',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  notificationDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120, // Increased to clear bottom nav
  },
  membershipCardContainer: {
    width: '100%',
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 30,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  membershipCard: {
    padding: 25,
    borderLeftWidth: 5,
    borderLeftColor: '#0d9488',
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardWelcome: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  cardDetails: {
    marginBottom: 25,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 10,
    fontWeight: '500',
  },
  idSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  idLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  idLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginRight: 15,
  },
  idNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a1d37',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 25,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAccessItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 25,
  },
  quickAccessIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickAccessLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 25,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    color: '#94a3b8',
  },
  centerButton: {
    top: -30,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f8f9fc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0a1d37',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0a1d37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
