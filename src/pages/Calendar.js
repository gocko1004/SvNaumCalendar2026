import { useState } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { Calendar as RNCalendar } from 'react-native-calendars';

function Calendar() {
  const [selected, setSelected] = useState('');

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Calendar
        </Typography>
        <RNCalendar
          onDayPress={day => {
            setSelected(day.dateString);
          }}
          markedDates={{
            [selected]: {selected: true, selectedColor: '#1976d2'}
          }}
        />
      </Box>
    </Container>
  );
}

export default Calendar; 