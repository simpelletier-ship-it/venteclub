import { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PremiumPhotoGalleryProps {
  photos: Array<{ id: string; photo_url: string }>;
  businessTitle: string;
  businessIndustry: string;
  businessCity: string;
}

export const PremiumPhotoGallery = ({ photos, businessTitle, businessIndustry, businessCity }: PremiumPhotoGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [direction, setDirection] = useState(0);

  const dragX = useMotionValue(0);
  const dragProgress = useTransform(dragX, [-200, 0, 200], [1, 0, -1]);

  const goToNext = () => {
    if (currentIndex < photos.length - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 50;
    if (info.offset.x > threshold && currentIndex > 0) {
      goToPrevious();
    } else if (info.offset.x < -threshold && currentIndex < photos.length - 1) {
      goToNext();
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
      filter: "blur(4px)",
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
      filter: "blur(4px)",
    }),
  };

  if (photos.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Carrousel principal */}
      <div className="relative aspect-[16/9] lg:aspect-[21/9] bg-slate-950 rounded-2xl overflow-hidden group">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 200, damping: 25 },
              opacity: { duration: 0.4, ease: "easeInOut" },
              scale: { duration: 0.4, ease: "easeInOut" },
              filter: { duration: 0.4, ease: "easeInOut" },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            style={{ x: dragX }}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
          >
            <img
              src={photos[currentIndex].photo_url}
              alt={`Photo ${currentIndex + 1} de ${businessTitle} - ${businessIndustry} à ${businessCity}`}
              className="w-full h-full object-cover"
              draggable={false}
            />
            
            {/* Overlay gradient subtil */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
          </motion.div>
        </AnimatePresence>

        {/* Contrôles navigation */}
        {photos.length > 1 && (
          <>
            {/* Bouton précédent */}
            <motion.button
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1, scale: 1.05 }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>

            {/* Bouton suivant */}
            <motion.button
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1, scale: 1.05 }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={goToNext}
              disabled={currentIndex === photos.length - 1}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </>
        )}

        {/* Bouton plein écran */}
        <motion.button
          initial={{ opacity: 0 }}
          whileHover={{ scale: 1.05 }}
          className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/20"
          onClick={() => setIsFullscreen(true)}
        >
          <ZoomIn className="w-5 h-5" />
        </motion.button>

        {/* Indicateur photo courante */}
        {photos.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white text-sm font-light"
          >
            {currentIndex + 1} / {photos.length}
          </motion.div>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {photos.map((photo, index) => (
            <motion.button
              key={photo.id}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1);
                setCurrentIndex(index);
              }}
              className="relative flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div 
                className={`w-24 h-16 rounded-lg overflow-hidden ${
                  index === currentIndex 
                    ? 'ring-2 ring-white shadow-lg' 
                    : 'opacity-50 hover:opacity-75'
                }`}
                animate={{
                  scale: index === currentIndex ? 1 : 0.95,
                  opacity: index === currentIndex ? 1 : 0.5,
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <img
                  src={photo.photo_url}
                  alt={`Miniature ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300"
                />
              </motion.div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Modal plein écran */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl"
            onClick={() => setIsFullscreen(false)}
          >
            <div className="relative w-full h-full flex items-center justify-center p-4">
              {/* Bouton fermer */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/10 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFullscreen(false);
                }}
              >
                <X className="w-6 h-6" />
              </Button>

              {/* Image plein écran */}
              <AnimatePresence mode="wait" custom={direction}>
                <motion.img
                  key={currentIndex}
                  custom={direction}
                  initial={{ scale: 0.95, opacity: 0, filter: "blur(4px)" }}
                  animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                  exit={{ scale: 0.95, opacity: 0, filter: "blur(4px)" }}
                  transition={{ 
                    duration: 0.4, 
                    ease: "easeInOut",
                    filter: { duration: 0.4 }
                  }}
                  src={photos[currentIndex].photo_url}
                  alt={`Photo ${currentIndex + 1} en plein écran`}
                  className="max-w-full max-h-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              </AnimatePresence>

              {/* Contrôles navigation plein écran */}
              {photos.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPrevious();
                    }}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNext();
                    }}
                    disabled={currentIndex === photos.length - 1}
                  >
                    <ChevronRight className="w-8 h-8" />
                  </Button>
                </>
              )}

              {/* Indicateur plein écran */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white">
                {currentIndex + 1} / {photos.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
