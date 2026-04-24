import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import AuthWrapper from '@/components/AuthWrapper';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleReset = () => {
    setSubmitted(true);
  };

  return (
    <AuthWrapper>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="lock-reset" size={50} color="#0a1d37" />
        </View>
        
        <Text style={styles.title}>Recovery</Text>
        <Text style={styles.subtitle}>
          {submitted 
            ? 'Check your inbox for instructions' 
            : 'Enter your email to reset password'}
        </Text>

        <View style={styles.form}>
          {!submitted ? (
            <>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="email" size={20} color="#000" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <TouchableOpacity style={styles.button} onPress={handleReset}>
                <Text style={styles.buttonText}>Send Reset Link</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                We've sent a link to {email}. Follow the instructions in the email to reset your password.
              </Text>
            </View>
          )}

          <View style={styles.footer}>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={styles.backButton}>
                <Ionicons name="arrow-back" size={20} color="#334155" />
                <Text style={styles.backText}>Back to Sign In</Text>
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
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: '#334155',
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
    backgroundColor: '#0a1d37',
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
  successContainer: {
    paddingVertical: 10,
    marginBottom: 20,
  },
  successText: {
    color: '#64748b',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
