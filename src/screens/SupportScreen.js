import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { APP_COPY, BRAND } from '../config/appConfig';
import { getJson, postForm } from '../utils/api';

const EMPTY_FORM = {
  subject: '',
  message: '',
  contact_phone: '',
};

export default function SupportScreen({ session, onRequireLogin }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session?.token) {
      setRequests([]);
      return;
    }

    let active = true;

    async function loadRequests() {
      try {
        setLoading(true);
        const data = await getJson('support.php', { action: 'list' }, session.token);
        if (!active) {
          return;
        }
        setRequests(data.requests || []);
        setError('');
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadRequests();
    return () => {
      active = false;
    };
  }, [session]);

  async function submitRequest() {
    if (!session?.token) {
      onRequireLogin();
      return;
    }

    try {
      setSubmitting(true);
      setFeedback('');
      setError('');

      await postForm(
        'support.php',
        {
          subject: form.subject,
          message: form.message,
          contact_phone: form.contact_phone,
          channel: 'mobile_app',
        },
        session.token
      );

      const refreshed = await getJson('support.php', { action: 'list' }, session.token);
      setRequests(refreshed.requests || []);
      setForm(EMPTY_FORM);
      setFeedback('Support request sent. Our team will reply through the dashboard and notifications.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!session?.token) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.gateCard}>
          <Text style={styles.gateTitle}>Support Is Locked</Text>
          <Text style={styles.gateText}>{APP_COPY.supportGate}</Text>
          <Pressable style={styles.primaryButton} onPress={onRequireLogin}>
            <Text style={styles.primaryButtonText}>Go to Login</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Customer Support</Text>
        <Text style={styles.heroText}>Submit a ticket, then continue the conversation from the website dashboard.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>New Request</Text>
        <TextInput
          style={styles.input}
          placeholder="Subject"
          value={form.subject}
          onChangeText={(value) => setForm((current) => ({ ...current, subject: value }))}
        />
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Explain the issue"
          multiline
          textAlignVertical="top"
          value={form.message}
          onChangeText={(value) => setForm((current) => ({ ...current, message: value }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone number"
          keyboardType="phone-pad"
          value={form.contact_phone}
          onChangeText={(value) => setForm((current) => ({ ...current, contact_phone: value }))}
        />
        <View style={styles.actionRow}>
          <Pressable style={styles.primaryButton} onPress={submitRequest} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color={BRAND.blueDark} />
            ) : (
              <Text style={styles.primaryButtonText}>Submit Ticket</Text>
            )}
          </Pressable>
        </View>
        {feedback ? <Text style={styles.successText}>{feedback}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Recent Requests</Text>
        {loading ? <ActivityIndicator color={BRAND.blue} /> : null}
        {!loading && requests.length === 0 ? <Text style={styles.emptyText}>No support tickets yet.</Text> : null}
        {requests.map((item) => (
          <View key={item.id} style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketSubject}>{item.subject}</Text>
              <Text style={styles.statusBadge}>{item.status}</Text>
            </View>
            <Text style={styles.ticketBody} numberOfLines={3}>
              {item.message}
            </Text>
            {item.admin_response ? (
              <View style={styles.responseCard}>
                <Text style={styles.responseLabel}>Admin response</Text>
                <Text style={styles.responseText}>{item.admin_response}</Text>
              </View>
            ) : null}
            <Text style={styles.ticketDate}>{item.created_at}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BRAND.blueSoft },
  content: { padding: 20, paddingBottom: 140, gap: 16 },
  hero: {
    backgroundColor: BRAND.blue,
    borderRadius: 28,
    padding: 22,
  },
  heroTitle: {
    color: BRAND.white,
    fontSize: 26,
    fontWeight: '800',
  },
  heroText: {
    color: '#dce8ff',
    marginTop: 10,
    lineHeight: 21,
  },
  gateCard: {
    backgroundColor: BRAND.white,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 24,
    marginTop: 20,
  },
  gateTitle: {
    color: BRAND.text,
    fontSize: 24,
    fontWeight: '800',
  },
  gateText: {
    color: BRAND.muted,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 18,
  },
  card: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 18,
    gap: 12,
  },
  sectionTitle: {
    color: BRAND.text,
    fontSize: 20,
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f8fbff',
    color: BRAND.text,
  },
  textarea: {
    minHeight: 120,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: BRAND.yellow,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: BRAND.blueDark,
    fontWeight: '800',
  },
  successText: {
    color: BRAND.success,
    lineHeight: 20,
  },
  errorText: {
    color: BRAND.danger,
    lineHeight: 20,
  },
  emptyText: {
    color: BRAND.muted,
  },
  ticketCard: {
    backgroundColor: '#f8fbff',
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  ticketSubject: {
    color: BRAND.text,
    fontWeight: '800',
    flex: 1,
  },
  statusBadge: {
    color: BRAND.blue,
    backgroundColor: '#deebff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  ticketBody: {
    color: BRAND.muted,
    lineHeight: 20,
  },
  responseCard: {
    backgroundColor: BRAND.white,
    borderRadius: 14,
    padding: 12,
  },
  responseLabel: {
    color: BRAND.blue,
    fontWeight: '800',
    marginBottom: 4,
  },
  responseText: {
    color: BRAND.text,
    lineHeight: 20,
  },
  ticketDate: {
    color: BRAND.muted,
    fontSize: 12,
  },
});
