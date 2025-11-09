import { useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./email-editor.css";

interface DescriptionEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export const DescriptionEditor = ({ value, onChange }: DescriptionEditorProps) => {
  const quillRef = useRef<ReactQuill>(null);

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
