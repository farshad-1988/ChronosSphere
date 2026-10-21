/**
 * High-Precision Procedural Cartography Engine for Earth Globe
 * Provides accurate continent outlines, international borders, archipelagoes,
 * biomes, bathymetric ocean shelves, and urban night lights.
 */
import * as THREE from 'three';

// Coordinate helper: [lng, lat] to canvas [x, y]
export function lngLatToCanvas(lng: number, lat: number, width: number, height: number): [number, number] {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return [x, y];
}

export function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

type Polygon = [number, number][];

/**
 * Detailed real-world coastline polygons (sampled with high fidelity)
 */
export const CONTINENTS_GEO: Record<string, Polygon[]> = {
  // Eurasia Main
  eurasia: [
    // Europe & Asia Mainland
    [
      [-9.5, 36.5], [-9.0, 43.0], [-1.8, 43.5], [-4.8, 48.4], [1.9, 50.9],
      [8.5, 54.0], [8.0, 57.5], [10.5, 57.8], [12.5, 55.5], [18.5, 54.5],
      [24.5, 57.0], [28.0, 60.0], [24.0, 65.5], [20.0, 70.0], [28.0, 71.0],
      [36.0, 69.5], [44.0, 68.0], [50.0, 69.0], [60.0, 70.0], [75.0, 73.0],
      [85.0, 75.0], [105.0, 77.5], [115.0, 74.0], [140.0, 72.0], [160.0, 70.0],
      [170.0, 67.0], [180.0, 65.0], [170.0, 60.0], [160.0, 56.0], [156.0, 51.0],
      [143.0, 49.0], [136.0, 45.0], [130.0, 42.5], [129.0, 35.0], [126.0, 34.0],
      [121.5, 31.5], [119.5, 26.0], [113.5, 22.0], [108.5, 19.0], [104.5, 10.5],
      [101.0, 6.0], [103.5, 1.3], [98.5, 3.5], [96.0, 16.5], [92.5, 21.0],
      [88.5, 22.0], [82.0, 17.0], [80.0, 13.0], [77.5, 8.0], [73.5, 15.5],
      [72.5, 21.0], [68.5, 24.5], [62.5, 25.5], [57.0, 26.0], [56.0, 27.0],
      [51.5, 25.5], [50.5, 26.5], [48.0, 30.0], [45.0, 38.0], [40.0, 41.0],
      [35.0, 36.0], [36.0, 32.0], [34.5, 31.0], [32.5, 31.5], [29.0, 31.0],
      [27.0, 38.0], [23.5, 38.0], [21.5, 37.0], [19.5, 42.0], [14.0, 45.5],
      [12.5, 44.0], [15.5, 40.5], [15.5, 38.0], [11.5, 43.5], [7.5, 43.5],
      [3.0, 42.0], [0.0, 40.0], [-2.0, 36.5], [-5.5, 36.0], [-9.5, 36.5]
    ],
    // Scandinavian Peninsula
    [
      [5.0, 62.0], [10.0, 63.5], [14.5, 67.5], [24.0, 71.0], [30.0, 70.0],
      [28.0, 65.0], [21.0, 60.0], [17.5, 59.0], [12.5, 56.0], [8.0, 58.0],
      [5.0, 62.0]
    ],
    // Arabian Peninsula
    [
      [35.0, 28.0], [36.5, 22.5], [42.5, 16.0], [45.0, 12.5], [51.0, 15.0],
      [55.0, 17.5], [59.5, 22.5], [56.5, 26.0], [50.5, 26.5], [48.0, 30.0],
      [40.0, 30.0], [35.0, 28.0]
    ]
  ],

  // British Isles
  britain: [
    [
      [-5.5, 50.0], [-3.0, 50.5], [1.5, 51.2], [1.8, 52.5], [0.0, 54.5],
      [-2.0, 57.0], [-4.0, 58.5], [-5.5, 56.0], [-3.5, 54.0], [-5.0, 52.0],
      [-5.5, 50.0]
    ],
    // Ireland
    [
      [-10.0, 51.5], [-8.0, 51.5], [-6.0, 53.0], [-5.5, 55.0], [-8.0, 55.5],
      [-10.5, 54.0], [-10.0, 51.5]
    ]
  ],

  // Japan
  japan: [
    // Honshu & Kyushu
    [
      [130.5, 31.5], [132.0, 33.5], [135.5, 34.0], [139.5, 35.0], [141.0, 38.5],
      [141.5, 41.5], [139.5, 40.5], [136.5, 36.5], [132.5, 35.0], [130.5, 33.5],
      [130.5, 31.5]
    ],
    // Hokkaido
    [
      [140.0, 42.0], [144.0, 43.0], [145.5, 44.0], [142.0, 45.5], [141.0, 43.0],
      [140.0, 42.0]
    ]
  ],

  // Africa
  africa: [
    [
      [-5.5, 36.0], [11.0, 37.0], [11.5, 33.0], [15.0, 32.5], [25.0, 32.0],
      [31.5, 31.5], [32.5, 30.0], [35.0, 27.5], [38.5, 22.0], [43.5, 12.5],
      [51.0, 11.5], [49.0, 8.0], [42.0, -1.0], [39.5, -4.5], [40.5, -10.5],
      [35.5, -24.0], [32.5, -28.0], [28.0, -32.5], [26.0, -34.0], [18.5, -34.5],
      [15.0, -29.0], [12.0, -17.0], [9.0, -1.0], [9.0, 4.5], [4.5, 4.5],
      [-1.0, 5.0], [-7.5, 4.5], [-13.0, 9.0], [-16.5, 12.0], [-17.5, 15.0],
      [-16.0, 21.0], [-13.0, 27.5], [-9.5, 30.5], [-6.0, 35.5], [-5.5, 36.0]
    ],
    // Madagascar
    [
      [49.5, -12.0], [50.5, -15.5], [48.0, -25.0], [44.0, -25.5], [43.5, -20.0],
      [47.0, -14.0], [49.5, -12.0]
    ]
  ],

  // North America
  northAmerica: [
    [
      [-168.0, 66.0], [-162.0, 60.0], [-165.0, 54.5], [-152.0, 58.5], [-140.0, 60.0],
      [-135.0, 57.0], [-128.0, 51.0], [-124.0, 48.0], [-124.5, 40.0], [-120.0, 34.5],
      [-117.0, 32.5], [-114.5, 31.5], [-111.0, 24.5], [-109.0, 23.0], [-105.0, 20.0],
      [-96.0, 16.0], [-92.5, 14.5], [-84.0, 10.0], [-77.5, 8.0], [-80.0, 9.0],
      [-83.5, 15.0], [-87.0, 16.0], [-88.0, 18.5], [-90.5, 21.0], [-97.0, 22.0],
      [-97.5, 26.0], [-94.0, 29.5], [-89.5, 30.0], [-85.0, 29.5], [-81.0, 25.0],
      [-80.0, 26.5], [-81.0, 31.0], [-75.5, 35.0], [-74.0, 40.5], [-70.0, 42.0],
      [-64.0, 45.0], [-60.0, 46.0], [-65.0, 49.0], [-55.5, 51.5], [-60.0, 55.0],
      [-65.0, 60.0], [-78.0, 62.5], [-82.0, 55.0], [-95.0, 57.0], [-95.0, 69.0],
      [-120.0, 71.0], [-140.0, 70.0], [-160.0, 71.0], [-168.0, 66.0]
    ],
    // Greenland
    [
      [-44.0, 60.0], [-35.0, 65.5], [-20.0, 70.0], [-18.0, 77.0], [-25.0, 81.5],
      [-40.0, 83.5], [-60.0, 81.5], [-70.0, 77.0], [-55.0, 70.0], [-50.0, 64.0],
      [-44.0, 60.0]
    ]
  ],

  // South America
  southAmerica: [
    [
      [-77.5, 8.0], [-73.0, 11.5], [-65.0, 10.5], [-60.0, 9.0], [-51.0, 0.0],
      [-44.0, -2.5], [-35.0, -5.5], [-35.0, -9.0], [-38.5, -13.0], [-40.0, -20.0],
      [-43.0, -23.0], [-48.0, -26.0], [-53.0, -33.5], [-57.0, -36.0], [-65.0, -42.0],
      [-66.0, -46.0], [-68.0, -53.0], [-66.0, -55.0], [-74.0, -52.0], [-75.0, -45.0],
      [-73.0, -37.0], [-71.0, -30.0], [-70.0, -18.5], [-76.0, -14.0], [-81.0, -5.0],
      [-80.0, 0.0], [-77.5, 8.0]
    ]
  ],

  // Australia & Oceania
  australia: [
    [
      [114.0, -22.0], [118.0, -20.0], [124.0, -16.0], [130.0, -12.0], [136.0, -12.0],
      [142.0, -10.5], [146.0, -18.0], [153.0, -27.5], [151.0, -34.0], [147.0, -38.5],
      [140.0, -37.5], [136.0, -35.0], [130.0, -31.5], [124.0, -33.5], [115.0, -34.5],
      [113.0, -26.0], [114.0, -22.0]
    ],
    // New Zealand North & South
    [
      [173.0, -35.0], [178.0, -38.0], [175.0, -41.5], [172.0, -40.5], [173.0, -35.0]
    ],
    [
      [172.5, -41.5], [174.0, -43.0], [170.0, -46.0], [166.5, -46.0], [169.0, -43.5],
      [172.5, -41.5]
    ]
  ],

  // Antarctica
  antarctica: [
    [
      [-64.0, -64.0], [-58.0, -70.0], [-30.0, -75.0], [0.0, -70.0], [45.0, -67.0],
      [80.0, -66.0], [120.0, -66.0], [150.0, -68.0], [170.0, -72.0], [165.0, -78.0],
      [-150.0, -80.0], [-120.0, -74.0], [-90.0, -72.0], [-75.0, -73.0], [-64.0, -64.0]
    ]
  ],

  // Major Islands & Archipelagoes
  islands: [
    // Iceland
    [
      [-24.0, 65.0], [-18.0, 66.5], [-13.5, 65.0], [-18.5, 63.5], [-24.0, 65.0]
    ],
    // Cuba
    [
      [-84.5, 21.8], [-80.0, 23.0], [-75.0, 20.0], [-77.0, 19.8], [-84.5, 21.8]
    ],
    // Sri Lanka
    [
      [80.0, 9.5], [81.8, 7.0], [80.5, 6.0], [79.8, 7.5], [80.0, 9.5]
    ],
    // Sumatra & Java (Indonesia)
    [
      [95.5, 5.5], [99.0, 2.0], [105.0, -5.5], [103.0, -4.0], [97.0, 2.0], [95.5, 5.5]
    ],
    [
      [106.0, -6.0], [114.0, -7.5], [114.0, -8.5], [106.0, -7.0], [106.0, -6.0]
    ]
  ]
};

/**
 * National & Geopolitical Borders (Key international boundary segments)
 */
export const BORDER_SEGMENTS: [number, number][][] = [
  // US - Canada (49th Parallel & Great Lakes)
  [[-123.0, 49.0], [-95.0, 49.0], [-89.0, 48.0], [-83.0, 45.0], [-75.0, 45.0], [-67.0, 45.0]],
  // US - Mexico
  [[-117.0, 32.5], [-111.0, 31.3], [-106.5, 31.8], [-104.5, 29.5], [-97.5, 26.0]],
  // France - Spain (Pyrenees)
  [[-1.8, 43.4], [0.5, 42.8], [3.1, 42.4]],
  // France - Germany / Alps
  [[7.5, 49.0], [8.0, 48.0], [7.5, 46.0], [6.8, 44.0]],
  // Germany - Poland / Czech
  [[14.2, 53.9], [14.7, 51.5], [15.0, 50.8], [12.1, 50.3]],
  // Italy border
  [[6.8, 45.8], [9.0, 46.5], [13.7, 46.5]],
  // Iran Borders (Zagros, Caspian, Persian Gulf, East)
  [[44.5, 38.5], [48.0, 38.4], [54.0, 37.3], [61.2, 35.5], [60.8, 29.8], [61.5, 25.0]],
  [[44.5, 38.5], [44.8, 36.5], [45.5, 34.0], [48.0, 31.0], [48.6, 30.0]],
  // India - Pakistan
  [[68.2, 23.8], [71.0, 27.5], [74.5, 32.0], [75.0, 35.5]],
  // China - Central Asia / Russia
  [[75.0, 38.0], [80.0, 44.5], [87.0, 49.0], [116.0, 50.0], [131.0, 45.0], [130.5, 42.5]],
  // Egypt - Libya / Sudan
  [[25.0, 31.5], [25.0, 22.0], [36.0, 22.0]],
  // Brazil Borders
  [[-60.0, 5.0], [-70.0, 0.0], [-70.0, -10.0], [-58.0, -22.0], [-54.0, -33.0]]
];

/**
 * World Metropolitan Night Lights (Precise Longitude & Latitude coordinates)
 */
export const CITY_LIGHTS: { lng: number; lat: number; size: number; intensity: number }[] = [
  // Europe & Mediterranean
  { lng: -0.12, lat: 51.5, size: 5, intensity: 1.0 },   // London
  { lng: 2.35, lat: 48.85, size: 5, intensity: 1.0 },   // Paris
  { lng: 13.4, lat: 52.52, size: 4, intensity: 0.9 },   // Berlin
  { lng: 4.9, lat: 52.37, size: 4, intensity: 0.9 },    // Amsterdam/Randstad
  { lng: -3.7, lat: 40.41, size: 4, intensity: 0.9 },   // Madrid
  { lng: 9.19, lat: 45.46, size: 4, intensity: 0.85 },  // Milan
  { lng: 12.49, lat: 41.9, size: 4, intensity: 0.85 },  // Rome
  { lng: 28.97, lat: 41.0, size: 5, intensity: 0.95 },  // Istanbul
  { lng: 37.61, lat: 55.75, size: 5, intensity: 0.95 }, // Moscow

  // Middle East & Iran
  { lng: 51.38, lat: 35.68, size: 5, intensity: 1.0 },  // Tehran
  { lng: 51.67, lat: 32.65, size: 3.5, intensity: 0.85 }, // Isfahan
  { lng: 52.58, lat: 29.59, size: 3.5, intensity: 0.85 }, // Shiraz
  { lng: 59.60, lat: 36.29, size: 3.5, intensity: 0.85 }, // Mashhad
  { lng: 46.29, lat: 38.08, size: 3.0, intensity: 0.8 },  // Tabriz
  { lng: 55.27, lat: 25.2, size: 5, intensity: 1.0 },   // Dubai
  { lng: 44.36, lat: 33.31, size: 4, intensity: 0.85 }, // Baghdad
  { lng: 46.71, lat: 24.68, size: 4, intensity: 0.9 },  // Riyadh
  { lng: 31.23, lat: 30.04, size: 5, intensity: 1.0 },  // Cairo & Nile Valley
  { lng: 35.21, lat: 31.76, size: 3, intensity: 0.8 },  // Jerusalem / Tel Aviv

  // East & South Asia
  { lng: 139.69, lat: 35.68, size: 6, intensity: 1.0 }, // Tokyo megalopolis
  { lng: 135.5, lat: 34.69, size: 5, intensity: 0.95 }, // Osaka-Kyoto
  { lng: 126.97, lat: 37.56, size: 5, intensity: 1.0 }, // Seoul
  { lng: 121.47, lat: 31.23, size: 6, intensity: 1.0 }, // Shanghai
  { lng: 116.4, lat: 39.9, size: 6, intensity: 1.0 },   // Beijing
  { lng: 113.26, lat: 23.12, size: 6, intensity: 1.0 }, // Pearl River Delta (Guangzhou/Shenzhen/HK)
  { lng: 121.56, lat: 25.03, size: 4, intensity: 0.9 }, // Taipei
  { lng: 103.81, lat: 1.35, size: 4, intensity: 0.95 }, // Singapore
  { lng: 100.5, lat: 13.75, size: 4.5, intensity: 0.9 },// Bangkok
  { lng: 77.2, lat: 28.61, size: 5.5, intensity: 1.0 }, // New Delhi
  { lng: 72.87, lat: 19.07, size: 5.5, intensity: 1.0 },// Mumbai
  { lng: 77.59, lat: 12.97, size: 4.5, intensity: 0.9 },// Bengaluru
  { lng: 67.0, lat: 24.86, size: 4.5, intensity: 0.85 },// Karachi

  // North America
  { lng: -74.0, lat: 40.71, size: 6, intensity: 1.0 },   // New York / BosWash
  { lng: -71.05, lat: 42.36, size: 4.5, intensity: 0.9 },// Boston
  { lng: -77.03, lat: 38.9, size: 4.5, intensity: 0.9 }, // Washington DC
  { lng: -87.62, lat: 41.87, size: 5, intensity: 0.95 }, // Chicago
  { lng: -118.24, lat: 34.05, size: 6, intensity: 1.0 }, // Los Angeles
  { lng: -122.41, lat: 37.77, size: 5, intensity: 0.95 },// San Francisco Bay
  { lng: -95.36, lat: 29.76, size: 4.5, intensity: 0.9 },// Houston
  { lng: -80.19, lat: 25.76, size: 4.5, intensity: 0.9 },// Miami
  { lng: -99.13, lat: 19.43, size: 5.5, intensity: 1.0 },// Mexico City
  { lng: -79.38, lat: 43.65, size: 4.5, intensity: 0.9 },// Toronto

  // South America
  { lng: -46.63, lat: -23.55, size: 5.5, intensity: 1.0 },// São Paulo
  { lng: -43.17, lat: -22.9, size: 5, intensity: 0.95 },  // Rio de Janeiro
  { lng: -58.38, lat: -34.6, size: 5, intensity: 0.95 },  // Buenos Aires
  { lng: -70.66, lat: -33.44, size: 4, intensity: 0.85 }, // Santiago
  { lng: -77.04, lat: -12.04, size: 4, intensity: 0.85 }, // Lima
  { lng: -74.07, lat: 4.71, size: 4, intensity: 0.85 },   // Bogotá

  // Oceania & Africa
  { lng: 151.2, lat: -33.86, size: 5, intensity: 0.95 }, // Sydney
  { lng: 144.96, lat: -37.81, size: 4.5, intensity: 0.9 }, // Melbourne
  { lng: 28.04, lat: -26.2, size: 4.5, intensity: 0.9 }, // Johannesburg
  { lng: 18.42, lat: -33.92, size: 3.5, intensity: 0.8 }, // Cape Town
  { lng: 3.37, lat: 6.52, size: 5, intensity: 0.9 }       // Lagos
];

export type MapStyle = 'satellite' | 'dark' | 'minimalist' | 'antique';

export interface EarthTextureOptions {
  style?: MapStyle;
  showBorders?: boolean;
  showNightLights?: boolean;
  showGraticule?: boolean;
}

/**
 * Builds high-resolution (4096x2048) multi-layer Earth Color Map with style support
 */
export function generatePrecisionEarthColorMap(options: EarthTextureOptions = {}): THREE.CanvasTexture {
  const {
    style = 'dark',
    showBorders = true,
    showNightLights = true,
    showGraticule = true,
  } = options;

  const width = 4096;
  const height = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Multi-tone Oceanic Bathymetry based on MapStyle
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  if (style === 'satellite') {
    oceanGrad.addColorStop(0.0, '#021024'); // Arctic deep
    oceanGrad.addColorStop(0.25, '#05234a');
    oceanGrad.addColorStop(0.5, '#0a3a78'); // Equatorial tropical deep blue
    oceanGrad.addColorStop(0.75, '#05234a');
    oceanGrad.addColorStop(1.0, '#021024'); // Antarctic
  } else if (style === 'minimalist') {
    oceanGrad.addColorStop(0.0, '#020306');
    oceanGrad.addColorStop(0.5, '#060911');
    oceanGrad.addColorStop(1.0, '#020306');
  } else if (style === 'antique') {
    oceanGrad.addColorStop(0.0, '#140f0a');
    oceanGrad.addColorStop(0.5, '#221a12');
    oceanGrad.addColorStop(1.0, '#140f0a');
  } else {
    // Default 'dark'
    oceanGrad.addColorStop(0.0, '#020612'); // Arctic abyss
    oceanGrad.addColorStop(0.2, '#040d21');
    oceanGrad.addColorStop(0.5, '#071633'); // Mid-Atlantic / Pacific deep blue
    oceanGrad.addColorStop(0.8, '#040d21');
    oceanGrad.addColorStop(1.0, '#020612'); // Antarctic
  }
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Helper function to trace polygons
  const tracePolygon = (poly: Polygon) => {
    if (poly.length < 2) return;
    const [startX, startY] = lngLatToCanvas(poly[0][0], poly[0][1], width, height);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    for (let i = 1; i < poly.length; i++) {
      const [px, py] = lngLatToCanvas(poly[i][0], poly[i][1], width, height);
      ctx.lineTo(px, py);
    }
    ctx.closePath();
  };

  // 2. Coastal Continental Shelf Glow
  if (style === 'satellite') {
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.45)'; // Tropical turquoise shelf
  } else if (style === 'minimalist') {
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)'; // Muted silver
  } else if (style === 'antique') {
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.35)'; // Copper amber
  } else {
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.45)'; // Electric cyan
  }
  ctx.lineWidth = 14;
  ctx.lineJoin = 'round';
  ctx.filter = 'blur(6px)';

  Object.values(CONTINENTS_GEO).forEach((groups) => {
    groups.forEach((poly) => {
      tracePolygon(poly);
      ctx.stroke();
    });
  });
  ctx.filter = 'none';

  // 3. Landmass Interior Fill with Biome Topography
  Object.entries(CONTINENTS_GEO).forEach(([continent, groups]) => {
    groups.forEach((poly) => {
      tracePolygon(poly);

      const isPolar = continent === 'antarctica' || (continent === 'northAmerica' && poly[0][1] > 65);

      if (style === 'satellite') {
        ctx.fillStyle = isPolar ? '#f1f5f9' : '#1d3822'; // Lush emerald/woodland
        ctx.fill();
        ctx.strokeStyle = isPolar ? '#94a3b8' : '#2dd4bf';
        ctx.lineWidth = 2.0;
        ctx.stroke();
      } else if (style === 'minimalist') {
        ctx.fillStyle = isPolar ? '#1e293b' : '#0e131d'; // Stealth charcoal
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      } else if (style === 'antique') {
        ctx.fillStyle = isPolar ? '#d6c8b4' : '#33271c'; // Aged sepia parchment
        ctx.fill();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 2.0;
        ctx.stroke();
      } else {
        // Dark Mode
        ctx.fillStyle = isPolar ? '#cbd5e1' : '#0f172a';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
    });
  });

  // 4. Biome Shading (Deserts & Rainforests)
  if (style === 'satellite') {
    // Sahara & Arabian Golden Sands
    const desertGrad = ctx.createRadialGradient(
      ...lngLatToCanvas(25, 22, width, height), 20,
      ...lngLatToCanvas(25, 22, width, height), 440
    );
    desertGrad.addColorStop(0, 'rgba(194, 150, 75, 0.7)');
    desertGrad.addColorStop(0.7, 'rgba(145, 110, 50, 0.45)');
    desertGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = desertGrad;
    ctx.fillRect(0, 0, width, height);

    // Australian Outback
    const outbackGrad = ctx.createRadialGradient(
      ...lngLatToCanvas(132, -24, width, height), 10,
      ...lngLatToCanvas(132, -24, width, height), 280
    );
    outbackGrad.addColorStop(0, 'rgba(180, 80, 35, 0.65)');
    outbackGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = outbackGrad;
    ctx.fillRect(0, 0, width, height);
  } else if (style === 'dark') {
    const desertGrad = ctx.createRadialGradient(
      ...lngLatToCanvas(25, 22, width, height), 20,
      ...lngLatToCanvas(25, 22, width, height), 420
    );
    desertGrad.addColorStop(0, 'rgba(180, 130, 60, 0.45)');
    desertGrad.addColorStop(0.7, 'rgba(120, 90, 45, 0.25)');
    desertGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = desertGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // 5. National International Borders
  if (showBorders) {
    if (style === 'satellite') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    } else if (style === 'minimalist') {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
    } else if (style === 'antique') {
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.75)';
    } else {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
    }
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);

    BORDER_SEGMENTS.forEach((segment) => {
      if (segment.length < 2) return;
      const [sx, sy] = lngLatToCanvas(segment[0][0], segment[0][1], width, height);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      for (let i = 1; i < segment.length; i++) {
        const [px, py] = lngLatToCanvas(segment[i][0], segment[i][1], width, height);
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    });
    ctx.setLineDash([]); // Reset
  }

  // 6. Graticule (Latitude / Longitude Meridians)
  if (showGraticule) {
    if (style === 'satellite') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
    } else if (style === 'minimalist') {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    } else if (style === 'antique') {
      ctx.strokeStyle = 'rgba(180, 83, 9, 0.2)';
    } else {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    }
    ctx.lineWidth = 1;

    // Parallels (every 15 degrees)
    for (let lat = -75; lat <= 75; lat += 15) {
      const [, y] = lngLatToCanvas(0, lat, width, height);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Meridians (every 15 degrees)
    for (let lng = -180; lng <= 180; lng += 15) {
      const [x] = lngLatToCanvas(lng, 0, width, height);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Equator Golden Highlight (0°)
    const [, eqY] = lngLatToCanvas(0, 0, width, height);
    ctx.strokeStyle = style === 'antique' ? 'rgba(217, 119, 6, 0.6)' : 'rgba(251, 191, 36, 0.5)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, eqY);
    ctx.lineTo(width, eqY);
    ctx.stroke();

    // Prime Meridian Highlight (0° Greenwhich)
    const [pmX] = lngLatToCanvas(0, 0, width, height);
    ctx.strokeStyle = style === 'satellite' ? 'rgba(255, 255, 255, 0.35)' : 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(pmX, 0);
    ctx.lineTo(pmX, height);
    ctx.stroke();
  }

  // 7. City Lights & Metropolitan Night Luminescence
  if (showNightLights) {
    CITY_LIGHTS.forEach((c) => {
      const [cx, cy] = lngLatToCanvas(c.lng, c.lat, width, height);
      const rad = c.size * 3.5;

      const lightGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      if (style === 'minimalist') {
        lightGrad.addColorStop(0, `rgba(241, 245, 249, ${c.intensity * 0.9})`);
        lightGrad.addColorStop(0.4, `rgba(203, 213, 225, ${c.intensity * 0.5})`);
        lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (style === 'antique') {
        lightGrad.addColorStop(0, `rgba(253, 224, 71, ${c.intensity * 0.95})`);
        lightGrad.addColorStop(0.3, `rgba(245, 158, 11, ${c.intensity * 0.7})`);
        lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        lightGrad.addColorStop(0, `rgba(254, 240, 138, ${c.intensity * 0.95})`);
        lightGrad.addColorStop(0.3, `rgba(251, 191, 36, ${c.intensity * 0.7})`);
        lightGrad.addColorStop(0.7, `rgba(245, 158, 11, ${c.intensity * 0.3})`);
        lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    });

    // Secondary scattered micro-lights
    ctx.fillStyle = 'rgba(253, 230, 138, 0.55)';
    for (let i = 0; i < 600; i++) {
      const rx = Math.random() * width;
      const ry = (0.2 + Math.random() * 0.6) * height;
      ctx.fillRect(rx, ry, 1.5, 1.5);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Builds 3D Topographic Bump / Elevation Heightmap (2048x1024)
 * Gives genuine depth to mountain ranges (Himalayas, Zagros, Alps, Andes, Rockies).
 */
export function generatePrecisionBumpMap(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Neutral ocean floor (dark gray)
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, width, height);

  // Continental plateaus (medium gray #555)
  ctx.fillStyle = '#3a3a3a';
  Object.values(CONTINENTS_GEO).forEach((groups) => {
    groups.forEach((poly) => {
      if (poly.length < 2) return;
      const [sx, sy] = lngLatToCanvas(poly[0][0], poly[0][1], width, height);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      for (let i = 1; i < poly.length; i++) {
        const [px, py] = lngLatToCanvas(poly[i][0], poly[i][1], width, height);
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    });
  });

  // Major Mountain Ridges (Himalayas, Andes, Zagros, Alps, Rockies)
  const drawRidge = (points: [number, number][], blurRadius: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.filter = `blur(${blurRadius}px)`;
    ctx.beginPath();
    const [sx, sy] = lngLatToCanvas(points[0][0], points[0][1], width, height);
    ctx.moveTo(sx, sy);
    for (let i = 1; i < points.length; i++) {
      const [px, py] = lngLatToCanvas(points[i][0], points[i][1], width, height);
      ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.filter = 'none';
  };

  // Himalayas & Tibetan Plateau (highest elevation)
  drawRidge([[75, 35], [85, 30], [95, 29]], 8, '#ffffff');
  drawRidge([[80, 32], [90, 31], [98, 28]], 4, '#e0e0e0');

  // Zagros & Alborz (Iran)
  drawRidge([[45, 38], [48, 35], [52, 30], [56, 27]], 6, '#b0b0b0');
  drawRidge([[49, 36], [54, 36], [58, 37]], 5, '#a0a0a0');

  // European Alps
  drawRidge([[6, 45], [10, 46.5], [14, 46.5]], 5, '#a0a0a0');

  // Andes (South America)
  drawRidge([[-77, 5], [-76, -10], [-70, -25], [-68, -45]], 7, '#c0c0c0');

  // Rocky Mountains (North America)
  drawRidge([[-120, 55], [-115, 45], [-106, 35]], 7, '#b0b0b0');

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Builds Ocean Specular / Roughness Map (2048x1024)
 * Land = matte (light), Ocean = reflective (black)
 */
export function generatePrecisionRoughnessMap(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Oceans are shiny / low roughness (deep black)
  ctx.fillStyle = '#101010';
  ctx.fillRect(0, 0, width, height);

  // Land is matte / high roughness (light gray)
  ctx.fillStyle = '#d5d5d5';
  Object.values(CONTINENTS_GEO).forEach((groups) => {
    groups.forEach((poly) => {
      if (poly.length < 2) return;
      const [sx, sy] = lngLatToCanvas(poly[0][0], poly[0][1], width, height);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      for (let i = 1; i < poly.length; i++) {
        const [px, py] = lngLatToCanvas(poly[i][0], poly[i][1], width, height);
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    });
  });

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
