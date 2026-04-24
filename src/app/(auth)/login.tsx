import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import { Link, router } from 'expo-router';
import AuthWrapper from '@/components/AuthWrapper';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    router.replace('/(main)/home');
  };

  return (
    <AuthWrapper>
      <View style={styles.container}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../../assets/android-icon-monochrome.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        <Text style={styles.welcomeText}>Welcome back</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Login using</Text>

          {/* Login Type Selector */}
          <TouchableOpacity style={styles.selectorContainer}>
            <View style={styles.selectorLeft}>
              <Ionicons name="mail-outline" size={20} color="#64748b" />
              <Text style={styles.selectorText}>Use your email address</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color="#64748b" />
          </TouchableOpacity>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="email" size={20} color="#000" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your email address"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock" size={20} color="#000" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye' : 'eye-outline'}
                size={20}
                color="#000"
              />
            </Pressable>
          </View>

          {/* Login Button */}
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login to your account</Text>
          </TouchableOpacity>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* OR Separator */}
          <View style={styles.separatorContainer}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>Or</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Register</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </AuthWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  logoContainer: {
    marginBottom: 30,
    marginTop: 10,
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 35,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif-medium',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 10,
    marginLeft: 4,
  },
  selectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 15,
    paddingHorizontal: 16,
    height: 55,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorText: {
    marginLeft: 10,
    color: '#64748b',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: '#334155', // Dark border from image
    height: 65,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#000',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#0a1d37', // Dark navy blue from image
    borderRadius: 12,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    alignSelf: 'center',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  separatorText: {
    marginHorizontal: 15,
    color: '#94a3b8',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  linkText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
});
