"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";

import Card from "@/components/ui/card";

interface ProductGalleryProps {
  images: string[];
}

export default function ProductGallery({
  images,
}: ProductGalleryProps) {
  const [activeImage, setActiveImage] = useState(0);

  const previous = () => {
    setActiveImage((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const next = () => {
    setActiveImage((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <section className="space-y-6">

      <Card className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-0">

        <div className="relative aspect-[16/9] overflow-hidden">

          <Image
            src={images[activeImage]}
            alt="Template Preview"
            fill
            priority
            className="object-cover object-top transition duration-700 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          <div className="absolute left-6 top-6 rounded-full bg-black/60 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            {activeImage + 1} / {images.length}
          </div>

          <button
            className="absolute right-6 top-6 rounded-full bg-black/60 p-3 text-white backdrop-blur transition hover:bg-cyan-500"
          >
            <Expand size={20} />
          </button>

          <button
            onClick={previous}
            className="absolute left-5 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 hover:bg-cyan-500"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={next}
            className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 hover:bg-cyan-500"
          >
            <ChevronRight size={24} />
          </button>

        </div>

      </Card>

      <div className="grid grid-cols-4 gap-5">

        {images.map((image, index) => (

          <button
            key={index}
            onClick={() => setActiveImage(index)}
            className={`group relative overflow-hidden rounded-2xl border transition duration-300 ${
              activeImage === index
                ? "scale-105 border-cyan-400 ring-2 ring-cyan-400/40"
                : "border-white/10 hover:border-cyan-400/40"
            }`}
          >

            <div className="relative aspect-square overflow-hidden">

              <Image
                src={image}
                alt={`Preview ${index + 1}`}
                fill
                className="object-cover object-top transition duration-500 group-hover:scale-110"
              />

            </div>

            {activeImage === index && (
              <div className="absolute inset-0 bg-cyan-500/10" />
            )}

          </button>

        ))}

      </div>

    </section>
  );
}