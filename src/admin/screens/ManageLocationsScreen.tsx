import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  FAB, 
  Portal, 
  Modal, 
  TextInput,
  Button,
  List,
  IconButton,
  Divider
} from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList, Location } from '../../navigation/types';
import { COLORS } from '../../constants/theme';

type ManageLocationsScreenProps = {
  navigation: NativeStackNavigationProp<AdminStackParamList, 'ManageLocations'>;
};

export const ManageLocationsScreen: React.FC<ManageLocationsScreenProps> = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);

  const [newLocation, setNewLocation] = useState<Partial<Location>>({
    name: '',
    address: '',
    coordinates: {
      latitude: 0,
      longitude: 0,
    },
    facilities: [],
  });

  const handleCreateLocation = () => {
    if (!newLocation.name || !newLocation.address) {
      // Show error
      return;
    }

    const location: Location = selectedLocation
      ? { 
          ...selectedLocation, 
          name: newLocation.name, 
          address: newLocation.address, 
          coordinates: newLocation.coordinates || { latitude: 0, longitude: 0 }
        }
      : {
          id: Date.now().toString(),
          name: newLocation.name,
          address: newLocation.address,
          coordinates: newLocation.coordinates || { latitude: 0, longitude: 0 }
        };

    if (selectedLocation) {
      setLocations(locations.map(loc => 
        loc.id === selectedLocation.id ? location : loc
      ));
    } else {
      setLocations([...locations, location]);
    }

    setModalVisible(false);
    setSelectedLocation(null);
    setNewLocation({
      name: '',
      address: '',
      coordinates: {
        latitude: 0,
        longitude: 0,
      },
      facilities: [],
    });
  };

  const handleEditLocation = (location: Location) => {
    setSelectedLocation(location);
    setNewLocation(location);
    setModalVisible(true);
  };

  const handleDeleteLocation = (locationId: string) => {
    setLocations(locations.filter(loc => loc.id !== locationId));
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Title style={styles.title}>Локации за Настани</Title>

        {locations.map((location) => (
          <Card key={location.id} style={styles.locationCard}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Title>{location.name}</Title>
                <View style={styles.actions}>
                  <IconButton
                    icon="pencil"
                    onPress={() => handleEditLocation(location)}
                  />
                  <IconButton
                    icon="delete"
                    onPress={() => handleDeleteLocation(location.id)}
                  />
                </View>
              </View>

              <List.Item
                title={location.address}
                left={props => <List.Icon {...props} icon="map-marker" />}
              />

              {location.directions && (
                <>
                  <Divider style={styles.divider} />
                  <Paragraph>Насоки: {location.directions}</Paragraph>
                </>
              )}

              {location.parkingInfo && (
                <Paragraph>Паркинг: {location.parkingInfo}</Paragraph>
              )}

              {location.facilities && location.facilities.length > 0 && (
                <>
                  <Divider style={styles.divider} />
                  <Title style={styles.subtitle}>Објекти:</Title>
                  {location.facilities.map((facility, index) => (
                    <List.Item
                      key={index}
                      title={facility}
                      left={props => <List.Icon {...props} icon="check" />}
                    />
                  ))}
                </>
              )}
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <ScrollView>
            <Title>{selectedLocation ? 'Измени Локација' : 'Нова Локација'}</Title>
            
            <TextInput
              label="Име на локацијата"
              value={newLocation.name}
              onChangeText={name => setNewLocation({ ...newLocation, name })}
              style={styles.input}
            />

            <TextInput
              label="Адреса"
              value={newLocation.address}
              onChangeText={address => setNewLocation({ ...newLocation, address })}
              style={styles.input}
            />

            <TextInput
              label="Насоки"
              value={newLocation.directions}
              onChangeText={directions => setNewLocation({ ...newLocation, directions })}
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            <TextInput
              label="Информации за паркинг"
              value={newLocation.parkingInfo}
              onChangeText={parkingInfo => setNewLocation({ ...newLocation, parkingInfo })}
              style={styles.input}
            />

            <View style={styles.buttonContainer}>
              <Button onPress={() => setModalVisible(false)} style={styles.button}>
                Откажи
              </Button>
              <Button 
                mode="contained" 
                onPress={handleCreateLocation}
                style={styles.button}
              >
                {selectedLocation ? 'Зачувај' : 'Креирај'}
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {
          setSelectedLocation(null);
          setModalVisible(true);
        }}
        label="Нова Локација"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  title: {
    margin: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  subtitle: {
    fontSize: 18,
    marginVertical: 8,
  },
  locationCard: {
    margin: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
  },
  divider: {
    marginVertical: 8,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    borderRadius: 8,
  },
  input: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  button: {
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.PRIMARY,
  },
}); 