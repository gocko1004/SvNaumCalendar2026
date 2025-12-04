import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useEffect } from 'react';
import theme from './theme';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { NotificationService } from './services/NotificationService';

function App() {
  useEffect(() => {
    NotificationService.requestPermission();
  }, []);

  const handleTestNotification = () => {
    NotificationService.showNotification('Calendar Reminder', {
      body: 'You have an upcoming event in 15 minutes!',
      icon: '/path/to/your/icon.png'
    });
  };

  const handleScheduleNotification = () => {
    NotificationService.scheduleNotification(
      'Scheduled Reminder',
      {
        body: 'This is a scheduled notification!',
        icon: '/path/to/your/icon.png'
      },
      5000
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navigation />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App; 