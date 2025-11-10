import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

export const DisclaimerAlert = () => {
  const { t } = useTranslation();
  
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="font-bold">{t('disclaimer.title')}</AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>
          <strong>{t('disclaimer.platformNotice')}</strong> {t('disclaimer.noResponsibility')}
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>{t('disclaimer.accuracy')}</li>
          <li>{t('disclaimer.quality')}</li>
          <li>{t('disclaimer.agreements')}</li>
          <li>{t('disclaimer.disputes')}</li>
        </ul>
        <p className="font-semibold mt-3">
          {t('disclaimer.dueDiligenceTitle')}
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>{t('disclaimer.verifyInfo')}</li>
          <li>{t('disclaimer.consultProfessionals')}</li>
          <li>{t('disclaimer.thoroughVerification')}</li>
          <li>{t('disclaimer.noPaymentWithoutGuarantees')}</li>
          <li>{t('disclaimer.checkCompliance')}</li>
        </ul>
        <p className="mt-3 font-semibold">
          {t('disclaimer.acknowledgment')}
        </p>
      </AlertDescription>
    </Alert>
  );
};
