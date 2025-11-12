import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { formatPrice } from "@/lib/priceFormat";
import { toast } from "sonner";

interface MonthlyReportExportProps {
  transactions: any[];
  categories: any[];
  assets: any[];
  debts: any[];
  netWorth: number;
  totalIncome: number;
  totalExpenses: number;
  recommendations: string[];
}

export const MonthlyReportExport = ({
  transactions,
  categories,
  assets,
  debts,
  netWorth,
  totalIncome,
  totalExpenses,
  recommendations,
}: MonthlyReportExportProps) => {
  
  const generatePDF = async () => {
    try {
      toast.loading("Génération du rapport PDF...");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text("Rapport Financier Mensuel", pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      const currentDate = new Date().toLocaleDateString('fr-CA', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      pdf.text(currentDate, pageWidth / 2, yPosition, { align: "center" });

      yPosition += 15;

      // Section: Vue d'ensemble financière
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("📊 Vue d'ensemble financière", 15, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Valeur nette: ${formatPrice(netWorth)}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Revenus totaux: ${formatPrice(totalIncome)}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Dépenses totales: ${formatPrice(totalExpenses)}`, 20, yPosition);
      yPosition += 7;
      const balance = totalIncome - totalExpenses;
      pdf.text(`Balance: ${formatPrice(balance)}`, 20, yPosition);
      yPosition += 15;

      // Section: Actifs
      if (assets.length > 0) {
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.text("💰 Actifs", 15, yPosition);
        yPosition += 10;

        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        assets.forEach((asset: any) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(`• ${asset.name}: ${formatPrice(asset.value)}`, 20, yPosition);
          yPosition += 6;
        });
        yPosition += 10;
      }

      // Section: Dettes
      if (debts.length > 0) {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.text("📉 Dettes", 15, yPosition);
        yPosition += 10;

        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        debts.forEach((debt: any) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(`• ${debt.name}: ${formatPrice(debt.balance)} (${debt.interest_rate}%)`, 20, yPosition);
          yPosition += 6;
        });
        yPosition += 10;
      }

      // Section: Dépenses par catégorie
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("📈 Dépenses par catégorie", 15, yPosition);
      yPosition += 10;

      const expensesByCategory = categories
        .filter((cat: any) => cat.type === 'expense')
        .map((category: any) => {
          const categoryTransactions = transactions.filter(
            (t: any) => t.category_id === category.id && t.type === 'expense'
          );
          const total = categoryTransactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
          return { name: category.name, total, icon: category.icon };
        })
        .filter((item: any) => item.total > 0)
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 10);

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      expensesByCategory.forEach((cat: any) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`${cat.icon} ${cat.name}: ${formatPrice(cat.total)}`, 20, yPosition);
        yPosition += 6;
      });
      yPosition += 10;

      // Section: Recommandations
      if (recommendations.length > 0) {
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.text("💡 Recommandations", 15, yPosition);
        yPosition += 10;

        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        recommendations.forEach((rec: string, index: number) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          const lines = pdf.splitTextToSize(`${index + 1}. ${rec}`, pageWidth - 40);
          lines.forEach((line: string) => {
            pdf.text(line, 20, yPosition);
            yPosition += 6;
          });
          yPosition += 3;
        });
      }

      // Footer
      const totalPages = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.text(
          `Page ${i} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
        pdf.text(
          "Généré par Vente.club - Planificateur Budgétaire",
          pageWidth / 2,
          pageHeight - 5,
          { align: "center" }
        );
      }

      // Save PDF
      const fileName = `rapport-financier-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.dismiss();
      toast.success("Rapport PDF téléchargé avec succès!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.dismiss();
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  return (
    <Button onClick={generatePDF} variant="outline" className="gap-2">
      <Download className="h-4 w-4" />
      Télécharger le rapport PDF
    </Button>
  );
};
