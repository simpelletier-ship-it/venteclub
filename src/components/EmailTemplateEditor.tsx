import { useEffect, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./email-editor.css";

interface EmailTemplateEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export const EmailTemplateEditor = ({ value, onChange }: EmailTemplateEditorProps) => {
  const quillRef = useRef<ReactQuill>(null);

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
