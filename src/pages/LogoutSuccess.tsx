import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const LogoutSuccess = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      navigate("/");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="flex justify-center">
          <CheckCircle className="w-20 h-20 text-accent" />
        </div>
        <h1 className="text-4xl font-bold">{t('logoutSuccess.title')}</h1>
        <p className="text-muted-foreground text-lg">
          {t('logoutSuccess.message')}
        </p>
        <Button 
          onClick={() => navigate("/")}
          className="bg-accent hover:bg-accent/90"
        >
          {t('logoutSuccess.returnHome')}
        </Button>
      </div>
    </div>
  );
};

export default LogoutSuccess;
