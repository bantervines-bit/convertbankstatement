import pdfplumber
import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
import os
import re
from datetime import datetime

def count_pdf_pages(pdf_path):
    """Count the number of pages in a PDF file"""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            return len(pdf.pages)
    except Exception as e:
        print(f"Error counting pages: {str(e)}")
        return 0

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF file"""
    try:
        text_content = []
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_content.append(text)
        return "\n".join(text_content)
    except Exception as e:
        print(f"Error extracting text: {str(e)}")
        return ""

def extract_transactions(text):
    """
    Extract transaction data from bank statement text
    This is a simple parser - you'll need to customize based on bank format
    """
    transactions = []
    
    # Common patterns for bank transactions
    # Date patterns: DD/MM/YYYY, DD-MM-YYYY, DD MMM YYYY
    date_pattern = r'\d{2}[/-]\d{2}[/-]\d{4}|\d{2}\s+[A-Za-z]{3}\s+\d{4}'
    
    # Amount pattern: numbers with optional commas and decimals
    amount_pattern = r'[\d,]+\.\d{2}'
    
    lines = text.split('\n')
    
    for line in lines:
        # Skip empty lines and headers
        if not line.strip() or len(line.strip()) < 10:
            continue
            
        # Try to find date
        date_match = re.search(date_pattern, line)
        
        # Try to find amounts
        amounts = re.findall(amount_pattern, line)
        
        if date_match and amounts:
            transaction_date = date_match.group()
            description = line[:date_match.start()].strip() or line[date_match.end():].strip()
            
            # Clean description
            for amt in amounts:
                description = description.replace(amt, '').strip()
            
            # Determine debit/credit
            debit = amounts[0] if len(amounts) >= 1 else ""
            credit = amounts[1] if len(amounts) >= 2 else ""
            balance = amounts[2] if len(amounts) >= 3 else ""
            
            transactions.append({
                'Date': transaction_date,
                'Description': description[:100],  # Limit description length
                'Debit': debit,
                'Credit': credit,
                'Balance': balance
            })
    
    return transactions

def create_excel_from_transactions(transactions, output_path):
    """Create a formatted Excel file from transactions"""
    try:
        wb = Workbook()
        ws = wb.active
        ws.title = "Transactions"
        
        # Define headers
        headers = ['Date', 'Description', 'Debit', 'Credit', 'Balance']
        
        # Style for headers
        header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
        header_font = Font(color="FFFFFF", bold=True)
        
        # Add headers
        for col, header in enumerate(headers, start=1):
            cell = ws.cell(row=1, column=col, value=header)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal='center')
        
        # Add data
        for row, transaction in enumerate(transactions, start=2):
            ws.cell(row=row, column=1, value=transaction.get('Date', ''))
            ws.cell(row=row, column=2, value=transaction.get('Description', ''))
            ws.cell(row=row, column=3, value=transaction.get('Debit', ''))
            ws.cell(row=row, column=4, value=transaction.get('Credit', ''))
            ws.cell(row=row, column=5, value=transaction.get('Balance', ''))
        
        # Adjust column widths
        ws.column_dimensions['A'].width = 15
        ws.column_dimensions['B'].width = 50
        ws.column_dimensions['C'].width = 15
        ws.column_dimensions['D'].width = 15
        ws.column_dimensions['E'].width = 15
        
        # Save the workbook
        wb.save(output_path)
        return True
    except Exception as e:
        print(f"Error creating Excel: {str(e)}")
        return False

def convert_pdf_to_excel(pdf_path, output_path):
    """
    Main function to convert PDF bank statement to Excel
    Returns: (success: bool, pages: int, message: str)
    """
    try:
        # Count pages
        pages = count_pdf_pages(pdf_path)
        if pages == 0:
            return False, 0, "Could not read PDF file"
        
        # Extract text
        text = extract_text_from_pdf(pdf_path)
        if not text:
            return False, pages, "Could not extract text from PDF"
        
        # Extract transactions
        transactions = extract_transactions(text)
        
        if not transactions:
            # If no transactions found, create a simple text dump
            df = pd.DataFrame({'Content': text.split('\n')})
            df.to_excel(output_path, index=False, engine='openpyxl')
            return True, pages, f"Converted {pages} pages (raw text format)"
        
        # Create formatted Excel
        success = create_excel_from_transactions(transactions, output_path)
        
        if success:
            return True, pages, f"Successfully converted {pages} pages with {len(transactions)} transactions"
        else:
            return False, pages, "Error creating Excel file"
            
    except Exception as e:
        return False, 0, f"Error: {str(e)}"
