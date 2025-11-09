import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

interface VisualRichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export const VisualRichTextEditor = ({
  content,
  onChange,
  placeholder = "Commencez à écrire...",
}: VisualRichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content || "";
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const formatButtons = [
    {
      icon: Heading1,
      label: "Titre 1",
      action: () => executeCommand("formatBlock", "h1"),
    },
    {
      icon: Heading2,
      label: "Titre 2",
      action: () => executeCommand("formatBlock", "h2"),
    },
    {
      icon: Bold,
      label: "Gras",
      action: () => executeCommand("bold"),
    },
    {
      icon: Italic,
      label: "Italique",
      action: () => executeCommand("italic"),
    },
    {
      icon: Underline,
      label: "Souligné",
      action: () => executeCommand("underline"),
    },
    {
      icon: List,
      label: "Liste à puces",
      action: () => executeCommand("insertUnorderedList"),
    },
    {
      icon: ListOrdered,
      label: "Liste numérotée",
      action: () => executeCommand("insertOrderedList"),
    },
    {
      icon: AlignLeft,
      label: "Aligner à gauche",
      action: () => executeCommand("justifyLeft"),
    },
    {
      icon: AlignCenter,
      label: "Centrer",
      action: () => executeCommand("justifyCenter"),
    },
    {
      icon: AlignRight,
      label: "Aligner à droite",
      action: () => executeCommand("justifyRight"),
    },
  ];

  return (
    <div className="border border-input rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="border-b border-input bg-muted/30 p-2 flex flex-wrap gap-1">
        {formatButtons.map((btn, index) => (
          <Button
            key={index}
            type="button"
            variant="ghost"
            size="sm"
            onClick={btn.action}
            title={btn.label}
            className="h-8 w-8 p-0"
          >
            <btn.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[300px] max-h-[600px] overflow-y-auto p-4 focus:outline-none prose prose-sm max-w-none"
        style={{
          wordWrap: "break-word",
          overflowWrap: "break-word",
        }}
        suppressContentEditableWarning
      />

      {!content && (
        <div className="absolute top-16 left-4 text-muted-foreground pointer-events-none">
          {placeholder}
        </div>
      )}

      <style>{`
        [contenteditable] {
          -webkit-user-select: text;
          user-select: text;
        }
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
        }
        [contenteditable] h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        [contenteditable] h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        [contenteditable] strong, [contenteditable] b {
          font-weight: bold;
        }
        [contenteditable] em, [contenteditable] i {
          font-style: italic;
        }
        [contenteditable] u {
          text-decoration: underline;
        }
        [contenteditable] ul {
          list-style-type: disc;
          margin-left: 1.5em;
          margin: 0.5em 0;
        }
        [contenteditable] ol {
          list-style-type: decimal;
          margin-left: 1.5em;
          margin: 0.5em 0;
        }
        [contenteditable] li {
          margin: 0.25em 0;
        }
        [contenteditable] p {
          margin: 0.5em 0;
        }
      `}</style>
    </div>
  );
};
