import { useEffect, useRef, useState } from "react";
import "react-quill/dist/quill.snow.css";
import "./email-editor.css";

interface DescriptionEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export const DescriptionEditor = ({ value, onChange }: DescriptionEditorProps) => {
  const [ReactQuill, setReactQuill] = useState<any>(null);
  const quillRef = useRef<any>(null);

  useEffect(() => {
    // Import ReactQuill only on client side
    import('react-quill').then((module) => {
      setReactQuill(() => module.default);
    });
  }, []);

  // Configuration des modules Quill avec toutes les fonctionnalités
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ font: [] }],
      [{ size: ['small', false, 'large', 'huge'] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ script: "sub" }, { script: "super" }],
      [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
      [{ align: [] }],
      ["blockquote", "code-block"],
      ["link", "image", "video"],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "script",
    "list",
    "bullet",
    "indent",
    "align",
    "blockquote",
    "code-block",
    "link",
    "image",
    "video",
  ];

  if (!ReactQuill) {
    return (
      <div className="min-h-[300px] border rounded-md p-4 bg-muted/20 flex items-center justify-center">
        Chargement de l'éditeur...
      </div>
    );
  }

  return (
    <div className="email-editor-wrapper w-full">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder="Décrivez votre entreprise en détail... Utilisez la barre d'outils pour formater votre texte, ajouter des images, et créer une description professionnelle."
        className="min-h-[300px]"
      />
    </div>
  );
};
