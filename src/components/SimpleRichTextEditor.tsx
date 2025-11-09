import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Eye,
  Edit,
} from "lucide-react";

interface SimpleRichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export const SimpleRichTextEditor = ({
  content,
  onChange,
  placeholder = "Commencez à écrire...",
}: SimpleRichTextEditorProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormatting = (before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end);

    onChange(newText);

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        end + before.length
      );
    }, 0);
  };

  const formatButtons = [
    {
      icon: Heading1,
      label: "Titre 1",
      action: () => insertFormatting("<h1>", "</h1>"),
    },
    {
      icon: Heading2,
      label: "Titre 2",
      action: () => insertFormatting("<h2>", "</h2>"),
    },
    {
      icon: Bold,
      label: "Gras",
      action: () => insertFormatting("<strong>", "</strong>"),
    },
    {
      icon: Italic,
      label: "Italique",
      action: () => insertFormatting("<em>", "</em>"),
    },
    {
      icon: Underline,
      label: "Souligné",
      action: () => insertFormatting("<u>", "</u>"),
    },
    {
      icon: List,
      label: "Liste",
      action: () => insertFormatting("<ul>\n<li>", "</li>\n</ul>"),
    },
    {
      icon: ListOrdered,
      label: "Liste numérotée",
      action: () => insertFormatting("<ol>\n<li>", "</li>\n</ol>"),
    },
  ];

  const renderPreview = () => {
    return (
      <div
        className="prose prose-sm max-w-none p-4 min-h-[300px] border border-input rounded-lg bg-muted/30"
        dangerouslySetInnerHTML={{ __html: content || "<p class='text-muted-foreground'>Aucune description</p>" }}
      />
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {formatButtons.map((btn, index) => (
            <Button
              key={index}
              type="button"
              variant="ghost"
              size="sm"
              onClick={btn.action}
              disabled={showPreview}
              title={btn.label}
            >
              <btn.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? (
            <>
              <Edit className="w-4 h-4 mr-2" />
              Éditer
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Aperçu
            </>
          )}
        </Button>
      </div>

      {showPreview ? (
        renderPreview()
      ) : (
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={12}
          className="font-mono text-sm"
        />
      )}

      <p className="text-xs text-muted-foreground">
        Sélectionnez du texte et cliquez sur un bouton pour appliquer le formatage.
        Vous pouvez aussi écrire directement les balises HTML.
      </p>
    </div>
  );
};
