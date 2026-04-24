import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,
  Image,
} from 'react-native';
import { Link, router } from 'expo-router';
import AuthWrapper from '@/components/AuthWrapper';
import { Ionicons, AntDesign, FontAwesome } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = () => {
    Toast.show({
      type: 'success',
      text1: 'Login Successful',
      text2: 'Welcome back to Multerser! 👋',
      position: 'bottom',
      bottomOffset: 60,
    });
    router.replace('/(main)/home');
  };

  return (
    <AuthWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>
          Access your orders, wishlist, and exclusive offers by logging in.
        </Text>
      </View>

      <View style={styles.form}>
        {/* Email Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter you email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        {/* Password Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter you password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name="eye-outline"
                size={20}
                color="#333"
              />
            </Pressable>
          </View>
        </View>

        {/* Remember Me & Forgot Password */}
        <View style={styles.row}>
          <TouchableOpacity 
            style={styles.rememberMe} 
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View style={[
              styles.checkbox, 
              { backgroundColor: rememberMe ? '#4cd964' : 'transparent', borderColor: rememberMe ? '#4cd964' : '#ccc' }
            ]}>
              {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.rememberMeText}>Remember me</Text>
          </TouchableOpacity>
          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Sign In Button */}
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Sign in</Text>
        </TouchableOpacity>

        {/* OR Separator */}
        <View style={styles.separatorContainer}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>OR</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* Social Buttons */}
        <TouchableOpacity style={styles.socialButton}>
          <FcGoogle style={styles.socialIcon} />
          <Text style={styles.socialButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton}>
          <FontAwesome name="apple" size={20} color="#000" style={styles.socialIcon} />
          <Text style={styles.socialButtonText}>Continue with Apple</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>Sign up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </AuthWrapper>
  );
}

// Simple implementation of Google icon using AntDesign/Ionicons if needed, 
// but I'll use Image or a colored icon for 100% match.
const FcGoogle = ({ style }: { style?: any }) => (
  <AntDesign name="google" size={20} color="#EA4335" style={style} />
);

const styles = StyleSheet.create({
  header: {
    marginBottom: 45,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 15,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ececec',
    borderRadius: 15,
    paddingHorizontal: 20,
    height: 62, // Increased height
  },
  input: {
    flex: 1,
    color: '#000',
    fontSize: 16, // Slightly larger font for readability
    paddingVertical: 10,
    marginRight: 10, // Ensure space before the eye icon
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 30,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rememberMeText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
  forgotPasswordText: {
    color: '#ff3b30', // Apple System Red
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#000',
    borderRadius: 15,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    justifyContent: 'center',
  },
  separatorLine: {
    flex: 0.45,
    height: 1,
    backgroundColor: '#ddd',
  },
  separatorText: {
    marginHorizontal: 15,
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ececec',
    borderRadius: 15,
    height: 58,
    marginBottom: 15,
  },
  socialIcon: {
    marginRight: 12,
  },
  socialButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 60,
  },
  footerText: {
    color: '#333',
    fontSize: 14,
  },
  linkText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
});
