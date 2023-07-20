const mongoose = require("mongoose");
const subjectUserSchema = new mongoose.Schema({
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subjects',
        required: true
    },
    round: {
        type: Number,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    }
})

module.exports = mongoose.model.SubjectUsers || mongoose.model("SubjectUsers", subjectUserSchema);