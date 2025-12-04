import { Platform } from 'react-native';

// Use Platform.select for platform-specific code
const styles = {
  container: Platform.select({
    web: { cursor: 'pointer' },
    default: {}
  })
} 