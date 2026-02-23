import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const PHOTO_BASE =
  "https://panoramastudiosmastichari.hotelskosisland.com/data/Photos/OriginalPhoto";

async function main() {
  // Create admin user
  const adminPassword = await hash("admin123", 12);
  await prisma.adminUser.upsert({
    where: { email: "admin@panoramaseasidekos.com" },
    update: {},
    create: {
      email: "admin@panoramaseasidekos.com",
      password: adminPassword,
      name: "Admin",
    },
  });

  // Real rooms based on Panorama Seaside Studios Booking.com listing
  const rooms = [
    {
      slug: "deluxe-double",
      nameEn: "Deluxe Double Room",
      nameEl: "Deluxe Δίκλινο Δωμάτιο",
      nameDe: "Deluxe Doppelzimmer",
      descEn:
        "A beautifully appointed deluxe room with the choice of a large double bed or two comfortable single beds. Features air conditioning, flat-screen TV, in-room safe, mini fridge, and a private balcony. Perfect for couples or friends looking for a refined stay steps from the beach.",
      descEl:
        "Ένα πανέμορφα διαμορφωμένο deluxe δωμάτιο με επιλογή μεγάλου διπλού κρεβατιού ή δύο μονών κρεβατιών. Διαθέτει κλιματισμό, τηλεόραση επίπεδης οθόνης, χρηματοκιβώτιο, μίνι ψυγείο και ιδιωτικό μπαλκόνι.",
      descDe:
        "Ein wunderschön eingerichtetes Deluxe-Zimmer mit Wahl zwischen einem großen Doppelbett oder zwei Einzelbetten. Mit Klimaanlage, Flachbildfernseher, Zimmersafe, Minikühlschrank und privatem Balkon.",
      capacity: 2,
      bedType: "1 Double Bed or 2 Single Beds",
      sizeSqm: 25,
      basePrice: 65,
      totalUnits: 2,
      amenities: [
        "wifi", "ac", "tv", "balcony", "fridge", "hairdryer", "towels", "cleaning", "safe",
      ],
      sortOrder: 1,
      images: [
        {
          url: `${PHOTO_BASE}/16795/1679569/1679569240.JPEG`,
          alt: "Deluxe Double Room",
          isPrimary: true,
          sortOrder: 0,
        },
        {
          url: `${PHOTO_BASE}/17227/1722776/1722776946.JPEG`,
          alt: "Deluxe Double Room - interior",
          isPrimary: false,
          sortOrder: 1,
        },
      ],
    },
    {
      slug: "luxury-studio-land-view",
      nameEn: "Luxury Studio Land View",
      nameEl: "Luxury Studio Land View",
      nameDe: "Luxus-Studio Landblick",
      descEn:
        "A spacious open-plan studio with peaceful garden and land views. Equipped with two single beds and a sofa bed, a fully equipped kitchenette with fridge, electric hobs and kettle, flat-screen TV, air conditioning, and a furnished balcony overlooking the tranquil gardens.",
      descEl:
        "Ένα ευρύχωρο στούντιο ανοιχτού τύπου με ήρεμη θέα στον κήπο. Εξοπλισμένο με δύο μονά κρεβάτια και έναν καναπέ-κρεβάτι, πλήρως εξοπλισμένη κουζίνα με ψυγείο, ηλεκτρικές εστίες και βραστήρα, τηλεόραση, κλιματισμό και επιπλωμένο μπαλκόνι.",
      descDe:
        "Ein geräumiges Studio mit offenem Grundriss und ruhigem Garten- und Landblick. Ausgestattet mit zwei Einzelbetten und einem Schlafsofa, voll ausgestatteter Küchenzeile mit Kühlschrank, Herdplatten und Wasserkocher, Flachbildfernseher, Klimaanlage und möbliertem Balkon.",
      capacity: 2,
      bedType: "2 Single Beds + 1 Sofa Bed",
      sizeSqm: 28,
      basePrice: 55,
      totalUnits: 2,
      amenities: [
        "wifi", "ac", "kitchen", "tv", "balcony", "fridge", "kettle", "hairdryer", "towels", "cleaning",
      ],
      sortOrder: 2,
      images: [
        {
          url: `${PHOTO_BASE}/16795/1679569/1679569274.JPEG`,
          alt: "Luxury Studio Land View",
          isPrimary: true,
          sortOrder: 0,
        },
        {
          url: `${PHOTO_BASE}/17227/1722776/1722776664.JPEG`,
          alt: "Luxury Studio Land View - interior",
          isPrimary: false,
          sortOrder: 1,
        },
      ],
    },
    {
      slug: "seafront-luxury-studio",
      nameEn: "Seafront Luxury Studio",
      nameEl: "Seafront Luxury Studio",
      nameDe: "Luxus-Studio am Meer",
      descEn:
        "A premium open-plan studio right on the seafront with stunning Aegean views. Features two single beds and a sofa bed, a fully equipped kitchenette with fridge, electric hobs and kettle, flat-screen TV, air conditioning, and a furnished balcony with direct sea views and beach access.",
      descEl:
        "Ένα premium στούντιο ανοιχτού τύπου ακριβώς μπροστά στη θάλασσα με εκπληκτική θέα στο Αιγαίο. Διαθέτει δύο μονά κρεβάτια και καναπέ-κρεβάτι, πλήρως εξοπλισμένη κουζίνα, τηλεόραση, κλιματισμό και μπαλκόνι με θέα στη θάλασσα.",
      descDe:
        "Ein Premium-Studio mit offenem Grundriss direkt am Meer mit atemberaubendem Blick auf die Ägäis. Mit zwei Einzelbetten und einem Schlafsofa, voll ausgestatteter Küchenzeile, Flachbildfernseher, Klimaanlage und möbliertem Balkon mit direktem Meerblick.",
      capacity: 2,
      bedType: "2 Single Beds + 1 Sofa Bed",
      sizeSqm: 28,
      basePrice: 70,
      totalUnits: 2,
      amenities: [
        "wifi", "ac", "kitchen", "tv", "balcony", "sea_view", "beach", "fridge", "kettle", "hairdryer", "towels", "cleaning",
      ],
      sortOrder: 3,
      images: [
        {
          url: `${PHOTO_BASE}/16795/1679569/1679569263.JPEG`,
          alt: "Seafront Luxury Studio",
          isPrimary: true,
          sortOrder: 0,
        },
        {
          url: `${PHOTO_BASE}/16795/1679569/1679569275.JPEG`,
          alt: "Seafront Luxury Studio - view",
          isPrimary: false,
          sortOrder: 1,
        },
      ],
    },
    {
      slug: "superior-double-sea-view",
      nameEn: "Superior Double Room with Sea View",
      nameEl: "Superior Δίκλινο με Θέα Θάλασσα",
      nameDe: "Superior Doppelzimmer mit Meerblick",
      descEn:
        "A comfortable superior room with two single beds and beautiful sea views from your private balcony. Equipped with air conditioning, flat-screen TV, mini fridge, and a private bathroom with shower. Ideal for guests who want to wake up to the sound of waves.",
      descEl:
        "Ένα άνετο ανώτερο δωμάτιο με δύο μονά κρεβάτια και πανέμορφη θέα θάλασσα από το ιδιωτικό σας μπαλκόνι. Εξοπλισμένο με κλιματισμό, τηλεόραση, μίνι ψυγείο και ιδιωτικό μπάνιο με ντους.",
      descDe:
        "Ein komfortables Superior-Zimmer mit zwei Einzelbetten und schönem Meerblick vom privaten Balkon. Ausgestattet mit Klimaanlage, Flachbildfernseher, Minikühlschrank und eigenem Bad mit Dusche.",
      capacity: 2,
      bedType: "2 Single Beds",
      sizeSqm: 22,
      basePrice: 60,
      totalUnits: 2,
      amenities: [
        "wifi", "ac", "tv", "balcony", "sea_view", "fridge", "hairdryer", "towels", "cleaning",
      ],
      sortOrder: 4,
      images: [
        {
          url: `${PHOTO_BASE}/16795/1679569/1679569275.JPEG`,
          alt: "Superior Double Room with Sea View",
          isPrimary: true,
          sortOrder: 0,
        },
        {
          url: `${PHOTO_BASE}/17227/1722776/1722776901.JPEG`,
          alt: "Superior Double Room - view",
          isPrimary: false,
          sortOrder: 1,
        },
      ],
    },
    {
      slug: "double-room-balcony",
      nameEn: "Double Room with Balcony",
      nameEl: "Δίκλινο Δωμάτιο με Μπαλκόνι",
      nameDe: "Doppelzimmer mit Balkon",
      descEn:
        "A cozy room with a large double bed and a private balcony. Features air conditioning, flat-screen TV, mini fridge, and a private bathroom with shower. A peaceful retreat perfect for couples seeking simplicity and comfort by the sea.",
      descEl:
        "Ένα ζεστό δωμάτιο με μεγάλο διπλό κρεβάτι και ιδιωτικό μπαλκόνι. Διαθέτει κλιματισμό, τηλεόραση, μίνι ψυγείο και ιδιωτικό μπάνιο με ντους. Ιδανικό για ζευγάρια που αναζητούν απλότητα και άνεση κοντά στη θάλασσα.",
      descDe:
        "Ein gemütliches Zimmer mit einem großen Doppelbett und privatem Balkon. Mit Klimaanlage, Flachbildfernseher, Minikühlschrank und eigenem Bad mit Dusche. Ein friedlicher Rückzugsort perfekt für Paare.",
      capacity: 2,
      bedType: "1 Double Bed",
      sizeSqm: 20,
      basePrice: 50,
      totalUnits: 1,
      amenities: [
        "wifi", "ac", "tv", "balcony", "fridge", "hairdryer", "towels", "cleaning",
      ],
      sortOrder: 5,
      images: [
        {
          url: `${PHOTO_BASE}/16795/1679569/1679569277.JPEG`,
          alt: "Double Room with Balcony",
          isPrimary: true,
          sortOrder: 0,
        },
        {
          url: `${PHOTO_BASE}/16795/1679569/1679569159.JPEG`,
          alt: "Double Room with Balcony - garden",
          isPrimary: false,
          sortOrder: 1,
        },
      ],
    },
  ];

  for (const roomData of rooms) {
    const { images, ...room } = roomData;
    const createdRoom = await prisma.room.upsert({
      where: { slug: room.slug },
      update: room,
      create: room,
    });

    // Delete existing images and re-create
    await prisma.roomImage.deleteMany({ where: { roomId: createdRoom.id } });
    for (const image of images) {
      await prisma.roomImage.create({
        data: {
          ...image,
          roomId: createdRoom.id,
        },
      });
    }
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
