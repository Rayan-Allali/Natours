const nodemailer=require('nodemailer')

const sendEmail=async options=>{
    // 1 create transporter
    let transporter = nodemailer.createTransport({
        host: "smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: "f6ffd665edc21f",
          pass: "4a3db62febc63a"
        }
      });
    //2 define the email options 

    const mailOptions={
        from:'Rayan Allali <rayanalllali@gmail.com>',
        to:options.email,
        subject:options.subject,
        message:options.message
    }

    //3 send the email

    await transporter.sendMail(mailOptions)
}
module.exports=sendEmail