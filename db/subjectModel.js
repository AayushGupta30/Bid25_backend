const mongoose = require("mongoose");
const SubjectSchema = new mongoose.Schema({
    SubjectName: {
        type: String,
        required: true,
    },
    SubCode: {
        type: String,
        required: true,
        unique: true
    },
    Professor: {
        type: String,
        required: true
    },
    NoOfSeats: {
        type: Number,
        required: true
    },
    AvailableSeats: {
        type: Number,
        required: true
    },
    Credits: {
        type: Number,
        required: true
    },
    Term: {
        type: Number,
        required: false,
    },
    StudentsList: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: false
    }]

})
module.exports = mongoose.model.Subjects || mongoose.model("Subjects", SubjectSchema);