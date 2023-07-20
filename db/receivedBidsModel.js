const mongoose = require("mongoose");
const receivedBidsSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
        unique: true
    },
    bids: [{
        type: Map,
        of: Number
    }]
})
module.exports = mongoose.model.receivedBids || mongoose.model("receivedBids", receivedBidsSchema);