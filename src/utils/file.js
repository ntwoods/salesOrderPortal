export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export function isPdf(file) {
  if (!file) return false;
  const hasPdfMime = file.type === "application/pdf";
  const hasPdfExt = /\.pdf$/i.test(file.name || "");
  return hasPdfMime || hasPdfExt;
}

export async function buildUploadPayload(files) {
  const list = Array.from(files || []);
  if (!list.length) {
    throw new Error("Please select at least one PDF file.");
  }

  for (const file of list) {
    if (!isPdf(file)) {
      throw new Error(`Only PDF files are allowed (${file.name}).`);
    }
  }

  const payload = [];
  for (const file of list) {
    const base64 = await fileToBase64(file);
    payload.push({
      name: file.name,
      mimeType: "application/pdf",
      base64
    });
  }
  return payload;
}
