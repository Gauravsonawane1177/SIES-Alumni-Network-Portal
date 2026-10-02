const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const receiptsDir = path.join(__dirname, '../../uploads/receipts');

function ensureDir() {
  fs.mkdirSync(receiptsDir, { recursive: true });
}

function receiptPath(receiptNumber) {
  const safe = String(receiptNumber).replace(/[^A-Za-z0-9_-]/g, '');
  return path.join(receiptsDir, `${safe}.pdf`);
}

function generateReceipt({
  receiptNumber,
  donorName,
  donorEmail,
  campaignName,
  amount,
  paymentId,
  date
}) {
  ensureDir();
  const filePath = receiptPath(receiptNumber);
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fillColor('#6B1C23').fontSize(22).text('SIES Alumni Network Portal', { align: 'center' });
  doc.moveDown(0.3);
  doc.fillColor('#C9A227').fontSize(14).text('Donation Receipt', { align: 'center' });
  doc.moveDown(1.5);
  doc.fillColor('#222').fontSize(12);
  doc.text(`Receipt Number: ${receiptNumber}`);
  doc.text(`Date: ${date}`);
  doc.moveDown();
  doc.text(`Donor Name: ${donorName}`);
  doc.text(`Donor Email: ${donorEmail}`);
  doc.text(`Campaign: ${campaignName}`);
  doc.text(`Amount: INR ${Number(amount).toFixed(2)}`);
  doc.text(`Payment ID: ${paymentId}`);
  doc.moveDown(1.5);
  doc.text('Thank you for supporting SIES students, alumni programmes, and campus development. Your contribution is sincerely appreciated.');
  doc.moveDown(2);
  doc.fillColor('#6B1C23').fontSize(10).text('This is a computer-generated receipt for sandbox/test payments.', {
    align: 'center'
  });
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

module.exports = { generateReceipt, receiptPath, receiptsDir };
