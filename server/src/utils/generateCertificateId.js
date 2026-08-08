import crypto from "crypto";

const generateCertificateId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString("hex").toUpperCase();

    return `CEP-${timestamp}-${random}`;
};

export default generateCertificateId;
