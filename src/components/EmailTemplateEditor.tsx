import { useEffect, useRef, useState } from "react";
import "react-quill/dist/quill.snow.css";
import "./email-editor.css";

interface EmailTemplateEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export const EmailTemplateEditor = ({ value, onChange }: EmailTemplateEditorProps) => {
  const [ReactQuill, setReactQuill] = useState<any>(null);
  const quillRef = useRef<any>(null);

  useEffect(() => {
    // Import ReactQuill only on client side
    import('react-quill').then((module) => {
      setReactQuill(() => module.default);
    }).catch(err => {
      console.error('Failed to load ReactQuill:', err);
    });
  }, []);

  // Configuration des modules Quill
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ["link", "image"],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "color",
    "background",
    "align",
    "link",
    "image",
  ];

  if (!ReactQuill) {
    return (
      <div className="min-h-[400px] border rounded-md p-4 bg-muted/20 flex items-center justify-center">
        Chargement de l'éditeur...
      </div>
    );
  }

  return (
    <div className="email-editor-wrapper">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder="Composez votre email ici..."
        className="min-h-[400px]"
      />
    </div>
  );
};
