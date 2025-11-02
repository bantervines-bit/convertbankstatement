import pdfplumber
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
import os
import re
from datetime import datetime
from PIL import Image
import pytesseract

def count_pdf_pages(pdf_path):
    """Count the number of pages in a PDF file"""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            return len(pdf.pages)
    except Exception as e:
        print(f"Error counting pages: {str(e)}")
        return 0

def extract_tables_from_pdf(pdf_path):
    """Extract tables from PDF using pdfplumber"""
    all_tables = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                # Try to extract tables
                tables = page.extract_tables()
                
                if tables:
                    for table in tables:
                        if table and len(table) > 0:
                            # Clean the table data
                            cleaned_table = []
                            for row in table:
                                if row and any(cell for cell in row if cell and str(cell).strip()):
                                    cleaned_row = [str(cell).strip() if cell else '' for cell in row]
                                    cleaned_table.append(cleaned_row)
                            
                            if cleaned_table:
                                all_tables.append({
                                    'page': page_num,
                                    'data': cleaned_table
                                })
                else:
                    # If no tables found, try extracting text as structured data
                    text = page.extract_text()
                    if text:
                        lines = text.split('\n')
                        # Skip header information (first 5-10 lines usually contain bank info)
                        start_index = 0
                        keywords = ['date', 'description', 'debit', 'credit', 'balance', 'transaction', 'particulars', 'amount']
                        
                        for i, line in enumerate(lines):
                            if any(keyword in line.lower() for keyword in keywords):
                                start_index = i
                                break
                        
                        if start_index > 0:
                            relevant_lines = lines[start_index:]
                            structured_data = []
                            
                            for line in relevant_lines:
                                if line.strip():
                                    # Try to split by multiple spaces or tabs
                                    parts = re.split(r'\s{2,}|\t', line.strip())
                                    if len(parts) > 1:
                                        structured_data.append(parts)
                            
                            if structured_data:
                                all_tables.append({
                                    'page': page_num,
                                    'data': structured_data
                                })
    
    except Exception as e:
        print(f"Error extracting tables: {str(e)}")
    
    return all_tables

def extract_text_with_ocr(pdf_path):
    """Extract text from image-based PDFs using OCR"""
    try:
        from pdf2image import convert_from_path
        
        # Convert PDF to images
        images = convert_from_path(pdf_path, dpi=300)
        
        extracted_text = []
        for i, image in enumerate(images):
            # Use OCR to extract text
            text = pytesseract.image_to_string(image, lang='eng')
            if text.strip():
                extracted_text.append(f"--- Page {i+1} ---\n{text}")
        
        return "\n\n".join(extracted_text)
    
    except Exception as e:
        print(f"OCR extraction failed: {str(e)}")
        return None

def detect_header_row(table_data):
    """Detect which row is the header based on common keywords
