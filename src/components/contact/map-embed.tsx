"use client";

export function MapEmbed() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-soft aspect-[4/3] sm:aspect-[16/9]">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3200!2d27.075555!3d36.84941!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14dab0b3a2c5c3f5%3A0x4b7e73bce6a3b1d2!2sPanorama%20Studios!5e0!3m2!1sen!2sgr!4v1700000000000!5m2!1sen!2sgr"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Panorama Seaside Studios, Mastichari, Kos"
        className="absolute inset-0 h-full w-full rounded-2xl"
      />
    </div>
  );
}
