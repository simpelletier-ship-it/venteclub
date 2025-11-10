import BusinessMap from "@/components/BusinessMap";
import { useTranslation } from "react-i18next";

const Map = () => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-background pt-32">
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">{t('map.title')}</h1>
            <p className="text-xl text-muted-foreground mb-2">
              {t('map.subtitle')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('map.tip')}
            </p>
          </div>

          <BusinessMap />
        </div>
      </section>
    </div>
  );
};

export default Map;
