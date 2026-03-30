import { useRef } from "react";

export default function FileUploadButton({ onFilesSelected, disabled, busyLabel = "Uploading..." }) {
  const inputRef = useRef(null);

  return (
    <div className="upload-control">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        hidden
        onChange={(event) => {
          const files = event.target.files;
          onFilesSelected?.(files);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        className="btn btn-primary"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {disabled ? busyLabel : "Upload Sales Order PDF"}
      </button>
    </div>
  );
}
