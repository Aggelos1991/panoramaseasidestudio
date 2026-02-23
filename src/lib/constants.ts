export const AMENITY_ICONS: Record<string, string> = {
  wifi: "Wifi",
  ac: "AirVent",
  kitchen: "CookingPot",
  tv: "Tv",
  parking: "Car",
  balcony: "Sun",
  sea_view: "Compass",
  safe: "Lock",
  hairdryer: "Wind",
  towels: "Bath",
  cleaning: "SprayCan",
  fridge: "Refrigerator",
  coffee: "Coffee",
  beach: "Waves",
  restaurant: "UtensilsCrossed",
  bar: "Wine",
  playground: "Baby",
  kettle: "Cup",
  massage: "Hand",
  billiards: "CircleDot",
};

export const AMENITY_LABELS: Record<string, Record<string, string>> = {
  wifi: { en: "Free Wi-Fi", el: "Δωρεάν Wi-Fi", de: "Kostenloses WLAN" },
  ac: { en: "Air Conditioning", el: "Κλιματισμός", de: "Klimaanlage" },
  kitchen: { en: "Kitchenette", el: "Μικρή Κουζίνα", de: "Küchenzeile" },
  tv: { en: "Flat Screen TV", el: "Τηλεόραση", de: "Flachbildfernseher" },
  parking: { en: "Free Parking", el: "Δωρεάν Πάρκινγκ", de: "Kostenlose Parkplätze" },
  balcony: { en: "Private Balcony", el: "Ιδιωτικό Μπαλκόνι", de: "Privater Balkon" },
  sea_view: { en: "Sea View", el: "Θέα Θάλασσα", de: "Meerblick" },
  safe: { en: "In-Room Safe", el: "Χρηματοκιβώτιο", de: "Zimmersafe" },
  hairdryer: { en: "Hair Dryer", el: "Πιστολάκι", de: "Haartrockner" },
  towels: { en: "Fresh Towels", el: "Πετσέτες", de: "Frische Handtücher" },
  cleaning: { en: "Daily Cleaning", el: "Καθημερινός Καθαρισμός", de: "Tägliche Reinigung" },
  fridge: { en: "Mini Fridge", el: "Μίνι Ψυγείο", de: "Minikühlschrank" },
  coffee: { en: "Coffee & Tea", el: "Καφές & Τσάι", de: "Kaffee & Tee" },
  beach: { en: "Beach Access", el: "Πρόσβαση Παραλίας", de: "Strandzugang" },
  restaurant: { en: "Restaurant", el: "Εστιατόριο", de: "Restaurant" },
  bar: { en: "Bar & Snack Bar", el: "Μπαρ", de: "Bar & Snackbar" },
  playground: { en: "Playground", el: "Παιδική Χαρά", de: "Spielplatz" },
  kettle: { en: "Electric Kettle", el: "Βραστήρας", de: "Wasserkocher" },
  massage: { en: "Massage", el: "Μασάζ", de: "Massage" },
  billiards: { en: "Billiards", el: "Μπιλιάρδο", de: "Billard" },
};

// Real photos from Panorama Seaside, Mastichari, Kos
const PHOTO_BASE = "https://panoramastudiosmastichari.hotelskosisland.com/data/Photos/OriginalPhoto";

export const HOTEL_IMAGES = {
  hero: [
    "https://images.unsplash.com/photo-1666116671379-6a50c3edbdb9?w=1920&h=1080&fit=crop&crop=entropy&cs=srgb&fm=jpg&q=80",
    `${PHOTO_BASE}/16795/1679569/1679569158.JPEG`,
  ],
  rooms: {
    "deluxe-double": `${PHOTO_BASE}/16795/1679569/1679569240.JPEG`,
    "luxury-studio-land-view": `${PHOTO_BASE}/16795/1679569/1679569274.JPEG`,
    "seafront-luxury-studio": `${PHOTO_BASE}/16795/1679569/1679569263.JPEG`,
    "superior-double-sea-view": `${PHOTO_BASE}/16795/1679569/1679569275.JPEG`,
    "double-room-balcony": `${PHOTO_BASE}/16795/1679569/1679569277.JPEG`,
  },
  gallery: [
    `${PHOTO_BASE}/16795/1679569/1679569158.JPEG`,
    `${PHOTO_BASE}/16795/1679569/1679569274.JPEG`,
    `${PHOTO_BASE}/16795/1679569/1679569240.JPEG`,
    `${PHOTO_BASE}/16795/1679569/1679569263.JPEG`,
    `${PHOTO_BASE}/16795/1679569/1679569275.JPEG`,
    `${PHOTO_BASE}/16795/1679569/1679569277.JPEG`,
    `${PHOTO_BASE}/16795/1679569/1679569159.JPEG`,
  ],
  beach: `${PHOTO_BASE}/16795/1679569/1679569240.JPEG`,
  about: `${PHOTO_BASE}/16795/1679569/1679569159.JPEG`,
};

// Keep backward compat alias
export const PLACEHOLDER_IMAGES = {
  hero: HOTEL_IMAGES.hero,
  rooms: HOTEL_IMAGES.rooms as Record<string, string>,
  gallery: HOTEL_IMAGES.gallery,
  pool: HOTEL_IMAGES.beach,
  about: HOTEL_IMAGES.about,
};

// The 5 real room types matching Booking.com listing
export type FallbackRoom = {
  slug: string;
  nameEn: string;
  nameEl: string;
  nameDe: string;
  capacity: number;
  sizeSqm: number;
  bedType: string;
  basePrice: number;
  totalUnits: number;
  amenities: string[];
  primaryImage: string;
};

export const FALLBACK_ROOMS: FallbackRoom[] = [
  {
    slug: "deluxe-double",
    nameEn: "Deluxe Double Room",
    nameEl: "Deluxe Δίκλινο Δωμάτιο",
    nameDe: "Deluxe Doppelzimmer",
    capacity: 2,
    sizeSqm: 25,
    bedType: "1 Double Bed or 2 Single Beds",
    basePrice: 65,
    totalUnits: 2,
    amenities: ["wifi", "ac", "tv", "balcony", "fridge", "hairdryer", "towels", "cleaning", "safe"],
    primaryImage: HOTEL_IMAGES.rooms["deluxe-double"],
  },
  {
    slug: "luxury-studio-land-view",
    nameEn: "Luxury Studio Land View",
    nameEl: "Luxury Studio Land View",
    nameDe: "Luxus-Studio Landblick",
    capacity: 2,
    sizeSqm: 28,
    bedType: "2 Single Beds + 1 Sofa Bed",
    basePrice: 55,
    totalUnits: 2,
    amenities: ["wifi", "ac", "kitchen", "tv", "balcony", "fridge", "kettle", "hairdryer", "towels", "cleaning"],
    primaryImage: HOTEL_IMAGES.rooms["luxury-studio-land-view"],
  },
  {
    slug: "seafront-luxury-studio",
    nameEn: "Seafront Luxury Studio",
    nameEl: "Seafront Luxury Studio",
    nameDe: "Luxus-Studio am Meer",
    capacity: 2,
    sizeSqm: 28,
    bedType: "2 Single Beds + 1 Sofa Bed",
    basePrice: 70,
    totalUnits: 2,
    amenities: ["wifi", "ac", "kitchen", "tv", "balcony", "sea_view", "beach", "fridge", "kettle", "hairdryer", "towels", "cleaning"],
    primaryImage: HOTEL_IMAGES.rooms["seafront-luxury-studio"],
  },
  {
    slug: "superior-double-sea-view",
    nameEn: "Superior Double Room with Sea View",
    nameEl: "Superior Δίκλινο με Θέα Θάλασσα",
    nameDe: "Superior Doppelzimmer mit Meerblick",
    capacity: 2,
    sizeSqm: 22,
    bedType: "2 Single Beds",
    basePrice: 60,
    totalUnits: 2,
    amenities: ["wifi", "ac", "tv", "balcony", "sea_view", "fridge", "hairdryer", "towels", "cleaning"],
    primaryImage: HOTEL_IMAGES.rooms["superior-double-sea-view"],
  },
  {
    slug: "double-room-balcony",
    nameEn: "Double Room with Balcony",
    nameEl: "Δίκλινο Δωμάτιο με Μπαλκόνι",
    nameDe: "Doppelzimmer mit Balkon",
    capacity: 2,
    sizeSqm: 20,
    bedType: "1 Double Bed",
    basePrice: 50,
    totalUnits: 1,
    amenities: ["wifi", "ac", "tv", "balcony", "fridge", "hairdryer", "towels", "cleaning"],
    primaryImage: HOTEL_IMAGES.rooms["double-room-balcony"],
  },
];

// Hotel metadata
export const HOTEL_INFO = {
  name: "Panorama Seaside Studios",
  nameFull: "Panorama Seaside Studios & Apartments",
  location: "Mastichari, Kos Island, Greece",
  address: "Main Street, Mastichari, 85-302, Kos, Greece",
  coordinates: { lat: 36.84941, lng: 27.075555 },
  phone: "+30 6942946533",
  email: "info@panoramaseasidekos.com",
  rating: 8.9,
  reviewCount: 214,
  checkIn: "14:00",
  checkOut: "12:00",
  licence: "1143K113K0567201",
};
