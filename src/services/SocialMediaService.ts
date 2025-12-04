import { Linking, Share } from 'react-native';
import { ChurchEvent } from './ChurchCalendarService';
import { format } from 'date-fns';
import { mk } from 'date-fns/locale';
import { CONFIG } from '../constants/config';
import ApiService from './ApiService';

const {
  FACEBOOK_GROUP: FACEBOOK_GROUP_URL,
  WEBSITE: WEBSITE_URL,
  FACEBOOK,
  AUTO_POST
} = CONFIG.SOCIAL_MEDIA;

class SocialMediaService {
  openFacebookGroup = () => {
    Linking.openURL(FACEBOOK_GROUP_URL);
  };

  openWebsite = () => {
    Linking.openURL(WEBSITE_URL);
  };

  openContact = () => {
    Linking.openURL('tel:+41798293999');
  };

  shareEvent = async (event: ChurchEvent) => {
    const formattedDate = format(event.date, 'dd MMMM yyyy', { locale: mk });
    const message = `${event.name}\nДатум: ${formattedDate}\nВреме: ${event.time}\n\n${event.description || ''}\n\nПовеќе информации на нашата веб-страница: ${WEBSITE_URL}`;

    try {
      await Share.share({
        message,
        title: event.name,
      });
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };

  postToFacebookGroup = async (title: string, message: string) => {
    if (!AUTO_POST.ENABLED || !AUTO_POST.PLATFORMS.FACEBOOK) return true;
    if (!FACEBOOK.ACCESS_TOKEN || !FACEBOOK.GROUP_ID) {
      console.warn('Facebook credentials not configured');
      return false;
    }

    try {
      const fullMessage = `${title}\n\n${message}\n\nПовеќе информации: ${WEBSITE_URL}`;
      
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${FACEBOOK.GROUP_ID}/feed`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: fullMessage,
            access_token: FACEBOOK.ACCESS_TOKEN,
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok || data.error) {
        throw new Error(data.error?.message || 'Failed to post to Facebook');
      }

      return true;
    } catch (error) {
      console.error('Error posting to Facebook:', error);
      return false;
    }
  };

  postToWebsite = async (title: string, message: string) => {
    if (!AUTO_POST.ENABLED || !AUTO_POST.PLATFORMS.WEBSITE) return true;

    try {
      const response = await ApiService.createPost({
        title,
        content: message,
        type: 'notification',
        date: new Date().toISOString(),
        metadata: {
          source: 'mobile_app',
          autoPost: true
        }
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to post to website');
      }

      return true;
    } catch (error) {
      console.error('Error posting to website:', error);
      return false;
    }
  };

  postNotificationToSocialMedia = async (title: string, message: string) => {
    if (!AUTO_POST.ENABLED) return { facebookSuccess: true, websiteSuccess: true };

    const results = await Promise.all([
      this.postToFacebookGroup(title, message),
      this.postToWebsite(title, message)
    ]);

    return {
      facebookSuccess: results[0],
      websiteSuccess: results[1]
    };
  };

  postEventToSocialMedia = async (event: ChurchEvent, notificationType: 'week' | 'day' | 'hour') => {
    if (!AUTO_POST.ENABLED) return { facebookSuccess: true, websiteSuccess: true };

    const formattedDate = format(event.date, 'dd MMMM yyyy', { locale: mk });
    let title = '';
    let message = '';

    switch (notificationType) {
      case 'week':
        title = `Најава: ${event.name}`;
        message = `Следната недела на ${formattedDate} во ${event.time} ќе се одржи ${event.name}.\n\n${event.description || ''}`;
        break;
      case 'day':
        title = `Потсетник: ${event.name}`;
        message = `Утре во ${event.time} ќе се одржи ${event.name}.\n\n${event.description || ''}`;
        break;
      case 'hour':
        title = `${event.name} започнува наскоро`;
        message = `За 1 час започнува ${event.name}.\n\n${event.description || ''}`;
        break;
    }

    return this.postNotificationToSocialMedia(title, message);
  };
}

export default new SocialMediaService(); 