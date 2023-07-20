const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Please provide an Email!"],
        unique: [true, "Email Exist"],
    },

    password: {
        type: String,
        required: [true, "Please provide a password!"],
        unique: false,
    },
    points: {
        type: Number,
        required: [true, "Please provide credits"],
        unique: false,
    },
    name: {
        type: String,
        required: [true, "Please provide a Name"],
        unique: false,
    },
    rollNumber: {
        type: String,
        required: [true, "Please provide an rollNumber!"],
        unique: [true, "rollNumber Exist"],
    },
    project: {
        type: Boolean,
        required: [true, "Please provide a Project Status"],
    },
    round: {
        type: Number,
        required: [true, "Please provide current round"],
    }

})
module.exports = mongoose.model.Users || mongoose.model("Users", UserSchema);