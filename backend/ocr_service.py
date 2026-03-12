"""
Azure Document Intelligence (OCR) – extract text from uploaded documents.
"""
import os
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from dotenv import load_dotenv

load_dotenv()

ENDPOINT = os.getenv("AZURE_DOC_INTEL_ENDPOINT")
KEY = os.getenv("AZURE_DOC_INTEL_KEY")


def extract_text_from_document(file_bytes: bytes) -> str:
    """Analyse a document with Azure Document Intelligence and return plain text."""
    try:
        client = DocumentAnalysisClient(
            endpoint=ENDPOINT,
            credential=AzureKeyCredential(KEY),
        )

        print(f"DEBUG: Starting Azure OCR analysis on endpoint: {ENDPOINT}")
        poller = client.begin_analyze_document("prebuilt-read", file_bytes)
        result = poller.result()
        print("DEBUG: OCR analysis completed successfully")

        extracted_text = ""
        for page in result.pages:
            for line in page.lines:
                extracted_text += line.content + "\n"

        return extracted_text

    except Exception as e:
        print(f"DEBUG: OCR Error occurred: {type(e).__name__}: {str(e)}")
        raise
