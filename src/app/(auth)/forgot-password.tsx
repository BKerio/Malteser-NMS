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
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleReset = () => {
    setSubmitted(true);
  };

  return (
    <AuthWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>Recovery</Text>
        <Text style={styles.subtitle}>
          {submitted 
            ? 'Check your inbox for instructions' 
            : 'Enter your email to reset password'}
        </Text>
      </View>

      <View style={styles.form}>
        {!submitted ? (
          <>
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

            <TouchableOpacity style={styles.button} onPress={handleReset}>
              <Text style={styles.buttonText}>Send Reset Link</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#4cd964" />
            <Text style={styles.successText}>
              We've sent a link to {email}. Follow the instructions in the email to reset your password.
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color="#000" />
              <Text style={styles.backText}>Back to Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </AuthWrapper>
  );
}

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
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 25,
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
    height: 58,
  },
  input: {
    flex: 1,
    color: '#000',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#000',
    borderRadius: 15,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successText: {
    color: '#333',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 20,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
