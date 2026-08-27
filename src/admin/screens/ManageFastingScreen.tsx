import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Button,
  TextInput,
  FAB,
  Switch,
  ActivityIndicator,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { mk } from 'date-fns/locale';
import {
  FastingPeriod,
  FastingRule,
  FastingSpecialDay,
  FASTING_RULE_CONFIG,
  FASTING_PRESETS,
  getAllFastingPeriods,
  saveFastingPeriod,
  deleteFastingPeriod,
} from '../../services/FastingService';
import { COLORS } from '../../constants/theme';

const RULES: FastingRule[] = ['STRICT', 'WITH_OIL', 'WINE_OIL', 'FISH'];

const emptyPeriod = (): FastingPeriod => ({
  name: '',
  startDate: new Date(),
  endDate: new Date(),
  defaultRule: 'STRICT',
  note: '',
  specialDays: [],
  isActive: true,
});

export const ManageFastingScreen = () => {
  const [periods, setPeriods] = useState<FastingPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [draft, setDraft] = useState<FastingPeriod>(emptyPeriod());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [specialDayPickerIndex, setSpecialDayPickerIndex] = useState<number | null>(null);
  const [brush, setBrush] = useState<FastingRule | 'ERASE'>('STRICT');
  const [addDayForRule, setAddDayForRule] = useState<FastingRule | null>(null);

  // Rule-first entry: assign a specific date to a rule (Goce's model - only
  // explicitly assigned days are fasting days). Adding a day outside the
  // period stretches the period to include it.
  const assignDay = (date: Date, rule: FastingRule) => {
    const day = new Date(date);
    day.setHours(0, 0, 0, 0);
    setDraft(prev => {
      const others = prev.specialDays.filter(sd => !isSameDayDate(sd.date, day));
      const start = new Date(prev.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(prev.endDate);
      end.setHours(0, 0, 0, 0);
      return {
        ...prev,
        startDate: day < start ? day : prev.startDate,
        endDate: day > end ? day : prev.endDate,
        specialDays: [...others, { date: day, rule }],
      };
    });
  };

  const removeDay = (date: Date) => {
    setDraft(prev => ({
      ...prev,
      specialDays: prev.specialDays.filter(sd => !isSameDayDate(sd.date, date)),
    }));
  };

  const loadPeriods = async () => {
    setLoading(true);
    setPeriods(await getAllFastingPeriods());
    setLoading(false);
  };

  useEffect(() => {
    loadPeriods();
  }, []);

  const openNew = (preset?: { name: string; defaultRule: FastingRule }) => {
    setDraft({
      ...emptyPeriod(),
      name: preset?.name || '',
      defaultRule: preset?.defaultRule || 'STRICT',
    });
    setFormVisible(true);
  };

  const openEdit = (period: FastingPeriod) => {
    setDraft({ ...period, specialDays: [...period.specialDays] });
    setFormVisible(true);
  };

  const handleSave = async () => {
    if (!draft.name.trim()) {
      Alert.alert('Грешка', 'Внесете име на постот');
      return;
    }
    if (draft.endDate < draft.startDate) {
      Alert.alert('Грешка', 'Крајниот датум е пред почетниот');
      return;
    }
    setSaving(true);
    try {
      await saveFastingPeriod({ ...draft, name: draft.name.trim(), note: draft.note?.trim() });
      setFormVisible(false);
      await loadPeriods();
    } catch (error) {
      console.error('Error saving fasting period:', error);
      Alert.alert('Грешка', 'Неуспешно зачувување');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (period: FastingPeriod) => {
    Alert.alert('Избриши пост', `Дали сте сигурни дека сакате да го избришете „${period.name}"?`, [
      { text: 'Откажи', style: 'cancel' },
      {
        text: 'Избриши',
        style: 'destructive',
        onPress: async () => {
          try {
            if (period.id) await deleteFastingPeriod(period.id);
            await loadPeriods();
          } catch (error) {
            console.error('Error deleting fasting period:', error);
            Alert.alert('Грешка', 'Неуспешно бришење');
          }
        },
      },
    ]);
  };

  const toggleActive = async (period: FastingPeriod) => {
    try {
      await saveFastingPeriod({ ...period, isActive: !period.isActive });
      await loadPeriods();
    } catch (error) {
      Alert.alert('Грешка', 'Неуспешно зачувување');
    }
  };

  const addSpecialDay = () => {
    setDraft(prev => ({
      ...prev,
      specialDays: [
        ...prev.specialDays,
        { date: prev.startDate, rule: 'FISH', note: '' } as FastingSpecialDay,
      ],
    }));
  };

  const updateSpecialDay = (index: number, patch: Partial<FastingSpecialDay>) => {
    setDraft(prev => ({
      ...prev,
      specialDays: prev.specialDays.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  };

  const removeSpecialDay = (index: number) => {
    setDraft(prev => ({
      ...prev,
      specialDays: prev.specialDays.filter((_, i) => i !== index),
    }));
  };


  const WEEKDAY_LETTERS = ['Н', 'П', 'В', 'С', 'Ч', 'П', 'С'];

  const isSameDayDate = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const baseRuleFor = (date: Date): FastingRule => {
    const dow = date.getDay();
    const isWeekend = dow === 0 || dow === 6;
    return isWeekend && draft.weekendRule ? draft.weekendRule : draft.defaultRule;
  };

  const periodDays = (): Date[] => {
    const days: Date[] = [];
    const d = new Date(draft.startDate);
    d.setHours(0, 0, 0, 0);
    const end = new Date(draft.endDate);
    end.setHours(0, 0, 0, 0);
    while (d <= end && days.length <= 70) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return days;
  };

  // Paint the tapped day with the active brush; the eraser (or painting the
  // base rule) returns the day to the inherited rule.
  const paintDayRule = (date: Date) => {
    const base = baseRuleFor(date);
    const special = draft.specialDays.find(sd => isSameDayDate(sd.date, date));

    setDraft(prev => {
      const others = prev.specialDays.filter(sd => !isSameDayDate(sd.date, date));
      if (brush === 'ERASE' || brush === base) {
        return { ...prev, specialDays: others };
      }
      return {
        ...prev,
        specialDays: [...others, { date, rule: brush, note: special?.note }],
      };
    });
  };

  const renderRuleChips = (
    selected: FastingRule | undefined,
    onSelect: (rule: FastingRule) => void,
    compact: boolean = false
  ) => (
    <View style={styles.ruleRow}>
      {RULES.map(rule => {
        const config = FASTING_RULE_CONFIG[rule];
        const isSelected = selected === rule;
        return (
          <TouchableOpacity
            key={rule}
            onPress={() => onSelect(rule)}
            style={[
              styles.ruleChip,
              compact && styles.ruleChipCompact,
              {
                backgroundColor: isSelected ? config.color : '#fff',
                borderColor: config.color,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={config.icon as any}
              size={compact ? 13 : 15}
              color={isSelected ? '#fff' : config.color}
            />
            <Text
              style={[
                styles.ruleChipText,
                compact && styles.ruleChipTextCompact,
                { color: isSelected ? '#fff' : config.color },
              ]}
            >
              {config.shortLabel}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.presetHint}>Брзо додавање:</Text>
        <View style={styles.presetRow}>
          {FASTING_PRESETS.map(preset => (
            <TouchableOpacity
              key={preset.name}
              style={styles.presetChip}
              onPress={() => openNew(preset)}
            >
              <Text style={styles.presetChipText}>+ {preset.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && <ActivityIndicator style={{ marginTop: 24 }} color={COLORS.PRIMARY} />}

        {!loading && periods.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="sprout" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Сè уште нема внесено пости</Text>
            <Text style={styles.emptySubtext}>
              Користете ги шаблоните погоре или копчето + за нов пост
            </Text>
          </View>
        )}

        {periods.map(period => {
          return (
            <Card key={period.id} style={styles.periodCard}>
              <Card.Content>
                <View style={styles.periodHeader}>
                  <View style={[styles.periodRuleTag, { backgroundColor: '#6B4E9B' }]}>
                    <MaterialCommunityIcons name="sprout" size={12} color="#fff" />
                    <Text style={styles.periodRuleTagText}>{period.specialDays.length} дена</Text>
                  </View>
                  <Title style={styles.periodName}>{period.name}</Title>
                  <Switch
                    value={period.isActive}
                    onValueChange={() => toggleActive(period)}
                    color={COLORS.SUCCESS}
                  />
                </View>
                <Text style={styles.periodRange}>
                  {format(period.startDate, 'd MMMM', { locale: mk })} -{' '}
                  {format(period.endDate, 'd MMMM yyyy', { locale: mk })}
                </Text>
                <View style={styles.periodActions}>
                  <Button
                    mode="outlined"
                    compact
                    textColor={COLORS.PRIMARY}
                    onPress={() => openEdit(period)}
                  >
                    Измени
                  </Button>
                  <Button
                    mode="outlined"
                    compact
                    textColor="#B3261E"
                    onPress={() => handleDelete(period)}
                  >
                    Избриши
                  </Button>
                </View>
              </Card.Content>
            </Card>
          );
        })}

        <View style={{ height: 90 }} />
      </ScrollView>

      <FAB icon="plus" style={styles.fab} color="#fff" onPress={() => openNew()} />

      {/* Edit / create form */}
      <Modal
        visible={formVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFormVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
        >
          <View style={styles.formSheet}>
            <View style={styles.formHeader}>
              <Title style={styles.formTitle}>
                {draft.id ? 'Измени пост' : 'Нов пост'}
              </Title>
              <TouchableOpacity onPress={() => setFormVisible(false)}>
                <MaterialCommunityIcons name="close" size={26} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                label="Име *"
                value={draft.name}
                onChangeText={name => setDraft(prev => ({ ...prev, name }))}
                mode="outlined"
                style={styles.input}
              />

              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={styles.dateLabel}>Од</Text>
                  <Text style={styles.dateValue}>
                    {format(draft.startDate, 'd MMM yyyy', { locale: mk })}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Text style={styles.dateLabel}>До</Text>
                  <Text style={styles.dateValue}>
                    {format(draft.endDate, 'd MMM yyyy', { locale: mk })}
                  </Text>
                </TouchableOpacity>
              </View>

              {showStartPicker && (
                <DateTimePicker
                  value={draft.startDate}
                  mode="date"
                  onChange={(_, date) => {
                    setShowStartPicker(Platform.OS === 'ios');
                    if (date) setDraft(prev => ({ ...prev, startDate: date }));
                  }}
                />
              )}
              {showEndPicker && (
                <DateTimePicker
                  value={draft.endDate}
                  mode="date"
                  onChange={(_, date) => {
                    setShowEndPicker(Platform.OS === 'ios');
                    if (date) setDraft(prev => ({ ...prev, endDate: date }));
                  }}
                />
              )}

              <Text style={styles.sectionLabel}>Правила по денови</Text>
              <Text style={styles.specialHint}>
                За секое правило додајте ги деновите од типикот. Само додадените
                денови се прикажуваат како посни во календарот.
              </Text>
              {RULES.map(rule => {
                const config = FASTING_RULE_CONFIG[rule];
                const days = draft.specialDays
                  .filter(sd => sd.rule === rule)
                  .sort((a, b) => a.date.getTime() - b.date.getTime());
                return (
                  <View key={rule} style={[styles.ruleSection, { borderColor: config.color }]}>
                    <View style={styles.ruleSectionHeader}>
                      <View style={[styles.ruleSectionDot, { backgroundColor: config.color }]}>
                        <MaterialCommunityIcons name={config.icon as any} size={14} color="#fff" />
                      </View>
                      <Text style={[styles.ruleSectionTitle, { color: config.color }]}>
                        {config.shortLabel}{days.length > 0 ? ` (${days.length})` : ''}
                      </Text>
                      <Button
                        mode="text"
                        compact
                        textColor={config.color}
                        onPress={() => setAddDayForRule(rule)}
                      >
                        + Додади ден
                      </Button>
                    </View>
                    {days.length > 0 && (
                      <View style={styles.ruleDayChips}>
                        {days.map(sd => (
                          <TouchableOpacity
                            key={sd.date.toISOString()}
                            style={[styles.ruleDayChip, { backgroundColor: config.color }]}
                            onPress={() => removeDay(sd.date)}
                          >
                            <Text style={styles.ruleDayChipText}>
                              {format(sd.date, 'd MMM', { locale: mk })}
                            </Text>
                            <MaterialCommunityIcons name="close" size={12} color="#fff" />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
              <Text style={styles.specialHint}>
                Допрете на додаден ден за да го отстраните.
              </Text>
              {addDayForRule && (
                <DateTimePicker
                  value={draft.startDate}
                  mode="date"
                  onChange={(_, date) => {
                    const rule = addDayForRule;
                    setAddDayForRule(null);
                    if (date && rule) assignDay(date, rule);
                  }}
                />
              )}

              <TextInput
                label="Упатство (по избор)"
                value={draft.note || ''}
                onChangeText={note => setDraft(prev => ({ ...prev, note }))}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />

              <Button
                mode="contained"
                onPress={handleSave}
                loading={saving}
                disabled={saving}
                buttonColor={COLORS.PRIMARY}
                style={styles.saveButton}
              >
                Зачувај
              </Button>
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContent: {
    padding: 16,
  },
  presetHint: {
    fontSize: 13,
    fontWeight: '700',
    color: '#777',
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetChip: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.TERTIARY,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.TERTIARY,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#999',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#aaa',
    marginTop: 4,
    textAlign: 'center',
  },
  periodCard: {
    marginBottom: 12,
    backgroundColor: COLORS.CARD_BG,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    borderRadius: 15,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  periodRuleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  periodRuleTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  periodName: {
    fontSize: 16,
    flex: 1,
  },
  periodRange: {
    fontSize: 13,
    color: '#8a7a6a',
    marginTop: 4,
    marginBottom: 10,
  },
  periodActions: {
    flexDirection: 'row',
    gap: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    backgroundColor: COLORS.PRIMARY,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  formSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  formTitle: {
    color: COLORS.PRIMARY,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#B9B0A2',
    borderRadius: 6,
    padding: 10,
  },
  dateLabel: {
    fontSize: 11,
    color: '#888',
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#777',
    marginBottom: 8,
  },
  ruleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  ruleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  ruleChipCompact: {
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  ruleChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  ruleChipTextCompact: {
    fontSize: 11,
  },
  specialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  specialHint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  specialCard: {
    borderWidth: 1,
    borderColor: '#E4D9C2',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#FBF8EF',
  },
  specialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  specialDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specialDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  specialNote: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: 13,
    height: 36,
  },
  saveButton: {
    marginTop: 8,
  },
  ruleSection: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  ruleSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleSectionDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleSectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  ruleDayChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  ruleDayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  ruleDayChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  dayChip: {
    width: 40,
    height: 44,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipSpecial: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  dayChipDow: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dayChipNum: {
    fontSize: 15,
    fontWeight: '700',
  },
  gridLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    color: '#777',
    fontWeight: '700',
  },
});

export default ManageFastingScreen;
