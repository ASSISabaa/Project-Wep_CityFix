const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ExportService {
    async exportToExcel(data, columns, filename) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Data');

        worksheet.columns = columns;
        worksheet.addRows(data);

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        const filepath = path.join(__dirname, '../exports', `${filename}.xlsx`);
        await workbook.xlsx.writeFile(filepath);

        return filepath;
    }

    async exportToPDF(data, title, filename) {
        const doc = new PDFDocument();
        const filepath = path.join(__dirname, '../exports', `${filename}.pdf`);
        
        doc.pipe(fs.createWriteStream(filepath));

        doc.fontSize(20).text(title, 50, 50);
        doc.fontSize(12);

        let y = 120;
        data.forEach((item, index) => {
            if (y > 700) {
                doc.addPage();
                y = 50;
            }

            doc.text(`${index + 1}. ${JSON.stringify(item)}`, 50, y);
            y += 30;
        });

        doc.end();
        return filepath;
    }

    async exportToCSV(data, columns, filename) {
        const csv = [
            columns.map(col => col.header).join(','),
            ...data.map(row => 
                columns.map(col => {
                    const value = this.getNestedValue(row, col.key);
                    return typeof value === 'string' && value.includes(',') 
                        ? `"${value}"` 
                        : value;
                }).join(',')
            )
        ].join('\n');

        const filepath = path.join(__dirname, '../exports', `${filename}.csv`);
        fs.writeFileSync(filepath, csv);

        return filepath;
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((acc, part) => acc?.[part], obj) || '';
    }
}

module.exports = new ExportService();