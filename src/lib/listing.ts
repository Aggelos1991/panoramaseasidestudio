import { HOTEL_IMAGES } from "@/lib/constants";

/**
 * Apartments and facilities taken from the Panorama Seaside listing on Booking.com.
 * Used when the database has no rooms, and as the reference for the public catalogue.
 */
export type ListingRoom = {
  slug: string;
  nameEn: string;
  nameEl: string;
  nameDe: string;
  descEn: string;
  descEl: string;
  descDe: string;
  capacity: number;
  bedType: string;
  sizeSqm: number;
  basePrice: number;
  amenities: string[];
  image: string;
};

const ROOM_KIT = ["wifi", "ac", "tv", "balcony", "fridge", "kettle", "coffee", "safe", "hairdryer", "towels"];

export const LISTING_ROOMS: ListingRoom[] = [
  {
    slug: "deluxe-double",
    nameEn: "Deluxe Double Room",
    nameEl: "Deluxe δίκλινο",
    nameDe: "Deluxe-Doppelzimmer",
    descEn:
      "20 m² room with a king bed or two singles, a sea view, and a private balcony and entrance. Air conditioning, flat-screen TV, fridge, kettle, coffee maker, safe, and shower. Upper floor, reached by stairs. No kitchenette.",
    descEl:
      "Δωμάτιο 20 m² με king size ή δύο μονά κρεβάτια, θέα θάλασσα, ιδιωτικό μπαλκόνι και είσοδο. Κλιματισμός, τηλεόραση, ψυγείο, βραστήρας, καφετιέρα, χρηματοκιβώτιο και ντους. Όροφος, με σκάλα. Χωρίς κουζινάκι.",
    descDe:
      "20 m² mit Kingsize-Bett oder zwei Einzelbetten, Meerblick, privatem Balkon und eigenem Eingang. Klimaanlage, Flachbildfernseher, Kühlschrank, Wasserkocher, Kaffeemaschine, Safe und Dusche. Obere Etage, nur über Treppe. Keine Küchenzeile.",
    capacity: 2,
    bedType: "1 king bed or 2 single beds",
    sizeSqm: 20,
    basePrice: 65,
    amenities: [...ROOM_KIT, "sea_view"],
    image: HOTEL_IMAGES.rooms["deluxe-double"],
  },
  {
    slug: "luxury-studio-land-view",
    nameEn: "Luxury Studio Land View",
    nameEl: "Luxury Studio με θέα στον κήπο",
    nameDe: "Luxus-Studio mit Landblick",
    descEn:
      "20 m² ground-floor studio with two single beds and a sofa bed. Kitchenette with fridge, kettle, coffee maker, and kitchenware. Village view from the balcony. Air conditioning, TV, safe, and shower. Booking.com notes that the ground-floor studios are being renovated.",
    descEl:
      "Στούντιο 20 m² στο ισόγειο, με δύο μονά κρεβάτια και καναπέ-κρεβάτι. Κουζινάκι με ψυγείο, βραστήρα, καφετιέρα και σκεύη. Θέα στο χωριό από το μπαλκόνι. Κλιματισμός, τηλεόραση, χρηματοκιβώτιο και ντους. Στο Booking.com αναφέρεται ότι τα στούντιο του ισογείου ανακαινίζονται.",
    descDe:
      "20 m² Studio im Erdgeschoss mit zwei Einzelbetten und einem Schlafsofa. Küchenzeile mit Kühlschrank, Wasserkocher, Kaffeemaschine und Geschirr. Blick aufs Dorf vom Balkon. Klimaanlage, Fernseher, Safe und Dusche. Auf Booking.com steht, dass die Studios im Erdgeschoss renoviert werden.",
    capacity: 2,
    bedType: "2 single beds and 1 sofa bed",
    sizeSqm: 20,
    basePrice: 55,
    amenities: [...ROOM_KIT, "kitchen", "city_view"],
    image: HOTEL_IMAGES.rooms["luxury-studio-land-view"],
  },
  {
    slug: "seafront-luxury-studio",
    nameEn: "Seafront Luxury Studio",
    nameEl: "Seafront Luxury Studio",
    nameDe: "Luxus-Studio am Meer",
    descEn:
      "20 m² ground-floor studio on the seafront, with two single beds and a sofa bed. Kitchenette with fridge, kettle, coffee maker, and kitchenware. Sea view from the balcony. Air conditioning, TV, safe, and shower. Booking.com notes that the ground-floor studios are being renovated.",
    descEl:
      "Στούντιο 20 m² στο ισόγειο, μπροστά στη θάλασσα, με δύο μονά κρεβάτια και καναπέ-κρεβάτι. Κουζινάκι με ψυγείο, βραστήρα, καφετιέρα και σκεύη. Θέα θάλασσα από το μπαλκόνι. Κλιματισμός, τηλεόραση, χρηματοκιβώτιο και ντους. Στο Booking.com αναφέρεται ότι τα στούντιο του ισογείου ανακαινίζονται.",
    descDe:
      "20 m² Studio im Erdgeschoss direkt am Meer, mit zwei Einzelbetten und einem Schlafsofa. Küchenzeile mit Kühlschrank, Wasserkocher, Kaffeemaschine und Geschirr. Meerblick vom Balkon. Klimaanlage, Fernseher, Safe und Dusche. Auf Booking.com steht, dass die Studios im Erdgeschoss renoviert werden.",
    capacity: 2,
    bedType: "2 single beds and 1 sofa bed",
    sizeSqm: 20,
    basePrice: 70,
    amenities: [...ROOM_KIT, "kitchen", "sea_view", "beach"],
    image: HOTEL_IMAGES.rooms["seafront-luxury-studio"],
  },
  {
    slug: "superior-double-sea-view",
    nameEn: "Superior Twin Room with Sea View",
    nameEl: "Superior δίκλινο με θέα θάλασσα",
    nameDe: "Superior-Zweibettzimmer mit Meerblick",
    descEn:
      "20 m² twin room with two single beds, a sea view, and a private balcony and entrance. Air conditioning, flat-screen TV, fridge, kettle, coffee maker, safe, and shower. Upper floor, reached by stairs. No kitchenette.",
    descEl:
      "Δίκλινο 20 m² με δύο μονά κρεβάτια, θέα θάλασσα, ιδιωτικό μπαλκόνι και είσοδο. Κλιματισμός, τηλεόραση, ψυγείο, βραστήρας, καφετιέρα, χρηματοκιβώτιο και ντους. Όροφος, με σκάλα. Χωρίς κουζινάκι.",
    descDe:
      "20 m² Zweibettzimmer mit zwei Einzelbetten, Meerblick, privatem Balkon und eigenem Eingang. Klimaanlage, Flachbildfernseher, Kühlschrank, Wasserkocher, Kaffeemaschine, Safe und Dusche. Obere Etage, nur über Treppe. Keine Küchenzeile.",
    capacity: 2,
    bedType: "2 single beds",
    sizeSqm: 20,
    basePrice: 60,
    amenities: [...ROOM_KIT, "sea_view"],
    image: HOTEL_IMAGES.rooms["superior-double-sea-view"],
  },
  {
    slug: "double-room-balcony",
    nameEn: "Double Room with Balcony",
    nameEl: "Δίκλινο με μπαλκόνι",
    nameDe: "Doppelzimmer mit Balkon",
    descEn:
      "20 m² room with one king bed, a village view, and a private balcony and entrance. Air conditioning, flat-screen TV, fridge, kettle, coffee maker, safe, and shower. Upper floor, reached by stairs. No kitchenette.",
    descEl:
      "Δωμάτιο 20 m² με ένα king size κρεβάτι, θέα στο χωριό, ιδιωτικό μπαλκόνι και είσοδο. Κλιματισμός, τηλεόραση, ψυγείο, βραστήρας, καφετιέρα, χρηματοκιβώτιο και ντους. Όροφος, με σκάλα. Χωρίς κουζινάκι.",
    descDe:
      "20 m² mit einem Kingsize-Bett, Blick aufs Dorf, privatem Balkon und eigenem Eingang. Klimaanlage, Flachbildfernseher, Kühlschrank, Wasserkocher, Kaffeemaschine, Safe und Dusche. Obere Etage, nur über Treppe. Keine Küchenzeile.",
    capacity: 2,
    bedType: "1 king bed",
    sizeSqm: 20,
    basePrice: 50,
    amenities: [...ROOM_KIT, "city_view"],
    image: HOTEL_IMAGES.rooms["double-room-balcony"],
  },
];

export function listingRoomBySlug(slug: string) {
  return LISTING_ROOMS.find((room) => room.slug === slug) ?? null;
}
