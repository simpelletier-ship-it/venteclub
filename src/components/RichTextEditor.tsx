import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { FontFamily } from "@tiptap/extension-font-family";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { RichTextToolbar } from "./RichTextToolbar";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor = ({
  content,
  onChange,
  placeholder = "Commencez à écrire...",
  className,
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
      FontFamily,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg my-4",
        },
      }),
    ],
    content: content || "",
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none min-h-[300px] max-h-[800px] overflow-y-auto p-4",
          "prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl",
          "prose-p:text-foreground prose-strong:text-foreground",
          "prose-ul:list-disc prose-ol:list-decimal",
          "prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4",
          "prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
          className
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (html !== content) {
        onChange(html);
      }
    },
  });

  // Sync external content changes without creating infinite loops
  useEffect(() => {
    if (editor && content !== undefined && content !== null) {
      const currentContent = editor.getHTML();
      if (content !== currentContent) {
        editor.commands.setContent(content || "", { emitUpdate: false });
      }
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative border border-input rounded-lg overflow-hidden bg-background">
      <RichTextToolbar editor={editor} />
      <div className="relative">
        <EditorContent editor={editor} />
        {editor.isEmpty && (
          <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
};
