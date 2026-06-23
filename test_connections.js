const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');

const dbConfig = {
  host: 'mysql-1304bb05-mkmanu0102-511d.e.aivencloud.com',
  port: 25915,
  user: 'avnadmin',
  password: 'AVNS_ZbD6bmX0yUE_LmI6_L9',
  database: 'defaultdb',
  ssl: { rejectUnauthorized: false }
};

async function test() {
  console.log('Testing DB connection and querying users table...');
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('DB Connection successful!');
    
    // Check tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('Tables:', tables);

    // Query users
    const [users] = await connection.execute('SELECT * FROM users LIMIT 1');
    console.log('Query users success! Found:', users.length, 'users.');
    
    await connection.end();
  } catch (error) {
    console.error('DB Operation failed:', error);
  }

  console.log('\nTesting Nodemailer email sending...');
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'mkmanu0102@gmail.com',
        pass: 'agsimbzqbfbburmh'
      }
    });

    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: 'mkmanu0102@gmail.com',
      to: 'mkmanu0102@gmail.com', // send to self
      subject: 'Quiz World - Connection Test',
      text: 'This is a test email from the Quiz App backend debug script.'
    });
    console.log('Email sent successfully! MessageId:', info.messageId);
  } catch (error) {
    console.error('Email sending failed:', error);
  }
}

test();
