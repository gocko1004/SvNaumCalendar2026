import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Title, Snackbar } from 'react-native-paper';
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
  const { login } = useAuth();

  const handleLogin = async () => {
    setError(''); // Clear previous errors
    
    if (!username || !password) {
      setError('Внесете корисничко име и лозинка');
      return;
    }

    try {
      const result = await login(username.trim(), password.trim());
      if (result.success) {
        navigation.replace('AdminDashboard');
      } else {
        setError(result.error || 'Невалидно корисничко име или лозинка');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Грешка при најавување');
    }
  };

  return (
    <View style={styles.container}>
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
      />
      
      <TextInput
        label="Лозинка"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <Button 
        mode="contained" 
        onPress={handleLogin}
        style={styles.button}
      >
        Најави се
      </Button>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={3000}
        style={styles.snackbar}
      >
        {error}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
    color: COLORS.PRIMARY,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    backgroundColor: COLORS.PRIMARY,
  },
  snackbar: {
    backgroundColor: COLORS.ERROR,
  },
}); 