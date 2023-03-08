'use strict';


const aws = require('aws-sdk'),
s3 = new aws.S3(),
chromium = require('@sparticuz/chromium'),
puppeteer = require('puppeteer-core'),
{join} = require('path'),
{readFile, writeFile, unlink } = require('fs'),
{promisify} = require('util'),
readFileAsync = promisify(readFile),
writeFileAsync = promisify(writeFile),
unlinkAsync = promisify(unlink);

exports.handler = async (event, context, callback) => {
  console.log('Doing stuff...');
  let file = await readFileAsync('invoice_template.html', 'utf8');
  
  file = file.replace('#INVOICE_FULL_NAME', 'SR. LUIS FERNANDO MELÓN PÉREZ');
  file = file.replace('#INVOICE_DATE', '06/03/2023');
  file = file.replace('#INVOICE_PERIOD_DATE', '03/2023');
  file = file.replace('#INVOICE_NUMBER', '12A3V456C89D0987654321003');
  file = file.replace('#INVOICE_CLIENT_NUMBER', '1234567899877744588-LITE');
  file = file.replace('#INVOICE_PRIMARY_CLIENT_NAME', 'Miguel Ángel Melón Jiménez');
  file = file.replace('#INVOICE_CLIENT_DOCUMENT_ID', '12345678L');
  file = file.replace('#TAX_PERCENTAGE', '21%');
  file = file.replace('#INVOICE_TAX', '21€');
  file = file.replace('#INVOICE_IMPONIBLE_TAX', '89€');
  file = file.replace('#INVOICE_TOTAL_AMOUNT', '100€');
  
  const inputFile = join('/','tmp', 'invoice_template_filled.html');
  
  await writeFileAsync(inputFile, file, 'utf8');
  
  let result = null;

  //TODO: THIS MUST BE CHECKED
  await chromium.font('Helvetica');
  
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });
  
  let page = await browser.newPage();
  
  
  
  console.log("Chromium:", await browser.version());
  console.log("Page Title:", await page.title());
  
  // await page.goto(event.url || 'https://example.com');
  await page.goto('file://' + inputFile, {waitUntil: 'networkidle0'}); 
  
  //To reflect CSS used for screens instead of print
  await page.emulateMediaType('screen');
  
  await page.pdf({
    path: '/tmp/invoice.pdf',
    margin: { top: '100px', right: '50px', bottom: '100px', left: '50px' },
    printBackground: true,
    format: 'A4',
  });
  
  const filePdf = await readFileAsync('/tmp/invoice.pdf');
  
  await s3.putObject({
    Bucket: 'pdfs-output',
    Key: 'invoice.pdf',
    ContentType: 'application/pdf',
    ContentDisposition: 'inline',
    Body: filePdf,
  }).promise();

  console.log('File uploaded to S3')

  const url = s3.getSignedUrl('getObject', {
    Bucket: 'pdfs-output',
    Key: 'invoice.pdf',
    Expires: 60 * 5
  })

  console.log('URL:', url);

  await unlinkAsync('/tmp/invoice.pdf');

  await browser.close();
  
  return callback(null, result);
};