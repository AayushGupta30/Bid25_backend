const Subject = require("./db/subjectModel");
const dbConnect = require("./db/dbConnect");
app.post("/addSubject", (request, response) => {
    const subject = new Subject({
        SubjectName: request.body.SubjectName,
        SubCode: request.body.SubCode,
        Professor: request.body.Professor,
        NoOfSeats: request.body.NoOfSeats,
        AvailableSeats: request.body.AvailableSeats,
        Credits: request.body.Credits,
        Term: request.body.Term,
    })
    subject.save().then((result) => {
        response.status(201).send({
            message: "Subject Created Successfully",
            result,
        });
    }).catch((error) => {
        response.status(500).send({
            message: "Error creating Subject",
            error,
        });
    });
});