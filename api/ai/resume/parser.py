import io
from fastapi import UploadFile, HTTPException

def extract_text_from_cv(file_bytes: bytes, filename: str) -> str:
    fname = (filename or "").lower()
    extracted_text = ""

    if fname.endswith(".pdf"):
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        pages_text = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                pages_text.append(t)
        extracted_text = "\n\n".join(pages_text)
    elif fname.endswith(".docx"):
        import docx
        doc = docx.Document(io.BytesIO(file_bytes))
        extracted_text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    else:
        extracted_text = file_bytes.decode("utf-8", errors="ignore")

    clean_text = extracted_text.strip()
    if not clean_text:
        raise HTTPException(
            status_code=400,
            detail="Unable to extract text from CV. Please ensure the file contains readable text or paste manually."
        )
    return clean_text
