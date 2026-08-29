import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/theme';

// In-app privacy notice (Art. 19 nFADP duty to inform). Content mirrors
// PRIVACY_POLICY.md - keep the two in sync when anything changes.

const SECTIONS: { title: string; body: string }[] = [
  {
    title: 'Кој е одговорен',
    body:
      'Оваа апликација е развиена за Македонската православна црковна општина „Св. Наум Охридски" - Тринген, Швајцарија. За прашања за вашите податоци контактирајте нè на: mpc.triengen@gmail.com',
  },
  {
    title: 'Кои податоци ги собираме',
    body:
      'Прегледувањето на календарот, новостите и постите не бара никакви лични податоци. Потсетниците за богослужби се закажуваат локално на вашиот уред.\n\n„Пишете ни": ако ни испратите порака, ја чуваме пораката и - само ако сами ги внесете - вашето име и контакт. Пораките може да се испратат и анонимно.\n\nЗачленување: ако поднесете пријава за членство, ги чуваме податоците што ги внесувате: име и презиме, адреса, телефон, email и по избор членови на семејството и белешка.\n\nТехнички: за примање известувања се зачувува т.н. push-токен на вашиот уред. Тој сам по себе не открива кој сте.',
  },
  {
    title: 'Зошто ги користиме',
    body:
      'За да одговориме на вашите пораки, за обработка на пријавите за членство и за испраќање известувања за богослужби и настани. Податоците не се користат за ништо друго - нема маркетинг, нема профилирање, нема реклами.',
  },
  {
    title: 'Кој ги гледа податоците',
    body:
      'Само овластените членови на управата на црковната општина. Пораките и пријавите не се јавно видливи и не се споделуваат со трети лица. Членските податоци нема да бидат објавени или предадени надвор од црковната општина без ваша изречна согласност.',
  },
  {
    title: 'Каде се чуваат',
    body:
      'Податоците се чуваат кај Google (Firebase/Google Cloud) како обработувач за црковната општина. Дел од податоците (автентикација) Google ги обработува на сервери во САД. Преносот кон Google LLC во САД е покриен со Швајцарско-американската рамка за заштита на податоци (Swiss-U.S. Data Privacy Framework).',
  },
  {
    title: 'Колку долго ги чуваме',
    body:
      'Пораки: додека се обработат, најдоцна 12 месеци. Пријави за членство: при прием, податоците преминуваат во членската евиденција на општината; одбиени или повлечени пријави се бришат најдоцна за 3 месеци.',
  },
  {
    title: 'Вашите права',
    body:
      'Во секое време можете да побарате да дознаете кои податоци ги чуваме за вас, да ги исправиме или да ги избришеме. Пишете ни на mpc.triengen@gmail.com - одговараме најдоцна за 30 дена.',
  },
  {
    title: 'Известувања',
    body:
      'Push известувањата можете да ги оневозможите во поставките на апликацијата или на уредот.',
  },
];

export const PrivacyPolicyScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Button
          icon="arrow-left"
          mode="text"
          onPress={() => navigation.goBack()}
          textColor={COLORS.PRIMARY}
        >
          Назад
        </Button>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleBox}>
          <MaterialCommunityIcons name="shield-lock-outline" size={36} color={COLORS.PRIMARY} />
          <Text style={styles.title}>Политика на приватност</Text>
          <Text style={styles.updated}>Последна ажурираност: 27 август 2026</Text>
        </View>

        {SECTIONS.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          buttonColor={COLORS.PRIMARY}
          style={styles.closeButton}
        >
          Затвори
        </Button>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F3E8',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  header: {
    paddingTop: 8,
    paddingHorizontal: 8,
    backgroundColor: '#FFFDF8',
    borderBottomWidth: 1,
    borderBottomColor: '#D4AF37',
    alignItems: 'flex-start',
  },
  scrollContent: {
    padding: 20,
  },
  titleBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    marginTop: 8,
    textAlign: 'center',
  },
  updated: {
    fontSize: 12,
    color: '#8a7a6a',
    marginTop: 4,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 14,
    color: '#3d3428',
    lineHeight: 21,
  },
  closeButton: {
    marginTop: 10,
    borderRadius: 8,
  },
});

export default PrivacyPolicyScreen;
