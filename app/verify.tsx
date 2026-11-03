import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useSession } from '../lib/auth-context';

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { verifyCode, requestCode } = useSession();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!email) {
    // Reached directly (e.g. as the default route) with no target email — bounce to sign-in.
    return <Redirect href="/" />;
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await verifyCode(email, code.trim());
      // On success, session updates and the root layout's Stack.Protected
      // guard switches to the (tabs) group automatically.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setError(null);
    try {
      await requestCode(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Check your email</Text>
      <Text style={styles.subtitle}>Enter the 8-digit code sent to {email}</Text>
      <TextInput
        style={styles.input}
        placeholder="12345678"
        keyboardType="number-pad"
        maxLength={8}
        value={code}
        onChangeText={setCode}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity
        style={[styles.button, (!code || submitting) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!code || submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Verify</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={handleResend} style={styles.resend}>
        <Text style={styles.resendText}>Resend code</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 2,
  },
  error: {
    color: '#C0392B',
    fontSize: 13,
  },
  button: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  resend: {
    alignItems: 'center',
    marginTop: 8,
  },
  resendText: {
    color: '#666',
    fontSize: 14,
  },
});
