import { z } from "zod";

export const bookingFormSchema = z.object({
  roomId: z.string().min(1, "Please select a room"),
  checkIn: z.string().min(1, "Check-in date is required"),
  checkOut: z.string().min(1, "Check-out date is required"),
  guests: z.number().min(1, "At least 1 guest required").max(10),
});

export const guestDetailsSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  country: z.string().optional(),
  specialRequests: z.string().optional(),
});

export const contactFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export const adminLoginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type BookingFormData = z.infer<typeof bookingFormSchema>;
export type GuestDetailsData = z.infer<typeof guestDetailsSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type AdminLoginData = z.infer<typeof adminLoginSchema>;
