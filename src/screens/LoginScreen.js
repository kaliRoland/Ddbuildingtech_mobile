import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { APP_COPY, BRAND } from '../config/appConfig';

const EMPTY_LOGIN = {
  username_or_email: '',
  password: '',
};

const EMPTY_REGISTER = {
  username: '',
  email: '',
  password: '',
};

export default function LoginScreen({ session, loading, onLogin, onRegister, onLogout }) {
  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState(EMPTY_LOGIN);
  const [registerForm, setRegisterForm] = useState(EMPTY_REGISTER);
  const [error, setError] = useState('');

  async function handleLogin() {
    try {
      setError('');
      await onLogin(loginForm);
      setLoginForm(EMPTY_LOGIN);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRegister() {
    try {
      setError('');
      await onRegister(registerForm);
      setRegisterForm(EMPTY_REGISTER);
    } catch (err) {
      setError(err.message);
    }
  }

  if (session?.token) {
    return (
      <View style={styles.screen}>
        <View style={styles.card}>
          <Text style={styles.title}>Account Ready</Text>
          <Text style={styles.subtitle}>
            Signed in as {session.user?.username || session.user?.email || 'customer'}.
          </Text>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Email</Text>
            <Text style={styles.accountValue}>{session.user?.email || 'Not available'}</Text>
          </View>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Role</Text>
            <Text style={styles.accountValue}>{session.user?.role || 'customer'}</Text>
          </View>
          <Pressable style={styles.primaryButton} onPress={onLogout}>
            <Text style={styles.primaryButtonText}>Log Out</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const activeForm = mode === 'login' ? loginForm : registerForm;
  const setActiveForm = mode === 'login' ? setLoginForm : setRegisterForm;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Login Required</Text>
        <Text style={styles.heroTitle}>Support and chat stay locked until a customer signs in.</Text>
        <Text style={styles.heroText}>{APP_COPY.supportGate}</Text>
      </View>

      <View style={styles.switcher}>
        <Pressable
          style={[styles.switcherButton, mode === 'login' && styles.switcherButtonActive]}
          onPress={() => setMode('login')}
        >
          <Text style={[styles.switcherText, mode === 'login' && styles.switcherTextActive]}>Login</Text>
        </Pressable>
        <Pressable
          style={[styles.switcherButton, mode === 'register' && styles.switcherButtonActive]}
          onPress={() => setMode('register')}
        >
          <Text style={[styles.switcherText, mode === 'register' && styles.switcherTextActive]}>
            Register
          </Text>
        </Pressable>
      </View>

      <View style={styles.formCard}>
        {mode === 'login' ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Username or email"
              autoCapitalize="none"
              value={activeForm.username_or_email}
              onChangeText={(value) => setActiveForm((current) => ({ ...current, username_or_email: value }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={activeForm.password}
              onChangeText={(value) => setActiveForm((current) => ({ ...current, password: value }))}
            />
            <Pressable style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={BRAND.blueDark} />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Username"
              autoCapitalize="none"
              value={activeForm.username}
              onChangeText={(value) => setActiveForm((current) => ({ ...current, username: value }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={activeForm.email}
              onChangeText={(value) => setActiveForm((current) => ({ ...current, email: value }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={activeForm.password}
              onChangeText={(value) => setActiveForm((current) => ({ ...current, password: value }))}
            />
            <Pressable style={styles.primaryButton} onPress={handleRegister} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={BRAND.blueDark} />
              ) : (
                <Text style={styles.primaryButtonText}>Create Account</Text>
              )}
            </Pressable>
          </>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Text style={styles.noteText}>{APP_COPY.apiNote}</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BRAND.blueSoft,
    padding: 20,
    paddingBottom: 140,
  },
  hero: {
    backgroundColor: BRAND.blue,
    borderRadius: 28,
    padding: 24,
    marginTop: 10,
  },
  eyebrow: {
    color: BRAND.yellow,
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  heroTitle: {
    color: BRAND.white,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
  },
  heroText: {
    color: '#dce8ff',
    marginTop: 10,
    lineHeight: 21,
  },
  switcher: {
    flexDirection: 'row',
    backgroundColor: '#dfe9fb',
    borderRadius: 18,
    padding: 6,
    marginTop: 18,
    gap: 6,
  },
  switcherButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  switcherButtonActive: {
    backgroundColor: BRAND.white,
  },
  switcherText: {
    color: BRAND.muted,
    fontWeight: '700',
  },
  switcherTextActive: {
    color: BRAND.blue,
  },
  formCard: {
    marginTop: 16,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 24,
    padding: 18,
    gap: 12,
  },
  card: {
    marginTop: 20,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 24,
    padding: 22,
    gap: 12,
  },
  title: {
    color: BRAND.text,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: BRAND.muted,
    lineHeight: 21,
  },
  accountRow: {
    backgroundColor: '#f6faff',
    borderRadius: 16,
    padding: 14,
  },
  accountLabel: {
    color: BRAND.muted,
    fontSize: 12,
    marginBottom: 4,
  },
  accountValue: {
    color: BRAND.text,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: BRAND.text,
    backgroundColor: '#f8fbff',
  },
  primaryButton: {
    backgroundColor: BRAND.yellow,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: BRAND.blueDark,
    fontWeight: '800',
  },
  errorText: {
    color: BRAND.danger,
    lineHeight: 20,
  },
  noteText: {
    color: BRAND.muted,
    fontSize: 12,
    lineHeight: 18,
  },
});
