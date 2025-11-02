import pdfplumber
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
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

def extract_tables_from_pdf(pdf_path):
    """Extract tables from PDF with intelligent detection"""
    all_tables = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                # Extract tables using pdfplumber's table detection
                tables = page.extract_tables()
                
                if tables:
                    for table_idx, table in enumerate(tables):
                        if table and len(table) > 1:  # At least header + 1 row
                            cleaned_table = []
                            for row in table:
                                if row and any(cell for cell in row if cell and str(cell).strip()):
                                    cleaned_row = [str(cell).strip() if cell else '' for cell in row]
                                    cleaned_table.append(cleaned_row)
                            
                            if len(cleaned_table) > 0:
                                all_tables.append({
                                    'page': page_num,
                                    'table_index': table_idx,
                                    'data': cleaned_table
                                })
    
    except Exception as e:
        print(f"Error extracting tables: {str(e)}")
    
    return all_tables

def detect_statement_start(text_lines):
    """Detect where the actual statement data starts (skip bank header info)"""
    keywords = ['date', 'description', 'particulars', 'debit', 'credit', 'balance', 
                'transaction', 'amount', 'withdrawal', 'deposit', 'narration', 'chq']
    
    for i, line in enumerate(text_lines):
        line_lower = line.lower()
        # If line contains 2 or more keywords, it's likely a header
        keyword_count = sum(1 for keyword in keywords if keyword in line_lower)
        if keyword_count >= 2:
            return i
    
    return 0

def smart_split_line(line):
    """Intelligently split a line into columns"""
    # Try to detect patterns like date, description, amounts
    date_pattern = r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}'
    amount_pattern = r'[\d,]+\.\d{2}'
    
    parts = []
    
    # Find dates
    dates = list(re.finditer(date_pattern, line))
    # Find amounts
    amounts = list(re.finditer(amount_pattern, line))
    
    if dates or amounts:
        # Split based on detected patterns
        last_pos = 0
        positions = []
        
        for match in dates + amounts:
            positions.append((match.start(), match.end()))
        
        positions.sort()
        
        for start, end in positions:
            if start > last_pos:
                text = line[last_pos:start].strip()
                if text:
                    parts.append(text)
            parts.append(line[start:end].strip())
            last_pos = end
        
        if last_pos < len(line):
            remaining = line[last_pos:].strip()
            if remaining:
                parts.append(remaining)
    else:
        # Fall back to splitting by multiple spaces
        parts = re.split(r'\s{2,}', line.strip())
    
    return [p for p in parts if p]

def create_excel_from_tables(tables, output_path):
    """Create Excel file from extracted tables"""
    try:
        wb = Workbook()
        ws = wb.active
        ws.title = "Bank Statement"
        
        # Styles
        header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
        header_font = Font(color="FFFFFF", bold=True, size=11)
        border = Border(
            left=Side(style='thin'),
            right=Side(style='thin'),
            top=Side(style='thin'),
            bottom=Side(style='thin')
        )
        
        current_row = 1
        
        for table_info in tables:
            table_data = table_info['data']
            
            if not table_data:
                continue
            
            # Write table data
            for row_idx, row_data in enumerate(table_data):
                for col_idx, cell_value in enumerate(row_data, start=1):
                    cell = ws.cell(row=current_row, column=col_idx, value=cell_value)
                    cell.border = border
                    
                    # Style first row as header
                    if row_idx == 0:
                        cell.fill = header_fill
                        cell.font = header_font
                        cell.alignment = Alignment(horizontal='center', vertical='center')
                    else:
                        cell.alignment = Alignment(vertical='top', wrap_text=True)
                
                current_row += 1
            
            # Add spacing between tables
            current_row += 1
        
        # Auto-adjust column widths
        for column in ws.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if cell.value:
                        max_length = max(max_length, len(str(cell.value)))
                except:
                    pass
            adjusted_width = min(max_length + 2, 50)
            ws.column_dimensions[column_letter].width = adjusted_width
        
        wb.save(output_path)
        return True
    
    except Exception as e:
        print(f"Error creating Excel: {str(e)}")
        return False

def extract_text_fallback(pdf_path):
    """Fallback method: extract text and structure it"""
    try:
        all_lines = []
        
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    lines = text.split('\n')
                    all_lines.extend(lines)
        
        # Detect where statement starts
        start_idx = detect_statement_start(all_lines)
        
        # Process lines into table format
        table_data = []
        header_found = False
        
        for line in all_lines[start_idx:]:
            line = line.strip()
            if not line:
                continue
            
            parts = smart_split_line(line)
            
            if len(parts) > 1:
                if not header_found:
                    # First meaningful line is header
                    table_data.append(parts)
                    header_found = True
                else:
                    table_data.append(parts)
        
        if table_data:
            return [{'page': 1, 'table_index': 0, 'data': table_data}]
        
        return []
    
    except Exception as e:
        print(f"Text extraction fallback failed: {str(e)}")
        return []

def convert_pdf_to_excel(pdf_path, output_path):
    """Main conversion function with intelligent table extraction"""
    try:
        # Count pages
        pages = count_pdf_pages(pdf_path)
        if pages == 0:
            return False, 0, "Could not read PDF file"
        
        # Try to extract tables
        tables = extract_tables_from_pdf(pdf_path)
        
        # If no tables found, try text extraction fallback
        if not tables:
            tables = extract_text_fallback(pdf_path)
        
        if not tables or not any(table['data'] for table in tables):
            return False, pages, "No transaction data found in PDF"
        
        # Create Excel file
        success = create_excel_from_tables(tables, output_path)
        
        if success:
            total_rows = sum(len(table['data']) for table in tables)
            return True, pages, f"Successfully converted {pages} pages with {total_rows} rows"
        else:
            return False, pages, "Error creating Excel file"
    
    except Exception as e:
        return False, 0, f"Error: {str(e)}"
