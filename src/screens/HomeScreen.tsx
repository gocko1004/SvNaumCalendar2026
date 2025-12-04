import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Title, Card } from 'react-native-paper';

// Assuming this is your church schedule data
const churchSchedule = [
  {
    day: 'Monday',
    openTime: '09:00',
    closeTime: '17:00',
    isOpen: true
  },
  {
    day: 'Tuesday',
    openTime: '09:00',
    closeTime: '17:00',
    isOpen: true
  },
  // Add other days...
];

export const HomeScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Church Opening Hours</Title>
      
      {/* Church Schedule List */}
      <Card style={styles.card}>
        {churchSchedule.map((schedule, index) => (
          <List.Item
            key={index}
            title={schedule.day}
            description={schedule.isOpen ? 
              `Open: ${schedule.openTime} - ${schedule.closeTime}` : 
              'Closed'}
            left={props => <List.Icon {...props} icon={schedule.isOpen ? "clock" : "clock-off"} />}
          />
        ))}
      </Card>

      {/* Your existing calendar can go below */}
      <Title style={styles.title}>Calendar Events</Title>
      {/* Your calendar component here */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginVertical: 16,
  },
  card: {
    marginBottom: 16,
  },
}); 