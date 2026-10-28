-- Guest sign-in and stay calendar.
-- Run once against the MySQL database used by this app.

CREATE TABLE IF NOT EXISTS `Guest` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(191) NOT NULL,
  `firstName` VARCHAR(191) NOT NULL,
  `lastName` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Guest_email_key`(`email`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Booking` ADD COLUMN `guestId` VARCHAR(191) NULL;
CREATE INDEX `Booking_guestId_idx` ON `Booking`(`guestId`);
ALTER TABLE `Booking`
  ADD CONSTRAINT `Booking_guestId_fkey`
  FOREIGN KEY (`guestId`) REFERENCES `Guest`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
