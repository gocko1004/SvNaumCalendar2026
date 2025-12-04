# Google Play Store Setup Guide - Св. Наум Охридски, Триенген

## 1. Подготовка на EAS Build

### Инсталирај EAS CLI
```bash
npm install -g @expo/eas-cli
```

### Логирај се во Expo
```bash
eas login
```

### Конфигурирај проект
```bash
eas build:configure
```

### Генерирај upload key за Google Play
```bash
eas credentials
```
Избери "Android" → "Set up new keystore" → "Generate new keystore"

**ВАЖНО:** Зачувај го keystore-от безбедно! Ќе ти треба за идни апдејти.

## 2. Build на апликацијата

### Production build
```bash
eas build --platform android --profile production
```

Ова ќе генерира APK/AAB фајл за Google Play Store.

## 3. Google Play Console Setup

### Создај нова апликација
1. Оди на [Google Play Console](https://play.google.com/console)
2. Кликни "Create app"
3. Пополни:
   - **App name:** Св. Наум Охридски, Триенген
   - **Default language:** Macedonian (mk)
   - **App or game:** App
   - **Free or paid:** Free

### Store listing
1. **Short description (80 chars):**
   ```
   Календар на богослужби и известувања за црковната општина Св. Наум Охридски, Триенген.
   ```

2. **Full description:**
   ```
   Оваа апликација служи како календар на богослужбите во црквата, како и за потребите и новостите во црковната општина Св. Наум Охридски, Триенген. Корисниците можат да ги следат датумите на службите, да примаат известувања и да останат информирани за важни активности и информации од општината. Апликацијата е едноставна за користење и достапна и офлајн за последно преземените податоци.
   ```

3. **Keywords:** православие, црква, календар, литургија, Триенген, Св. Наум, Охридски, црковна општина, служби, известувања

4. **Category:** Lifestyle

5. **Contact details:**
   - Website: [твојот вебсајт]
   - Email: svnaum.triengen@gmail.com
   - Phone: [твојот телефон]

### Assets потребни
1. **App icon:** 512×512 px (веќе имаш во assets/icon.png)
2. **Feature graphic:** 1024×500 px
3. **Screenshots:** 3-8 слики од апликацијата
   - Phone: 320-3840 px ширина, 320-3840 px висина
   - 7-inch tablet: 320-3840 px ширина, 320-3840 px висина
   - 10-inch tablet: 320-3840 px ширина, 320-3840 px висина

### Privacy Policy
1. Објави ја PRIVACY_POLICY.md на Google Sites или GitHub Pages
2. Додај го URL-то во Play Console

## 4. Data Safety

Во Play Console, пополни го Data Safety делот:

### Data types
- **Personal info:** Не собира
- **Device or other IDs:** Не собира
- **App activity:** Не собира
- **App info and performance:** Не собира

### Data usage
- **App functionality:** Да (за календар и известувања)
- **Analytics:** Не
- **Developer communications:** Не
- **Advertising or marketing:** Не
- **Personalization:** Не

### Data sharing
- **With third parties:** Не
- **For advertising:** Не
- **For analytics:** Не

## 5. Content Rating

1. Пополни го content rating questionnaire
2. За религиозна апликација, избери "Everyone" rating

## 6. Target audience

1. **Age range:** 18+ (или како што одлучиш)
2. **Primary audience:** Adults
3. **Content guidelines:** Follow religious content guidelines

## 7. Upload и Publish

### Upload APK/AAB
1. Оди на "Release" → "Production"
2. Кликни "Create new release"
3. Upload го APK/AAB фајлот од EAS build
4. Додај release notes на македонски

### Review и Submit
1. Провери дека сите секции се пополнети
2. Кликни "Send for review"
3. Чекај одобрување (обично 1-3 дена)

## 8. Post-launch

### Мониторинг
- Следи ги reviews и ratings
- Одговори на кориснички прашања
- Ажурирај ја апликацијата редовно

### Ажурирања
За идни верзии:
1. Зголеми го versionCode во app.json
2. Ажурирај ја верзијата
3. Направи нов EAS build
4. Upload во Play Console

## Корисни команди

```bash
# Провери статус на build
eas build:list

# Download build
eas build:download [BUILD_ID]

# Submit до Play Store (ако имаш service account)
eas submit --platform android
```

## Troubleshooting

### Build грешки
- Провери дека си логиран во EAS
- Провери дека имаш правилни credentials
- Провери дека си во правилниот проект

### Play Console грешки
- Провери дека симетричните податоци се точни
- Провери дека assets-ите се со правилни димензии
- Провери дека privacy policy URL-то работи

## Контакт за поддршка

- Email: svnaum.triengen@gmail.com
- EAS документација: https://docs.expo.dev/build/introduction/
- Google Play Console help: https://support.google.com/googleplay/android-developer
