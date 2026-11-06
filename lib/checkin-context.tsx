import * as Location from 'expo-location';
import { createContext, useContext, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { fuzzCoordinate, insertCheckIn, updateCheckInNote } from './checkIns';
import { describeError } from './errors';
import { useTheme } from './theme';

type Step = 'closed' | 'confirm' | 'note';

type CheckInContextValue = {
  openCheckIn: () => void;
  /** Bumps after a successful check-in or end — screens can depend on this to refetch. */
  refreshSignal: number;
};

const CheckInContext = createContext<CheckInContextValue | undefined>(undefined);

export function CheckInProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const { colors, type, radius, shadows } = theme;

  const [step, setStep] = useState<Step>('closed');
  const [shareWithEveryone, setShareWithEveryone] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [pendingCheckInId, setPendingCheckInId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);

  function openCheckIn() {
    setStatus(null);
    setStep('confirm');
  }

  function close() {
    setStep('closed');
    setStatus(null);
    setPendingCheckInId(null);
    setNote('');
  }

  async function confirmCheckIn() {
    setStatus(null);
    setCheckingIn(true);
    try {
      const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== 'granted') {
        setStatus('Location permission denied');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const fuzzed = fuzzCoordinate(position.coords.latitude, position.coords.longitude);
      const checkIn = await insertCheckIn(fuzzed, shareWithEveryone ? 'everyone' : 'friends');
      setPendingCheckInId(checkIn.id);
      setNote('');
      setStep('note');
      setRefreshSignal((n) => n + 1);
    } catch (err) {
      setStatus(describeError(err));
    } finally {
      setCheckingIn(false);
    }
  }

  async function saveNote() {
    if (!pendingCheckInId) return;
    setSavingNote(true);
    try {
      await updateCheckInNote(pendingCheckInId, note.trim());
      close();
    } catch (err) {
      setStatus(describeError(err));
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <CheckInContext.Provider value={{ openCheckIn, refreshSignal }}>
      {children}
      <Modal visible={step !== 'closed'} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderRadius: radius.sheet }, shadows.card]}>
            {step === 'confirm' && (
              <>
                <Text style={[type.title, { color: colors.text }]}>Check in</Text>
                <View style={styles.row}>
                  <Text style={[type.body, { color: colors.text }]}>Share with everyone nearby</Text>
                  <Switch
                    value={shareWithEveryone}
                    onValueChange={setShareWithEveryone}
                    trackColor={{ true: colors.accent, false: colors.raised }}
                  />
                </View>
                {status && <Text style={{ color: colors.danger }}>{status}</Text>}
                <View style={styles.buttonRow}>
                  <TouchableOpacity onPress={close} style={styles.ghostButton}>
                    <Text style={[type.button, { color: colors.accentText }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={confirmCheckIn}
                    disabled={checkingIn}
                    style={[
                      styles.primaryButton,
                      { backgroundColor: colors.accent, borderRadius: radius.button },
                      shadows.accentButton(colors.accentGlow),
                      checkingIn && styles.disabled,
                    ]}
                  >
                    {checkingIn ? (
                      <ActivityIndicator color={colors.onAccent} />
                    ) : (
                      <Text style={[type.button, { color: colors.onAccent }]}>Check in</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
            {step === 'note' && (
              <>
                <Text style={[type.title, { color: colors.text }]}>Checked in!</Text>
                <Text style={[type.caption, { color: colors.text2 }]}>What happened?</Text>
                <TextInput
                  style={[
                    styles.input,
                    type.body,
                    { backgroundColor: colors.raised, borderRadius: radius.input, color: colors.text },
                  ]}
                  placeholder="Grabbed coffee, said hi to a stranger…"
                  placeholderTextColor={colors.text2}
                  value={note}
                  onChangeText={setNote}
                />
                {status && <Text style={{ color: colors.danger }}>{status}</Text>}
                <View style={styles.buttonRow}>
                  <TouchableOpacity onPress={close} style={styles.ghostButton}>
                    <Text style={[type.button, { color: colors.accentText }]}>Skip</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={saveNote}
                    disabled={savingNote || !note.trim()}
                    style={[
                      styles.primaryButton,
                      { backgroundColor: colors.accent, borderRadius: radius.button },
                      shadows.accentButton(colors.accentGlow),
                      (savingNote || !note.trim()) && styles.disabled,
                    ]}
                  >
                    {savingNote ? (
                      <ActivityIndicator color={colors.onAccent} />
                    ) : (
                      <Text style={[type.button, { color: colors.onAccent }]}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </CheckInContext.Provider>
  );
}

export function useCheckIn() {
  const ctx = useContext(CheckInContext);
  if (!ctx) throw new Error('useCheckIn must be used within a CheckInProvider');
  return ctx;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    padding: 24,
    paddingBottom: 44,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  ghostButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  primaryButton: {
    minHeight: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
