const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDirectory = path.join(
    __dirname,
    "..",
    "uploads",
    "exhibitors"
);

// Create folder automatically if it doesn't exist
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
        recursive: true
    });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDirectory);
    },

    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname);

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            extension;

        cb(null, uniqueName);
    }
});

const fileFilter = function (req, file, cb) {

    // Profile photo and organization logo
    if (
        file.fieldname === "exi_photo" ||
        file.fieldname === "org_logo"
    ) {
        const allowedImages = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (allowedImages.includes(file.mimetype)) {
            return cb(null, true);
        }

        return cb(
            new Error(
                "Only JPG, PNG, or WEBP images are allowed."
            )
        );
    }

    // Brochure
    if (file.fieldname === "exi_brochure") {

        if (file.mimetype === "application/pdf") {
            return cb(null, true);
        }

        return cb(
            new Error(
                "Only PDF files are allowed for brochures."
            )
        );
    }

    cb(
        new Error(
            "Invalid file field."
        )
    );
};

const exhibitorUpload = multer({
    storage: storage,

    fileFilter: fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

module.exports = exhibitorUpload;