'use strict';


const aws = require('aws-sdk'),
  s3 = new aws.S3(),
  chromium = require('chrome-aws-lambda'),
  {join} = require('path'),
  {readFile, writeFile} = require('fs'),
  {promisify} = require('util'),
  readFileAsync = promisify(readFile),
  writeFileAsync = promisify(writeFile);

exports.handler = async (event, context, callback) => {
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
  let browser = null;

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    let page = await browser.newPage();

    // await page.goto(event.url || 'https://example.com');
    await page.goto('file://' + inputFile); 

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
      Body: filePdf,
    }).promise()



  } catch (error) {
    return callback(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }

  return callback(null, result);
};