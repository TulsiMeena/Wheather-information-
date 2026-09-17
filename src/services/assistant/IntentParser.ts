import { AssistantIntent } from '../../types/assistant';

interface ParsedQuery {
  intent: AssistantIntent;
  targetDay?: 'today' | 'tomorrow' | 'afterTomorrow' | 'week';
  targetLocationQuery?: string;
  isHindiOrHinglish?: boolean;
}

export class IntentParser {
  static parse(query: string): ParsedQuery {
    const raw = query.trim().toLowerCase();

    // Check if query is Hindi/Hinglish
    const isHindiOrHinglish =
      /[\u0900-\u097F]/.test(raw) ||
      /\b(aaj|kal|barish|barsat|kaisa|kaise|hogi|hoga|hawa|chata|bahar|subah|shaam|dhoop|garmi|sardi|kapde|hafta|kitna|kitni|mausam|suraj)\b/i.test(raw);

    // 1. TRAVEL / LOCATION COMPARISON / SPECIFIC PLACE
    if (
      /\b(travel|trip|ghoomne|safar|tour)\b/i.test(raw) ||
      /\b(weather in|weather of|weather at)\s+([a-zA-Z\s]+)/i.test(raw) ||
      /\b([a-zA-Z\s]+)\s+ka\s+mausam\b/i.test(raw)
    ) {
      // Extract location if present
      let locQuery: string | undefined;
      const match1 = raw.match(/\b(?:weather in|weather of|weather at|to|for)\s+([a-zA-Z\s]+)/i);
      const match2 = raw.match(/\b([a-zA-Z\s]+)\s+ka\s+mausam\b/i);
      if (match1 && match1[1]) locQuery = match1[1].trim();
      else if (match2 && match2[1]) locQuery = match2[1].trim();

      return {
        intent: 'TRAVEL_PLANNER',
        targetLocationQuery: locQuery,
        isHindiOrHinglish
      };
    }

    // 2. DAY COMPARISON (e.g. today vs tomorrow, कल vs परसों, which day is better)
    if (
      /\b(vs|versus|compare|tulna|better day|behtar din|konsa din|kaun sa din|which day|tomorrow vs)\b/i.test(raw) ||
      (raw.includes('कल') && raw.includes('परसों')) ||
      (raw.includes('आज') && raw.includes('कल')) ||
      (raw.includes('today') && raw.includes('tomorrow'))
    ) {
      return { intent: 'WEATHER_COMPARISON', isHindiOrHinglish };
    }

    // 3. UMBRELLA
    if (
      /\b(umbrella|chata|chhata|raincoat|chhatri|छाता|छतरी)\b/i.test(raw) ||
      raw.includes('क्या छाता ले जाना चाहिए') ||
      raw.includes('umbrella le jau')
    ) {
      return { intent: 'UMBRELLA', isHindiOrHinglish };
    }

    // 4. CLOTHING ("What to wear")
    if (
      /\b(clothing|clothes|wear|kapde|kapda|pehne|pehan|dress|jacket|sweater|कपड़े|पहनूं)\b/i.test(raw) ||
      raw.includes('क्या पहनूं') ||
      raw.includes('what to wear')
    ) {
      return { intent: 'CLOTHING', isHindiOrHinglish };
    }

    // 5. BEST OUTDOOR TIME ("Best time outside")
    if (
      /\b(outdoor|outside|bahar|walk|running|cycling|jogging|best time|good time|behtar samay|subah ya shaam|morning or evening)\b/i.test(raw) ||
      raw.includes('बाहर जाना') ||
      raw.includes('bahar jana') ||
      raw.includes('best time to go outside')
    ) {
      return { intent: 'BEST_OUTDOOR_TIME', isHindiOrHinglish };
    }

    // 6. RAIN / PRECIPITATION
    if (
      /\b(rain|raining|showers|precipitation|barsat|barish|baarish|drizzle|storm|thunderstorm|बारिश|बरसात|बूंदाबांदी)\b/i.test(raw) ||
      raw.includes('बारिश होगी') ||
      raw.includes('rain hogi') ||
      raw.includes('will it rain')
    ) {
      const isTomorrow = /\b(tomorrow|kal|agla din)\b/i.test(raw) && !raw.includes('aaj');
      return {
        intent: 'RAIN',
        targetDay: isTomorrow ? 'tomorrow' : 'today',
        isHindiOrHinglish
      };
    }

    // 7. AQI / AIR QUALITY
    if (
      /\b(aqi|air quality|air|pollution|pradushan|smog|pm2\.5|pm10|hawa ki quality|वायु गुणवत्ता|प्रदूषण)\b/i.test(raw) ||
      raw.includes('aqi kaisa') ||
      raw.includes('air quality')
    ) {
      return { intent: 'AQI', isHindiOrHinglish };
    }

    // 8. UV INDEX
    if (
      /\b(uv|ultraviolet|uv index|dhoop|sunscreen|sunburn|solar|radiation)\b/i.test(raw) ||
      raw.includes('uv kitna') ||
      raw.includes('dhoop kitni')
    ) {
      return { intent: 'UV', isHindiOrHinglish };
    }

    // 9. WIND
    if (
      /\b(wind|windy|gust|gusts|hawa|toofan|aandhi|breeze|हवा|आंधी)\b/i.test(raw) ||
      raw.includes('hawa kitni') ||
      raw.includes('wind speed')
    ) {
      return { intent: 'WIND', isHindiOrHinglish };
    }

    // 10. SUNRISE / SUNSET
    if (
      /\b(sunrise|dawn|suraj niklega|suryoday|subah ka suraj|सूर्योदय)\b/i.test(raw)
    ) {
      return { intent: 'SUNRISE', isHindiOrHinglish };
    }

    if (
      /\b(sunset|dusk|suraj dubega|suryast|sham ka suraj|सूर्यास्त)\b/i.test(raw)
    ) {
      return { intent: 'SUNSET', isHindiOrHinglish };
    }

    // 11. TEMPERATURE & FEELS LIKE
    if (
      /\b(feels like|real feel|feel like|mehsoos)\b/i.test(raw)
    ) {
      return { intent: 'FEELS_LIKE', isHindiOrHinglish };
    }

    if (
      /\b(temperature|temp|garmi|thand|cold|hot|warmest|hottest|tapman|तापमान|गर्मी|ठंड)\b/i.test(raw) ||
      raw.includes('sabse garm') ||
      raw.includes('warmest period')
    ) {
      return { intent: 'TEMPERATURE', isHindiOrHinglish };
    }

    // 12. WEEK / MULTI-DAY FORECAST
    if (
      /\b(week|weekend|7 days|7 day|weekly|hafte|agla hafta|is hafte|hafta)\b/i.test(raw) ||
      raw.includes('इस हफ्ते') ||
      raw.includes('this week')
    ) {
      return { intent: 'WEEK_FORECAST', isHindiOrHinglish };
    }

    // 13. TOMORROW FORECAST
    if (
      /\b(tomorrow|kal|agla din|कल)\b/i.test(raw) &&
      !raw.includes('aaj') &&
      !raw.includes('today')
    ) {
      return { intent: 'DAILY_FORECAST', targetDay: 'tomorrow', isHindiOrHinglish };
    }

    // 14. HOURLY FORECAST
    if (
      /\b(hourly|hours|timing|schedule|samay|timeline|ghante|ghanta)\b/i.test(raw)
    ) {
      return { intent: 'HOURLY_FORECAST', isHindiOrHinglish };
    }

    // 15. DATA FRESHNESS / SOURCE
    if (
      /\b(freshness|accuracy|reliable|source|update|kab update|fresh|real-time|bureau)\b/i.test(raw)
    ) {
      return { intent: 'DATA_FRESHNESS', isHindiOrHinglish };
    }

    // DEFAULT: CURRENT WEATHER
    return { intent: 'CURRENT_WEATHER', isHindiOrHinglish };
  }
}
