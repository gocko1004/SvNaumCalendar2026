import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { TextInput, Button, Title, Text, Checkbox } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { COLORS } from '../../constants/theme';

type AdminLoginScreenProps = {
  navigation: NativeStackNavigationProp<AdminStackParamList, 'AdminLogin'>;
};

export const AdminLoginScreen = ({ navigation }: AdminLoginScreenProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    setError(''); // Clear previous errors

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    // Comprehensive input validation
    if (!trimmedUsername || !trimmedPassword) {
      setError('Внесете корисничко име и лозинка');
      Alert.alert('Грешка', 'Внесете корисничко име и лозинка');
      return;
    }

    if (trimmedUsername.length < 3) {
      setError('Корисничкото име мора да има барем 3 знаци');
      Alert.alert('Грешка', 'Корисничкото име мора да има барем 3 знаци');
      return;
    }

    if (trimmedPassword.length < 6) {
      setError('Лозинката мора да има барем 6 знаци');
      Alert.alert('Грешка', 'Лозинката мора да има барем 6 знаци');
      return;
    }

    // Validate email format if it contains @
    if (trimmedUsername.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedUsername)) {
        setError('Невалиден email формат');
        Alert.alert('Грешка', 'Невалиден email формат');
        return;
      }
    }

    setIsLoading(true);
    try {
      const result = await login(trimmedUsername, trimmedPassword, keepLoggedIn);
      setIsLoading(false);
      if (result.success) {
        navigation.replace('AdminDashboard');
      } else {
        const errorMsg = result.error || 'Невалидно корисничко име или лозинка';
        setError(errorMsg);
        Alert.alert('Грешка при најавување', errorMsg);
      }
    } catch (err) {
      setIsLoading(false);
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Грешка при најавување';
      setError(errorMessage);
      Alert.alert('Грешка', errorMessage);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const onLoginPress = () => {
    dismissKeyboard();
    handleLogin();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Title style={styles.title}>Најава за Администратор</Title>

          <TextInput
            label="Email или корисничко име"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="your-email@example.com или admin"
            returnKeyType="next"
          />

          <TextInput
            label="Лозинка"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={onLoginPress}
          />

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setKeepLoggedIn(!keepLoggedIn)}
            activeOpacity={0.7}
          >
            <Checkbox
              status={keepLoggedIn ? 'checked' : 'unchecked'}
              onPress={() => setKeepLoggedIn(!keepLoggedIn)}
              color={COLORS.PRIMARY}
            />
            <Text style={styles.checkboxLabel}>Задржи ме најавен (7 дена)</Text>
          </TouchableOpacity>

          <Button
            mode="contained"
            onPress={onLoginPress}
            style={styles.button}
            disabled={isLoading}
            loading={isLoading}
            contentStyle={styles.buttonContent}
          >
            {isLoading ? 'Се најавува...' : 'Најави се'}
          </Button>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 28,
    textAlign: 'center',
    color: COLORS.PRIMARY,
    fontSize: 28,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFDF8',
  },
  button: {
    marginTop: 12,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    elevation: 4,
  },
  buttonContent: {
    paddingVertical: 10,
  },
  errorText: {
    color: COLORS.ERROR || '#D32F2F',
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#555',
    marginLeft: 4,
  },
}); 