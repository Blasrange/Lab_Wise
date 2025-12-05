"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = sendMail;
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: false,
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: (_a = process.env.MAIL_PASSWORD) === null || _a === void 0 ? void 0 : _a.replace(/"/g, ""),
    },
    tls: {
        rejectUnauthorized: false,
    },
});
function sendMail({ to, subject, text, html, }) {
    const mailOptions = {
        from: process.env.MAIL_FROM_ADDRESS,
        to,
        subject,
        text,
        html,
    };
    return transporter
        .sendMail(mailOptions)
        .then((info) => ({ success: true, info }))
        .catch((error) => ({ success: false, error }));
}
// Eliminado para usar export ES Modules
