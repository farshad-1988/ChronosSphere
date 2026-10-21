/**
 * Standalone Database Seeder for World Events REST API
 * Populates MongoDB with at least 25 diverse, high-detail global events.
 * Handles collection cleanup, index builds, and graceful connection teardown.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Event, IEvent } from '../models/Event';
import { connectToDatabase, disconnectFromDatabase } from '../lib/mongodb';

dotenv.config();

export interface SeedEventData {
  title: string;
  slug: string;
  description: string;
  category: 'cultural' | 'historical' | 'astronomical' | 'sports' | 'festival' | 'geopolitical' | 'science';
  date: {
    start: string;
    end?: string;
    isFloating?: boolean;
    solarHijriDate?: string;
  };
  location: {
    name: string;
    country: string;
    region: string;
    coordinates: {
      type: 'Point';
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
  importance: 'high' | 'medium' | 'low';
  tags: string[];
  media: {
    thumbnail?: string;
    banner?: string;
    credits?: string;
  };
  metadata: {
    recurring: boolean;
    recurrencePattern: 'yearly' | 'monthly' | 'quadrennial' | 'none';
    sourceUrl?: string;
  };
}

export const SEED_EVENTS: SeedEventData[] = [
  // 1. Iranian & Ancient Festivals
  {
    title: 'Nowruz (Persian New Year)',
    slug: 'nowruz-persian-new-year',
    description: 'Nowruz marks the vernal equinox, inaugurating the astronomical spring and the first day of Farvardin in the Solar Hijri calendar. Celebrated for over 3,000 years across Iran, Central Asia, and the Caucasus, it symbolizes rebirth, renewal, and the triumph of light over winter darkness. UNESCO inscribed Nowruz on its Representative List of the Intangible Cultural Heritage of Humanity.',
    category: 'festival',
    date: {
      start: '2026-03-20T14:46:00Z',
      end: '2026-03-24T00:00:00Z',
      isFloating: true,
      solarHijriDate: '1 Farvardin 1405',
    },
    location: {
      name: 'Tehran & Historic Persepolis',
      country: 'IR',
      region: 'Middle East',
      coordinates: {
        type: 'Point',
        coordinates: [52.8914, 29.9357], // Persepolis [lng, lat]
      },
    },
    importance: 'high',
    tags: ['nowruz', 'equinox', 'unesco', 'persian', 'haft-sin', 'spring'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1584447141399-be2c62da68c4?w=800&auto=format&fit=crop',
      banner: 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=1600&auto=format&fit=crop',
      credits: 'UNESCO / Cultural Heritage Archive',
    },
    metadata: {
      recurring: true,
      recurrencePattern: 'yearly',
      sourceUrl: 'https://ich.unesco.org/en/RL/nowruz-01161',
    },
  },
  {
    title: 'Yalda Night (Shab-e Yalda)',
    slug: 'yalda-night-shab-e-yalda',
    description: 'The ancient winter solstice festival celebrating the longest and darkest night of the year. Families gather to read Hafez poetry, eat pomegranates, watermelons, and dried nuts (Ajil) until the dawn reveals the victory of Mithra (light).',
    category: 'cultural',
    date: {
      start: '2026-12-21T18:00:00Z',
      end: '2026-12-22T06:00:00Z',
      isFloating: false,
      solarHijriDate: '30 Azar 1405',
    },
    location: {
      name: 'Isfahan Historic Square',
      country: 'IR',
      region: 'Middle East',
      coordinates: {
        type: 'Point',
        coordinates: [51.6775, 32.6573], // Isfahan [lng, lat]
      },
    },
    importance: 'high',
    tags: ['solstice', 'yalda', 'hafez', 'pomegranate', 'winter', 'ancient'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&auto=format&fit=crop',
      banner: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1600&auto=format&fit=crop',
      credits: 'Intangible Cultural Heritage Foundation',
    },
    metadata: {
      recurring: true,
      recurrencePattern: 'yearly',
      sourceUrl: 'https://ich.unesco.org/en/RL/yalda-chella-01877',
    },
  },
  {
    title: 'Mehregan (Festival of Autumn & Thanksgiving)',
    slug: 'mehregan-autumn-festival',
    description: 'An ancient Persian festival dedicated to Mithra, the divinity of covenants, friendship, and sunlight. Coinciding with the autumn harvest, Mehregan represents gratitude, justice, and community sharing.',
    category: 'festival',
    date: {
      start: '2026-10-02T10:00:00Z',
      end: '2026-10-04T22:00:00Z',
      solarHijriDate: '10 Mehr 1405',
    },
    location: {
      name: 'Yazd Fire Temple & Historic City',
      country: 'IR',
      region: 'Middle East',
      coordinates: {
        type: 'Point',
        coordinates: [54.3675, 31.8974], // Yazd [lng, lat]
      },
    },
    importance: 'medium',
    tags: ['mehregan', 'harvest', 'thanksgiving', 'mithra', 'autumn'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop',
      credits: 'Yazd Heritage Society',
    },
    metadata: {
      recurring: true,
      recurrencePattern: 'yearly',
    },
  },
  {
    title: 'Sadeh Fire Festival',
    slug: 'sadeh-fire-festival',
    description: 'Mid-winter celebration observed precisely 50 days and 50 nights before Nowruz. Huge ceremonial bonfires are lit at sunset to defeat the cold demons of winter and celebrate the discovery of fire by mythological King Hushang.',
    category: 'cultural',
    date: {
      start: '2026-01-30T16:00:00Z',
      end: '2026-01-30T23:59:00Z',
      solarHijriDate: '10 Bahman 1404',
    },
    location: {
      name: 'Kerman Ancient Plains',
      country: 'IR',
      region: 'Middle East',
      coordinates: {
        type: 'Point',
        coordinates: [57.0788, 30.2839], // Kerman [lng, lat]
      },
    },
    importance: 'medium',
    tags: ['sadeh', 'fire', 'winter', 'mythology', 'zoroastrian'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1498855926480-d98e83099315?w=800&auto=format&fit=crop',
      credits: 'Iranian Cultural Heritage Records',
    },
    metadata: {
      recurring: true,
      recurrencePattern: 'yearly',
    },
  },

  // 2. Global Historical Milestones
  {
    title: 'Apollo 11 Lunar Landing',
    slug: 'apollo-11-lunar-landing',
    description: 'Commander Neil Armstrong and Lunar Module Pilot Buzz Aldrin landed the Apollo Lunar Module Eagle on the Moon on July 20, 1969. Armstrong stepped onto the lunar surface six hours later, declaring: "That is one small step for man, one giant leap for mankind."',
    category: 'historical',
    date: {
      start: '1969-07-20T20:17:40Z',
      end: '1969-07-24T16:50:35Z',
    },
    location: {
      name: 'Kennedy Space Center, Florida',
      country: 'US',
      region: 'North America',
      coordinates: {
        type: 'Point',
        coordinates: [-80.6077, 28.5729], // KSC [lng, lat]
      },
    },
    importance: 'high',
    tags: ['space', 'apollo', 'moon', 'nasa', 'exploration', 'science'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&auto=format&fit=crop',
      banner: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop',
      credits: 'NASA Photo Archive',
    },
    metadata: {
      recurring: false,
      recurrencePattern: 'none',
      sourceUrl: 'https://www.nasa.gov/mission_pages/apollo/apollo-11.html',
    },
  },
  {
    title: 'Fall of the Berlin Wall',
    slug: 'fall-of-the-berlin-wall',
    description: 'On November 9, 1989, peaceful civil unrest in East Germany culminated in the historic announcement permitting East Berliners to cross into West Berlin. Crowds celebrated atop the wall at the Brandenburg Gate, heralding the end of the Cold War and German reunification.',
    category: 'historical',
    date: {
      start: '1989-11-09T17:53:00Z',
      end: '1989-11-10T12:00:00Z',
    },
    location: {
      name: 'Brandenburg Gate, Berlin',
      country: 'DE',
      region: 'Europe',
      coordinates: {
        type: 'Point',
        coordinates: [13.3777, 52.5163], // Berlin [lng, lat]
      },
    },
    importance: 'high',
    tags: ['berlin-wall', 'cold-war', 'germany', 'freedom', 'peace'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&auto=format&fit=crop',
      credits: 'German Historical Museum',
    },
    metadata: {
      recurring: false,
      recurrencePattern: 'none',
    },
  },
  {
    title: 'Universal Declaration of Human Rights Adoption',
    slug: 'universal-declaration-of-human-rights',
    description: 'The United Nations General Assembly adopted Resolution 217 A at the Palais de Chaillot in Paris, codifying inalienable rights fundamental to all human beings regardless of race, gender, nationality, religion, or language.',
    category: 'geopolitical',
    date: {
      start: '1948-12-10T10:00:00Z',
    },
    location: {
      name: 'Palais de Chaillot, Paris',
      country: 'FR',
      region: 'Europe',
      coordinates: {
        type: 'Point',
        coordinates: [2.2882, 48.8623], // Paris [lng, lat]
      },
    },
    importance: 'high',
    tags: ['human-rights', 'united-nations', 'paris', 'treaty', 'justice'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop',
      credits: 'UN Documentation Center',
    },
    metadata: {
      recurring: true,
      recurrencePattern: 'yearly',
      sourceUrl: 'https://www.un.org/en/about-us/universal-declaration-of-human-rights',
    },
  },
  {
    title: 'Antarctic Treaty Signing',
    slug: 'antarctic-treaty-signing',
    description: 'Signed in Washington D.C. by 12 nations, the treaty designated Antarctica as a global scientific preserve, establishing freedom of scientific investigation and banning military activity across the entire continent.',
    category: 'geopolitical',
    date: {
      start: '1959-12-01T14:00:00Z',
    },
    location: {
      name: 'Amundsen-Scott South Pole Station',
      country: 'AQ',
      region: 'Antarctica',
      coordinates: {
        type: 'Point',
        coordinates: [0.0, -89.9999], // South Pole [lng, lat]
      },
    },
    importance: 'high',
    tags: ['antarctica', 'peace', 'science', 'environment', 'treaty'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&auto=format&fit=crop',
      credits: 'Secretariat of the Antarctic Treaty',
    },
    metadata: {
      recurring: false,
      recurrencePattern: 'none',
      sourceUrl: 'https://www.ats.aq/',
    },
  },

  // 3. Astronomical Events
  {
    title: 'Perseid Meteor Shower Peak',
    slug: 'perseid-meteor-shower-peak',
    description: 'The prolific meteor shower associated with comet Swift-Tuttle radiates from constellation Perseus, producing up to 100 fast and bright fireballs per hour in dark night skies.',
    category: 'astronomical',
    date: {
      start: '2026-08-12T20:00:00Z',
      end: '2026-08-13T04:00:00Z',
      isFloating: true,
    },
    location: {
      name: 'Teide Observatory & Dark Sky Park, Canary Islands',
      country: 'ES',
      region: 'Europe',
      coordinates: {
        type: 'Point',
        coordinates: [-16.5103, 28.3005], // Teide Observatory [lng, lat]
      },
    },
    importance: 'medium',
    tags: ['perseids', 'meteor-shower', 'astronomy', 'stargazing', 'space'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop',
      credits: 'Instituto de Astrofisica de Canarias',
    },
    metadata: {
      recurring: true,
      recurrencePattern: 'yearly',
    },
  },
  {
    title: 'Total Solar Eclipse of August 12, 2026',
    slug: 'total-solar-eclipse-august-2026',
    description: 'A major total solar eclipse passing across Greenland, western Iceland, and northern Spain, providing over 2 minutes of totality and breathtaking coronal visibility over Europe.',
    category: 'astronomical',
    date: {
      start: '2026-08-12T16:30:00Z',
      end: '2026-08-12T18:45:00Z',
      isFloating: false,
    },
    location: {
      name: 'Reykjavik Coastal Path',
      country: 'IS',
      region: 'Europe',
      coordinates: {
        type: 'Point',
        coordinates: [-21.9426, 64.1466], // Reykjavik [lng, lat]
      },
    },
    importance: 'high',
    tags: ['solar-eclipse', 'totality', 'astronomy', 'sun', 'moon'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1532798369041-b33eb577ef1a?w=800&auto=format&fit=crop',
      credits: 'NASA Eclipse Prediction Center',
    },
    metadata: {
      recurring: false,
      recurrencePattern: 'none',
      sourceUrl: 'https://eclipse.gsfc.nasa.gov/solar.html',
    },
  },
  {
    title: 'Summer Solstice at Stonehenge',
    slug: 'summer-solstice-stonehenge',
    description: 'The astronomical alignment of the rising sun with the prehistoric Heel Stone at Stonehenge on the longest day of the year in the Northern Hemisphere, attracting astronomers, historians, and celebrants.',
    category: 'astronomical',
    date: {
      start: '2026-06-21T03:45:00Z',
      end: '2026-06-21T07:30:00Z',
      isFloating: true,
    },
    location: {
      name: 'Stonehenge Megaliths, Wiltshire',
      country: 'GB',
      region: 'Europe',
      coordinates: {
        type: 'Point',
        coordinates: [-1.8262, 51.1789], // Stonehenge [lng, lat]
      },
    },
    importance: 'medium',
    tags: ['solstice', 'stonehenge', 'archaeoastronomy', 'summer', 'megalith'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop',
      credits: 'English Heritage',
    },
    metadata: {
      recurring: true,
      recurrencePattern: 'yearly',
    },
  },
  {
    title: 'Geminid Meteor Shower Climax',
    slug: 'geminid-meteor-shower-climax',
    description: 'Originated from the asteroid 3200 Phaethon rather than a comet, the Geminids are known for multi-colored, slow-moving bolides radiating from constellation Gemini with zhr rates surpassing 120 meteors per hour.',
    category: 'astronomical',
    date: {
      start: '2026-12-13T21:00:00Z',
      end: '2026-12-14T05:00:00Z',
      isFloating: true,
    },
    location: {
      name: 'Mauna Kea Observatory, Hawaii',
      country: 'US',
      region: 'North America',
      coordinates: {
        type: 'Point',
        coordinates: [-155.4681, 19.8207], // Mauna Kea [lng, lat]
      },
    },
    importance: 'medium',
    tags: ['geminids', 'asteroid', 'phaethon', 'astronomy', 'meteor'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop',
      credits: 'International Meteor Organization',
    },
    metadata: {
      recurring: true,
      recurrencePattern: 'yearly',
    },
  },

  // 4. International Cultural & Religious Events
  {
    title: 'Carnival of Venice (Carnevale di Venezia)',
    slug: 'carnival-of-venice',
    description: 'World-famous masquerade carnival dating back to 1162, renowned for exquisite porcelain masks, velvet 18th-century Venetian costumes, masked balls, and gondola parades along the Grand Canal.',
    category: 'festival',
    date: {
      start: '2026-02-07T10:00:00Z',
      end: '2026-02-17T23:59:00Z',
      isFloating: true,
    },
    location: {
      name: 'Piazza San Marco, Venice',
      country: 'IT',
      region: 'Europe',
      coordinates: {
        type: 'Point',
        coordinates: [12.3388, 45.4342], // Venice [lng, lat]
      },
    },
    importance: 'high',
    tags: ['carnival', 'venice', 'masquerade', 'italy', 'culture', 'gondola'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1520175480921-4edfa2983e0f?w=800&auto=format&fit=crop',
      banner: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=1600&auto=format&fit=crop',
      credits: 'Venice Tourism Bureau',
    },
    metadata: {
      recurring: true,
      recurrencePattern: 'yearly',
      sourceUrl: 'https://www.carnevale.venezia.it/en/',
    },
  },
  {
    title: 'Rio de Janeiro Carnival',
    slug: 'rio-de-janeiro-carnival',
    description: 'Considered the biggest carnival in the world, with over two million people per day on the streets. Features vibrant Samba school competitions in the Sambadrome Marques de Sapucai, elaborate allegorical floats, and pulsating batucada drumming.',
    category: 'festival',
    date: {
      start: '2026-02-13T12:00:00Z',
      end: '2026-02-18T23:59:00Z',
      isFloating: true,
    },
    location: {
      name: 'Sambadrome Marques de Sapucai, Rio de Janeiro',
      country: 'BR',
      region: 'South America',
      coordinates: {
        type: 'Point',
        coordinates: [-43.1964, -22.9118], // Rio [lng, lat]
      },
    },
    importance: 'high',
    tags: ['carnival', 'samba', 'brazil', 'sambadrome', 'rio', 'dance'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop',
      credits: 'Riotur / City of Rio de Janeiro',
    },
    metadata: {
      recurring: true,
      recurrencePattern: 'yearly',
    },
  },
  {
    title: 'Diwali (Festival of Lights)',
    slug: 'diwali-festival-of-lights',
    description: 'The ancient spiritual festival celebrated across India and the global diaspora symbolizing the spiritual victory of dharma over adharma, light over darkness, and knowledge over ignorance. Millions of clay oil lamps (diyas) illuminate houses, temples, and ghats.',
    category: 'cultural',
    date: {
      start: '2026-11-08T00:00:00Z',
      end: '2026-11-12T23:59:00Z',
      isFloating: true,
    },
    location: {
      name: 'Varanasi Ghats & Ayodhya',
      country: 'IN',
      region: 'Asia',
      coordinates: {
        type: 'Point',
        coordinates: [83.0062, 25.3176], // Varanasi [lng, lat]
      },
    },
    importance: 'high',
    tags: ['diwali', 'lights', 'india', 'spiritual', 'diyas', 'hinduism'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?w=800&auto=format&fit=crop',
      credits: 'Incredible India Tourism',
    },
    metadata: {
      recurring: true,
      recurrencePattern: 'yearly',
    },
  },
  {
    title: 'Pingxi Sky Lantern Festival',
    slug: 'pingxi-sky-lantern-festival',
    description: 'Marking the conclusion of Lunar New Year festivities, tens of thousands of paper sky lanterns inscribed with handwritten prayers and wishes are simultaneously released into the night sky over Taiwan mountainous valleys.',
    category: 'festival',
    date: {
      start: '2026-03-03T17:00:00Z',
      end: '2026-03-03T22:00:00Z',
      isFloating: true,
    },
    location: {
      name: 'Pingxi District, New Taipei City',
      country: 'TW',
      region: 'Asia',
      coordinates: {
        type: 'Point',
        coordinates: [121.7412, 25.0258], // Pingxi [lng, lat]
      },
    },
    importance: 'medium',
    tags: ['lanterns', 'pingxi', 'taiwan', 'lunar-new-year', 'tradition'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop',
      credits: 'Taiwan Tourism Bureau',
    },
    metadata: {
      recurring: true,
      recurrencePattern: 'yearly',
    },
  },
  {
    title: 'Dia de los Muertos (Day of the Dead)',
    slug: 'dia-de-los-muertos',
    description: 'UNESCO-inscribed multi-day indigenous Mexican holiday where family and friends assemble ofrendas with cempasuchil (marigolds), sugar calaveras, and pan de muerto to warmly welcome back the spirits of departed loved ones.',
    category: 'cultural',
    date: {
      start: '2026-11-01T00:00:00Z',
      end: '2026-11-02T23:59:00Z',
      isFloating: false,
    },
    location: {
      name: 'Oaxaca Historic Center & Mixquic',
      country: 'MX',
      region: 'North America',
      coordinates: {
        type: 'Point',
        coordinates: [-96.7266, 17.0654], // Oaxaca [lng, lat]
      },
    },
    importance: 'high',
    tags: ['dia-de-muertos', 'mexico', 'ofrenda', 'unesco', 'cempasuchil'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop',
      credits: 'Secretaria de Cultura de Mexico',
    },
    metadata: {
      recurring: true,
      recurrencePattern: 'yearly',
    },
  },
  {
    title: 'Kyoto Gion Matsuri',
    slug: 'kyoto-gion-matsuri',
    description: 'One of the oldest festivals in Japan, dating back to 869 AD as a purification ritual against plague. Towering 25-meter wooden Yamaboko floats constructed without nails parade through central Kyoto accompanied by traditional Gion-bayashi music.',
    category: 'cultural',
    date: {
      start: '2026-07-01T09:00:00Z',
      end: '2026-07-31T21:00:00Z',
      isFloating: false,
    },
    location: {
      name: 'Yasaka Shrine, Kyoto',
      country: 'JP',
      region: 'Asia',
      coordinates: {
        type: 'Point',
        coordinates: [135.7785, 35.0037], // Kyoto Yasaka [lng, lat]
      },
    },
    importance: 'high',
    tags: ['japan', 'gion', 'kyoto', 'yamaboko', 'shinto', 'unesco'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop',
      credits: 'Kyoto City Tourism Association',
    },
    metadata: {
      recurring: true,
      recurrencePattern: 'yearly',
    },
  },

  // 5. Major Global Summits & Sports
  {
    title: 'Games of the XXXIII Olympiad (Paris 2024)',
    slug: 'olympic-games-paris-2024',
    description: 'Centenary return of the Olympic Games to Paris, featuring a historic open-air opening ceremony along the River Seine, urban sports at Place de la Concorde, and equestrian events at the Palace of Versailles.',
    category: 'sports',
    date: {
      start: '2024-07-26T17:30:00Z',
      end: '2024-08-11T22:00:00Z',
    },
    location: {
      name: 'Stade de France & River Seine, Paris',
      country: 'FR',
      region: 'Europe',
      coordinates: {
        type: 'Point',
        coordinates: [2.3601, 48.9244], // Stade de France [lng, lat]
      },
    },
    importance: 'high',
    tags: ['olympics', 'paris2024', 'athletics', 'sports', 'ioc'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?w=800&auto=format&fit=crop',
      banner: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&auto=format&fit=crop',
      credits: 'International Olympic Committee',
    },
    metadata: {
      recurring: true,
      recurrencePattern: 'quadrennial',
      sourceUrl: 'https://olympics.com/en/paris-2024',
    },
  },
  {
    title: 'FIFA World Cup 2026 Kickoff',
    slug: 'fifa-world-cup-2026-kickoff',
    description: 'The inaugural 48-team FIFA World Cup jointly hosted by 16 cities across Canada, Mexico, and the United States, representing the largest international tournament in soccer history with the opening match at Estadio Azteca.',
    category: 'sports',
    date: {
      start: '2026-06-11T19:00:00Z',
      end: '2026-07-19T22:00:00Z',
    },
    location: {
      name: 'Estadio Azteca, Mexico City',
      country: 'MX',
      region: 'North America',
      coordinates: {
        type: 'Point',
        coordinates: [-99.1506, 19.3029], // Azteca [lng, lat]
      },
    },
    importance: 'high',
    tags: ['fifa', 'world-cup', 'soccer', 'football', 'north-america'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop',
      credits: 'FIFA Official Media',
    },
    metadata: {
      recurring: true,
      recurrencePattern: 'quadrennial',
      sourceUrl: 'https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026',
    },
  },
  {
    title: 'Nobel Prize Award Ceremonies',
    slug: 'nobel-prize-ceremonies',
    description: 'Annual presentation of the Nobel Prizes in Physics, Chemistry, Physiology or Medicine, Literature, and Economic Sciences at the Stockholm Concert Hall, accompanied by the Nobel Peace Prize ceremony in Oslo.',
    category: 'science',
    date: {
      start: '2026-12-10T15:30:00Z',
      end: '2026-12-10T22:00:00Z',
    },
    location: {
      name: 'Stockholm Concert Hall (Konserthuset)',
      country: 'SE',
      region: 'Europe',
      coordinates: {
        type: 'Point',
        coordinates: [18.0628, 59.3364], // Stockholm [lng, lat]
      },
    },
    importance: 'high',
    tags: ['nobel', 'science', 'peace', 'stockholm', 'literature', 'physics'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop',
      credits: 'Nobel Foundation',
    },
    metadata: {
      recurring: true,
      recurrencePattern: 'yearly',
      sourceUrl: 'https://www.nobelprize.org/',
    },
  },
  {
    title: 'CERN Large Hadron Collider First Beam',
    slug: 'cern-lhc-first-beam',
    description: 'Physicists at the European Organization for Nuclear Research successfully circulated the first proton beam around the 27-kilometer subterranean collider ring beneath the Franco-Swiss border, initiating discoveries culminating in the Higgs Boson.',
    category: 'science',
    date: {
      start: '2008-09-10T07:28:00Z',
    },
    location: {
      name: 'CERN Laboratory, Geneva / Meyrin',
      country: 'CH',
      region: 'Europe',
      coordinates: {
        type: 'Point',
        coordinates: [6.0499, 46.2330], // CERN [lng, lat]
      },
    },
    importance: 'high',
    tags: ['cern', 'physics', 'higgs-boson', 'particle-physics', 'lhc'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop',
      credits: 'CERN Document Server',
    },
    metadata: {
      recurring: false,
      recurrencePattern: 'none',
      sourceUrl: 'https://home.cern/',
    },
  },
  {
    title: 'Earth Hour Global Environmental Movement',
    slug: 'earth-hour-global',
    description: 'Worldwide grassroots movement organized by the World Wide Fund for Nature (WWF) where millions of citizens, skylines, and landmarks turn off non-essential electric lights for one hour to demonstrate commitment to our planet.',
    category: 'geopolitical',
    date: {
      start: '2026-03-28T20:30:00Z',
      end: '2026-03-28T21:30:00Z',
      isFloating: true,
    },
    location: {
      name: 'Sydney Opera House & Worldwide Landmarks',
      country: 'AU',
      region: 'Oceania',
      coordinates: {
        type: 'Point',
        coordinates: [151.2153, -33.8568], // Sydney Opera House [lng, lat]
      },
    },
    importance: 'medium',
    tags: ['earth-hour', 'climate', 'wwf', 'conservation', 'sustainability'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop',
      credits: 'Earth Hour International',
    },
    metadata: {
      recurring: true,
      recurrencePattern: 'yearly',
      sourceUrl: 'https://www.earthhour.org/',
    },
  },
  {
    title: 'Silk Road Caravan Network Inscription',
    slug: 'silk-road-chang-an-tianshan-corridor',
    description: 'Formal UNESCO World Heritage inscription of the 5,000 km Chang\'an-Tianshan section of the historic Silk Road network linking China, Kazakhstan, and Kyrgyzstan, celebrating millennia of Eurasian commerce, scientific diffusion, and philosophical exchange.',
    category: 'historical',
    date: {
      start: '2014-06-22T08:00:00Z',
    },
    location: {
      name: 'Xi\'an Ancient Walled Capital',
      country: 'CN',
      region: 'Asia',
      coordinates: {
        type: 'Point',
        coordinates: [108.9398, 34.3416], // Xi'an [lng, lat]
      },
    },
    importance: 'high',
    tags: ['silk-road', 'trade', 'unesco', 'heritage', 'history'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=800&auto=format&fit=crop',
      credits: 'UNESCO Silk Roads Programme',
    },
    metadata: {
      recurring: false,
      recurrencePattern: 'none',
    },
  },
  {
    title: 'James Webb Space Telescope First Deep Field',
    slug: 'jwst-first-deep-field-smacs-0723',
    description: 'NASA, ESA, and CSA released the sharpest and deepest infrared image of the distant universe ever captured: Galaxy Cluster SMACS 0723, revealing thousands of galaxies dating back over 13.1 billion years via gravitational lensing.',
    category: 'science',
    date: {
      start: '2022-07-11T22:20:00Z',
    },
    location: {
      name: 'Space Telescope Science Institute, Baltimore',
      country: 'US',
      region: 'North America',
      coordinates: {
        type: 'Point',
        coordinates: [-76.6231, 39.3332], // STScI [lng, lat]
      },
    },
    importance: 'high',
    tags: ['jwst', 'astronomy', 'galaxies', 'infrared', 'deep-field', 'science'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&auto=format&fit=crop',
      credits: 'NASA / ESA / CSA / STScI',
    },
    metadata: {
      recurring: false,
      recurrencePattern: 'none',
      sourceUrl: 'https://webbtelescope.org/',
    },
  },
  {
    title: 'World Economic Forum Annual Meeting Davos',
    slug: 'wef-annual-meeting-davos',
    description: 'Pinnacle summit uniting international heads of state, CEOs of global corporations, economists, and civil society leaders in the Swiss Alps to shape regional and industry agendas.',
    category: 'geopolitical',
    date: {
      start: '2026-01-19T08:00:00Z',
      end: '2026-01-23T18:00:00Z',
    },
    location: {
      name: 'Davos Congress Centre, Graubünden',
      country: 'CH',
      region: 'Europe',
      coordinates: {
        type: 'Point',
        coordinates: [9.8258, 46.8027], // Davos [lng, lat]
      },
    },
    importance: 'medium',
    tags: ['wef', 'davos', 'economy', 'global-governance', 'summit'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop',
      credits: 'World Economic Forum Swiss Media',
    },
    metadata: {
      recurring: true,
      recurrencePattern: 'yearly',
    },
  },
  {
    title: 'Tour de France Grand Depart',
    slug: 'tour-de-france-grand-depart',
    description: 'The world\'s most prestigious and grueling multi-stage bicycle road race, covering more than 3,500 kilometers over 21 stages across mountain passes of the Alps and Pyrenees, culminating at the Champs-Elysees in Paris.',
    category: 'sports',
    date: {
      start: '2026-07-04T10:00:00Z',
      end: '2026-07-26T19:00:00Z',
    },
    location: {
      name: 'Champs-Elysees Finish Line, Paris',
      country: 'FR',
      region: 'Europe',
      coordinates: {
        type: 'Point',
        coordinates: [2.3089, 48.8698], // Paris [lng, lat]
      },
    },
    importance: 'high',
    tags: ['tour-de-france', 'cycling', 'alps', 'sports', 'france'],
    media: {
      thumbnail: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop',
      credits: 'Amaury Sport Organisation',
    },
    metadata: {
      recurring: true,
      recurrencePattern: 'yearly',
      sourceUrl: 'https://www.letour.fr/en/',
    },
  },
];

/**
 * Main seed execution routine
 */
export async function seedDatabase(): Promise<void> {
  console.log('--- ChronosSphere Database Seeder ---');

  const mongooseInstance = await connectToDatabase();
  if (!mongooseInstance) {
    console.warn('[Seeder Warning] MONGODB_URI not found or empty. Using in-memory dataset mode.');
    return;
  }

  try {
    console.log('[Seeder] Connected to MongoDB cluster:', mongooseInstance.connection.name);

    // 1. Clear existing events collection
    console.log('[Seeder] Clearing events collection...');
    await Event.deleteMany({});

    // 2. Insert rich seed records
    console.log(`[Seeder] Inserting ${SEED_EVENTS.length} global records...`);
    const formattedDocs = SEED_EVENTS.map((e) => ({
      ...e,
      date: {
        ...e.date,
        start: new Date(e.date.start),
        end: e.date.end ? new Date(e.date.end) : undefined,
      },
    }));

    const inserted = await Event.insertMany(formattedDocs);
    console.log(`[Seeder] Successfully created ${inserted.length} events!`);

    // 3. Ensure indexes are created
    console.log('[Seeder] Syncing 2dsphere and compound indexes...');
    await Event.syncIndexes();
    console.log('[Seeder] All indexes synchronized successfully.');
  } catch (err) {
    console.error('[Seeder Error] Failed during database seeding:', err);
    throw err;
  } finally {
    await disconnectFromDatabase();
    console.log('[Seeder] Connection closed cleanly.');
  }
}

// Allow direct CLI invocation `npm run seed` or `npx tsx scripts/seed.ts`
if (typeof process !== 'undefined' && process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase()
    .then(() => {
      console.log('[Seeder] Seed script finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seeder Fatal]', err);
      process.exit(1);
    });
}
