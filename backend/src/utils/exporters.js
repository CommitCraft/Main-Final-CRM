const fs = require('fs');
const path = require('path');

// Ensure exports directory exists
const ensureExportsDir = () => {
  const exportsDir = path.join(__dirname, '../../exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  return exportsDir;
};

// Export data to CSV format
const exportToCSV = async (data, filename) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const exportsDir = ensureExportsDir();
    const fullFilename = `${filename}.csv`;
    const filePath = path.join(exportsDir, fullFilename);

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(row => {
      const values = headers.map(header => {
        let value = row[header];
        
        // Handle null/undefined values
        if (value === null || value === undefined) {
          value = '';
        }
        
        // Convert to string and escape quotes
        value = String(value).replace(/"/g, '""');
        
        // Wrap in quotes if contains comma, newline, or quote
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
          value = `"${value}"`;
        }
        
        return value;
      });
      
      csvContent += values.join(',') + '\n';
    });

    // Write file
    fs.writeFileSync(filePath, csvContent, 'utf8');

    // Get file size
    const stats = fs.statSync(filePath);
    
    return {
      filePath: filePath,
      filename: fullFilename,
      fileSize: stats.size,
      contentType: 'text/csv'
    };
  } catch (error) {
    console.error('CSV export error:', error);
    throw new Error(`Failed to export CSV: ${error.message}`);
  }
};

// Export data to JSON format
const exportToJSON = async (data, filename) => {
  try {
    const exportsDir = ensureExportsDir();
    const fullFilename = `${filename}.json`;
    const filePath = path.join(exportsDir, fullFilename);

    const jsonData = {
      exported_at: new Date().toISOString(),
      record_count: data.length,
      data: data
    };

    // Write file with pretty formatting
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');

    // Get file size
    const stats = fs.statSync(filePath);
    
    return {
      filePath: filePath,
      filename: fullFilename,
      fileSize: stats.size,
      contentType: 'application/json'
    };
  } catch (error) {
    console.error('JSON export error:', error);
    throw new Error(`Failed to export JSON: ${error.message}`);
  }
};

// Export data to PDF format (basic implementation)
const exportToPDF = async (data, filename, title = 'Export Report') => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const exportsDir = ensureExportsDir();
    const fullFilename = `${filename}.pdf`;
    const filePath = path.join(exportsDir, fullFilename);

    // For now, create a simple text-based PDF content
    // In a real application, you'd use a library like PDFKit or Puppeteer
    let pdfContent = `${title}\n`;
    pdfContent += `Generated: ${new Date().toISOString()}\n`;
    pdfContent += `Records: ${data.length}\n\n`;
    
    if (data.length > 0) {
      // Add headers
      const headers = Object.keys(data[0]);
      pdfContent += headers.join('\t') + '\n';
      pdfContent += '-'.repeat(80) + '\n';
      
      // Add data rows (limit to first 100 for PDF)
      const limitedData = data.slice(0, 100);
      limitedData.forEach(row => {
        const values = headers.map(header => {
          let value = row[header];
          if (value === null || value === undefined) return '';
          return String(value).substring(0, 50); // Truncate long values
        });
        pdfContent += values.join('\t') + '\n';
      });
      
      if (data.length > 100) {
        pdfContent += `\n... and ${data.length - 100} more records\n`;
      }
    }

    // Write as text file with PDF extension (basic implementation)
    fs.writeFileSync(filePath, pdfContent, 'utf8');

    // Get file size
    const stats = fs.statSync(filePath);
    
    return {
      filePath: filePath,
      filename: fullFilename,
      fileSize: stats.size,
      contentType: 'application/pdf'
    };
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error(`Failed to export PDF: ${error.message}`);
  }
};

// Export data to Excel format (basic CSV with .xlsx extension)
const exportToExcel = async (data, filename) => {
  try {
    // For simplicity, use CSV format with Excel extension
    // In production, you'd use a library like ExcelJS
    const csvResult = await exportToCSV(data, filename);
    
    const exportsDir = ensureExportsDir();
    const fullFilename = `${filename}.xlsx`;
    const filePath = path.join(exportsDir, fullFilename);
    
    // Copy CSV content to Excel file
    fs.copyFileSync(csvResult.filePath, filePath);
    
    // Delete temporary CSV file
    fs.unlinkSync(csvResult.filePath);
    
    const stats = fs.statSync(filePath);
    
    return {
      filePath: filePath,
      filename: fullFilename,
      fileSize: stats.size,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  } catch (error) {
    console.error('Excel export error:', error);
    throw new Error(`Failed to export Excel: ${error.message}`);
  }
};

// Clean up old export files (older than specified days)
const cleanupExports = (daysOld = 7) => {
  try {
    const exportsDir = ensureExportsDir();
    const files = fs.readdirSync(exportsDir);
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    
    let deletedCount = 0;
    
    files.forEach(file => {
      const filePath = path.join(exportsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime.getTime() < cutoffTime) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });
    
    console.log(`Cleaned up ${deletedCount} old export files`);
    return deletedCount;
  } catch (error) {
    console.error('Export cleanup error:', error);
    return 0;
  }
};

// Get export file info
const getExportFileInfo = (filename) => {
  try {
    const exportsDir = ensureExportsDir();
    const filePath = path.join(exportsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const stats = fs.statSync(filePath);
    
    return {
      filename: filename,
      filePath: filePath,
      fileSize: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    };
  } catch (error) {
    console.error('Get export file info error:', error);
    return null;
  }
};

// List all export files
const listExportFiles = () => {
  try {
    const exportsDir = ensureExportsDir();
    const files = fs.readdirSync(exportsDir);
    
    return files.map(file => {
      const filePath = path.join(exportsDir, file);
      const stats = fs.statSync(filePath);
      
      return {
        filename: file,
        fileSize: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        extension: path.extname(file)
      };
    }).sort((a, b) => b.modifiedAt - a.modifiedAt);
  } catch (error) {
    console.error('List export files error:', error);
    return [];
  }
};

module.exports = {
  exportToCSV,
  exportToJSON,
  exportToPDF,
  exportToExcel,
  cleanupExports,
  getExportFileInfo,
  listExportFiles,
  ensureExportsDir
};