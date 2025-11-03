import pdfplumber
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
import os
import re
from datetime import datetime

def count_pdf_pages(pdf_path):
    try:
        with pdfplumber.open(pdf_path) as pdf:
            return len(pdf.pages)
    except Exception as e:
        print(f"Error counting pages: {str(e)}")
        return 0

def extract_all_text_structured(pdf_path):
    """Extract all text from PDF in a structured way"""
    all_data = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                # Method 1: Try table extraction
                tables = page.extract_tables()
                
                if tables:
                    for table in tables:
                        if table and len(table) > 1:
                            cleaned_table = []
                            for row in table:
                                if row and any(cell and str(cell).strip() for cell in row):
                                    cleaned_row = [str(cell).strip() if cell else '' for cell in row]
                                    cleaned_table.append(cleaned_row)
                            
                            if len(cleaned_table) > 1:
                                all_data.append({
                                    'page': page_num,
                                    'data': cleaned_table,
                                    'method': 'table'
                                })
                
                # Method 2: Extract text with layout
                text = page.extract_text()
                if text:
                    lines = [line.strip() for line in text.split('\n') if line.strip()]
                    if lines:
                        all_data.append({
                            'page': page_num,
                            'data': lines,
                            'method': 'text'
                        })
    
    except Exception as e:
        print(f"Error extracting data: {str(e)}")
    
    return all_data

def is_transaction_line(line):
    """Check if a line looks like a transaction"""
    # Date patterns
    date_patterns = [
        r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}',  # 01/01/2024, 1-1-24
        r'\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4}',  # 01 Jan 2024
    ]
    
    # Amount pattern
    amount_pattern = r'[\d,]+\.\d{2}'
    
    has_date = any(re.search(pattern, line) for pattern in date_patterns)
    has_amount = re.search(amount_pattern, line) is not None
    
    return has_date or has_amount

def split_transaction_line(line):
    """Split a transaction line into columns intelligently"""
    # Date patterns
    date_pattern = r'(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})'
    # Amount pattern (with optional comma separator)
    amount_pattern = r'([\d,]+\.\d{2})'
    
    parts = []
    
    # Find all dates
    date_matches = list(re.finditer(date_pattern, line))
    # Find all amounts
    amount_matches = list(re.finditer(amount_pattern, line))
    
    if date_matches or amount_matches:
        # Collect all match positions
        all_matches = []
        for match in date_matches:
            all_matches.append((match.start(), match.end(), match.group()))
        for match in amount_matches:
            all_matches.append((match.start(), match.end(), match.group()))
        
        # Sort by position
        all_matches.sort(key=lambda x: x[0])
        
        # Extract parts
        last_end = 0
        for start, end, value in all_matches:
            # Get text before this match
            if start > last_end:
                text_before = line[last_end:start].strip()
                if text_before:
                    parts.append(text_before)
            
            # Add the matched value
            parts.append(value)
            last_end = end
        
        # Get remaining text
        if last_end < len(line):
            remaining = line[last_end:].strip()
            if remaining:
                parts.append(remaining)
    else:
        # Fallback: split by multiple spaces or tabs
        parts = re.split(r'\s{2,}|\t+', line)
        parts = [p.strip() for p in parts if p.strip()]
    
    return parts if parts else [line]

def process_text_lines_to_table(lines):
    """Convert text lines to table format"""
    table_data = []
    
    # Find where transactions start (skip header info)
    header_keywords = ['date', 'description', 'particulars', 'debit', 'credit', 
                       'balance', 'transaction', 'amount', 'withdrawal', 'deposit']
    
    start_idx = 0
    for i, line in enumerate(lines):
        line_lower = line.lower()
        # Count keywords in line
        keyword_count = sum(1 for kw in header_keywords if kw in line_lower)
        if keyword_count >= 2:
            # This is likely the header row
            start_idx = i
            break
    
    # Process lines starting from header
    for line in lines[start_idx:]:
        if is_transaction_line(line):
            parts = split_transaction_line(line)
            if len(parts) >= 2:  # At least 2 columns
                table_data.append(parts)
    
    return table_data

def normalize_table_columns(table_data):
    """Make all rows have the same number of columns"""
    if not table_data:
        return []
    
    # Find max column count
    max_cols = max(len(row) for row in table_data)
    
    # Pad rows to match max columns
    normalized = []
    for row in table_data:
        if len(row) < max_cols:
            row = row + [''] * (max_cols - len(row))
        normalized.append(row[:max_cols])  # Trim if too long
    
    return normalized

def create_excel_from_data(data, output_path):
    """Create Excel from extracted data"""
    try:
        wb = Workbook()
        ws = wb.active
        ws.title = "Bank Statement"
        
        # Styles
        header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
        header_font = Font(color="FFFFFF", bold=True, size=11)
        normal_font = Font(size=10)
        border = Border(
            left=Side(style='thin', color='000000'),
            right=Side(style='thin', color='000000'),
            top=Side(style='thin', color='000000'),
            bottom=Side(style='thin', color='000000')
        )
        
        current_row = 1
        
        for item in data:
            if item['method'] == 'table':
                table_data = normalize_table_columns(item['data'])
            else:  # text method
                table_data = process_text_lines_to_table(item['data'])
                table_data = normalize_table_columns(table_data)
            
            if not table_data:
                continue
            
            # Write table data
            for row_idx, row_data in enumerate(table_data):
                for col_idx, cell_value in enumerate(row_data, start=1):
                    cell = ws.cell(row=current_row, column=col_idx, value=cell_value)
                    cell.border = border
                    
                    # First row is header
                    if row_idx == 0:
                        cell.fill = header_fill
                        cell.font = header_font
                        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
                    else:
                        cell.font = normal_font
                        cell.alignment = Alignment(vertical='top', wrap_text=True)
                
                current_row += 1
            
            # Add blank row between pages
            current_row += 1
        
        # Auto-adjust column widths
        for column in ws.columns:
            max_length = 0
            column_letter = column[0].column_letter
            
            for cell in column:
                try:
                    if cell.value:
                        lines = str(cell.value).split('\n')
                        for line in lines:
                            max_length = max(max_length, len(line))
                except:
                    pass
            
            # Set width (min 10, max 60)
            adjusted_width = min(max(max_length + 2, 10), 60)
            ws.column_dimensions[column_letter].width = adjusted_width
        
        wb.save(output_path)
        return True
    
    except Exception as e:
        print(f"Error creating Excel: {str(e)}")
        return False

def convert_pdf_to_excel(pdf_path, output_path):
    """Main conversion function"""
    try:
        # Count pages
        pages = count_pdf_pages(pdf_path)
        if pages == 0:
            return False, 0, "Could not read PDF file"
        
        # Extract all data
        extracted_data = extract_all_text_structured(pdf_path)
        
        if not extracted_data:
            return False, pages, "Could not extract any data from PDF"
        
        # Create Excel
        success = create_excel_from_data(extracted_data, output_path)
        
        if success:
            # Count total rows
            total_rows = 0
            for item in extracted_data:
                if item['method'] == 'table':
                    total_rows += len(item['data'])
                else:
                    table_data = process_text_lines_to_table(item['data'])
                    total_rows += len(table_data)
            
            return True, pages, f"Successfully converted {pages} page(s) with {total_rows} row(s)"
        else:
            return False, pages, "Error creating Excel file"
    
    except Exception as e:
        print(f"Conversion error: {str(e)}")
        return False, 0, f"Conversion error: {str(e)}"
