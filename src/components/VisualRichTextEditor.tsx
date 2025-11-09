import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Highlighter,
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
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content || "";
    }
  }, []);

  const updateActiveFormats = () => {
    const formats = new Set<string>();
    
    if (document.queryCommandState("bold")) formats.add("bold");
    if (document.queryCommandState("italic")) formats.add("italic");
    if (document.queryCommandState("underline")) formats.add("underline");
    if (document.queryCommandState("insertUnorderedList")) formats.add("bulletList");
    if (document.queryCommandState("insertOrderedList")) formats.add("orderedList");
    if (document.queryCommandState("justifyLeft")) formats.add("justifyLeft");
    if (document.queryCommandState("justifyCenter")) formats.add("justifyCenter");
    if (document.queryCommandState("justifyRight")) formats.add("justifyRight");
    
    setActiveFormats(formats);
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    updateActiveFormats();
  };

  const handleSelectionChange = () => {
    updateActiveFormats();
  };

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const applyHighlight = (color: string) => {
    executeCommand("backColor", color);
  };

  const applyFontSize = (size: string) => {
    executeCommand("fontSize", size);
  };

  const applyFontFamily = (font: string) => {
    executeCommand("fontName", font);
  };

  const formatButtons = [
    {
      icon: Heading1,
      label: "Titre 1",
      action: () => executeCommand("formatBlock", "h1"),
      command: "h1",
    },
    {
      icon: Heading2,
      label: "Titre 2",
      action: () => executeCommand("formatBlock", "h2"),
      command: "h2",
    },
    {
      icon: Bold,
      label: "Gras",
      action: () => executeCommand("bold"),
      command: "bold",
    },
    {
      icon: Italic,
      label: "Italique",
      action: () => executeCommand("italic"),
      command: "italic",
    },
    {
      icon: Underline,
      label: "Souligné",
      action: () => executeCommand("underline"),
      command: "underline",
    },
    {
      icon: List,
      label: "Liste à puces",
      action: () => executeCommand("insertUnorderedList"),
      command: "bulletList",
    },
    {
      icon: ListOrdered,
      label: "Liste numérotée",
      action: () => executeCommand("insertOrderedList"),
      command: "orderedList",
    },
    {
      icon: AlignLeft,
      label: "Aligner à gauche",
      action: () => executeCommand("justifyLeft"),
      command: "justifyLeft",
    },
    {
      icon: AlignCenter,
      label: "Centrer",
      action: () => executeCommand("justifyCenter"),
      command: "justifyCenter",
    },
    {
      icon: AlignRight,
      label: "Aligner à droite",
      action: () => executeCommand("justifyRight"),
      command: "justifyRight",
    },
  ];

  const highlightColors = [
    { label: "Jaune", value: "#FFFF00" },
    { label: "Vert", value: "#90EE90" },
    { label: "Bleu", value: "#ADD8E6" },
    { label: "Rose", value: "#FFB6C1" },
    { label: "Orange", value: "#FFD580" },
  ];

  const fontSizes = [
    { label: "Petit", value: "2" },
    { label: "Normal", value: "3" },
    { label: "Grand", value: "5" },
    { label: "Très grand", value: "7" },
  ];

  const fontFamilies = [
    { label: "Sans Serif", value: "Arial, sans-serif" },
    { label: "Serif", value: "Georgia, serif" },
    { label: "Monospace", value: "Courier New, monospace" },
    { label: "Cursive", value: "Comic Sans MS, cursive" },
  ];

  return (
    <div className="border border-input rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="border-b border-input bg-muted/30 p-2 flex flex-wrap gap-2 items-center">
        {/* Font Family */}
        <Select onValueChange={applyFontFamily}>
          <SelectTrigger className="w-[140px] h-8">
            <SelectValue placeholder="Police" />
          </SelectTrigger>
          <SelectContent>
            {fontFamilies.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Font Size */}
        <Select onValueChange={applyFontSize}>
          <SelectTrigger className="w-[120px] h-8">
            <SelectValue placeholder="Taille" />
          </SelectTrigger>
          <SelectContent>
            {fontSizes.map((size) => (
              <SelectItem key={size.value} value={size.value}>
                {size.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="h-6 w-px bg-border" />

        {/* Format buttons */}
        {formatButtons.map((btn, index) => (
          <Button
            key={index}
            type="button"
            variant="ghost"
            size="sm"
            onClick={btn.action}
            title={btn.label}
            className={`h-8 w-8 p-0 ${activeFormats.has(btn.command) ? 'bg-accent' : ''}`}
          >
            <btn.icon className="h-4 w-4" />
          </Button>
        ))}

        <div className="h-6 w-px bg-border" />

        {/* Highlight colors */}
        <div className="flex gap-1 items-center">
          <Highlighter className="h-4 w-4 text-muted-foreground mr-1" />
          {highlightColors.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => applyHighlight(color.value)}
              title={color.label}
              className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
              style={{ backgroundColor: color.value }}
            />
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="min-h-[300px] max-h-[600px] overflow-y-auto overflow-x-hidden p-4 focus:outline-none prose prose-sm max-w-none"
          style={{
            wordWrap: "break-word",
            overflowWrap: "break-word",
          }}
          suppressContentEditableWarning
        />

        {!content && (
          <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>

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
        [contenteditable] * {
          max-width: 100%;
        }
      `}</style>
    </div>
  );
};
