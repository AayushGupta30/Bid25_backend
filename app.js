const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dbConnect = require("./db/dbConnect");
const User = require("./db/userModel");
const Subject = require("./db/subjectModel");
const receivedBid = require("./db/receivedBidsModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require("./auth");
const { Parser } = require('json2csv');
var cors = require('cors');
const subjectUserModel = require("./db/subjectUserModel");
const sendEmail = require('./mailer');
app.use(cors())
// body parser configuration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (request, response, next) => {
  response.json({ message: "Hey! This is your server response!" });
  next();
});

// execute database connection 
dbConnect();
app.use(function (request, response, next) {

  // Website you wish to allow to connect
  response.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  response.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});
// register endpoint
app.post("/register", (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  response.setHeader('Access-Control-Allow-Credentials', true);
  // hash the password
  bcrypt
    .hash(request.body.password, 10)
    .then((hashedPassword) => {
      // create a new user instance and collect the data
      const user = new User({
        email: request.body.email,
        password: hashedPassword,
        points: request.body.points,
        name: request.body.name,
        rollNumber: request.body.rollNumber,
        project: request.body.project,
        round: 0
      });

      // save the new user
      user
        .save()
        // return success if the new user is added to the database successfully
        .then((result) => {
          response.status(201).send({
            message: "User Created Successfully",
            result,
          });
        })
        // catch error if the new user wasn't added successfully to the database
        .catch((error) => {
          response.status(500).send({
            message: "Error creating user",
            error,
          });
        });
    })
    // catch error if the password hash isn't successful
    .catch((e) => {
      response.status(500).send({
        message: "Password was not hashed successfully",
        e,
      });
    });
});

// login endpoint
app.post("/login", (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  response.setHeader('Access-Control-Allow-Credentials', true);
  // check if email exists
  console.log("Login Accessed")
  User.findOne({ email: request.body.email })

    // if email exists
    .then((user) => {
      // compare the password entered and the hashed password found
      bcrypt
        .compare(request.body.password, user.password)

        // if the passwords match
        .then((passwordCheck) => {

          // check if password matches
          if (!passwordCheck) {
            return response.status(400).send({
              message: "Passwords does not match",
              error,
            });
          }

          //   create JWT token
          const token = jwt.sign(
            {
              userId: user._id,
              userEmail: user.email,
            },
            "RANDOM-TOKEN",
            { expiresIn: "24h" }
          );

          //   return success response
          response.status(200).send({
            message: "Login Successful",
            email: user.email,
            token,
          });
        })
        // catch error if password does not match
        .catch((error) => {
          response.status(400).send({
            message: "Passwords does not match",
            error,
          });
        });
    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Email not found",
        e,
      });
    });
});

//addSubject endpoint
app.post("/addsubject", (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  response.setHeader('Access-Control-Allow-Credentials', true);
  const subject = new Subject({
    SubjectName: request.body.SubjectName,
    SubCode: request.body.SubCode,
    Professor: request.body.Professor,
    NoOfSeats: request.body.NoOfSeats,
    AvailableSeats: request.body.AvailableSeats,
    Credits: request.body.Credits,
    Term: request.body.Term
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

app.post("/addbid/:round", async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  response.setHeader('Access-Control-Allow-Credentials', true);
  try {
    const round = Number(request.params.round)
    const { student, bids } = request.body
    const studentData = await User.findOne({
      _id: mongoose.Types.ObjectId(student)
    })
    const CreditsMap = {
      "Term1": 0,
      "Term02": 0,
      "Term03": 0
    }
    const subjectMap = {}
    const subjects = await Subject.find()
    for (const subject of subjects) {
      subjectMap[subject.SubCode] = subject
    }
    const assignedSubjects = await Subject.find({
      StudentsList: mongoose.Types.ObjectId(student)
    })
    /**
    for (const subject of assignedSubjects) {
      switch (subject.Term) {
        case 1:
          CreditsMap["Term1"] += subject.Credits
          break;
        case 2:
          CreditsMap["Term02"] += subject.Credits
          break;
        case 0:
          CreditsMap["Term02"] += subject.Credits
          break;
      }
      if (Object.keys(bids).includes(subject.SubCode)) {
        throw new Error('Not allowed to bid already assigned subjects!')
      }
    }
    for (const newSubCode of Object.keys(bids)) {
      if (bids[newSubCode] > 0) {
        switch (subjectMap[newSubCode].Term) {
          case 1:
            CreditsMap["Term1"] += subjectMap[newSubCode].Credits
            break;
          case 2:
            CreditsMap["Term02"] += subjectMap[newSubCode].Credits
            break;
          case 0:
            CreditsMap["Term02"] += subjectMap[newSubCode].Credits
            break;
        }
      }
    }
    if ((studentData.project === true && (CreditsMap["Term1"] + CreditsMap["Term02"] != 21) || CreditsMap["Term1"] < 9 || CreditsMap["Term02"] < 9)) {
      throw new Error('Your bids did not align with rules!')
    }
    else if ((studentData.project === false && (CreditsMap["Term1"] + CreditsMap["Term02"] != 27) || CreditsMap["Term1"] < 12 || CreditsMap["Term02"] < 12)) {
      throw new Error('Your bids did not align with rules!')
    }
    **/

    
    // for (const subject of assignedSubjects) {
    //   if(subject.Term == 1){
    //     CreditsMap["Term1"] += subject.Credits
    //   }
    //   if(subject.Term == 2){
    //     if(subject.Credits == 3 || subject.Credits == 4){
    //       CreditsMap["Term02"] += subject.Credits
    //     }
    //     if(subject.Credits == 6){
    //       CreditsMap["Term1"] += subject.Credits
    //       CreditsMap["Term02"] += subject.Credits
    //     }
    //   }
    //   if (Object.keys(bids).includes(subject.SubCode)) {
    //     throw new Error('Not allowed to bid already assigned subjects!')
    //   }
    // }
    // for (const newSubCode of Object.keys(bids)) {
    //   if (bids[newSubCode] > 0) {
    //     if(subjectMap[newSubCode].Term == 1){
    //       CreditsMap["Term1"]++
    //     }
    //     if(subjectMap[newSubCode].Term == 2){
    //       if(subjectMap[newSubCode].Credits == 3 || subjectMap[newSubCode].Credits == 4){
    //         CreditsMap["Term02"]++
    //       }
    //       if(subjectMap[newSubCode].Credits == 6){
    //         CreditsMap["Term03"]++
    //       }
    //     }
    //   }
    // }

    // *******************rules debugging 2: commit
    // for (const subject of assignedSubjects) {  
    //   if (subject.Term == 1) {
    //   CreditsMap["Term1"] += subject.Credits;
    //   }

    //   if (subject.Term == 2) {
    //       if (subject.Credits == 3 || subject.Credits == 4) {
    //         CreditsMap["Term02"] += subject.Credits;
    //       }
    //       if (subject.Credits == 6) {
    //         CreditsMap["Term1"] += subject.Credits;
    //         CreditsMap["Term02"] += subject.Credits;
    //         CreditsMap["Term03"] += 1; // Count of 6-credit subjects
    //       }
    //   }

    //   if (Object.keys(bids).includes(subject.SubCode)) {
    //     throw new Error('❌ Not allowed to bid already assigned subjects!');
    //   }
    // }

    // for (const newSubCode of Object.keys(bids)) {
    //   if (bids[newSubCode] > 0) {
    //     const course = subjectMap[newSubCode];

    //     if (course.Term == 1) {
    //       CreditsMap["Term1"] += course.Credits;
    //     }   

    //     if (course.Term == 2) {
    //       if (course.Credits == 3 || course.Credits == 4) {
    //         CreditsMap["Term02"] += course.Credits;
    //       }
    //       if (course.Credits == 6) {
    //         CreditsMap["Term1"] += course.Credits;
    //         CreditsMap["Term02"] += course.Credits;
    //         CreditsMap["Term03"] += 1; // Count of 6-credit subjects
    //       }
    //     }
    //   }
    // }
    
    // Loop 1: Assigned Subjects - SPLIT 3-3 logic for 6-credit courses
    // for (const subject of assignedSubjects) {

    //   if (subject.Credits == 6) {
    //       // 6-credit flexible course: 3 credits to each term
    //       CreditsMap["Term1"] += 3;
    //       CreditsMap["Term02"] += 3;
    //       CreditsMap["Term03"] += 6; // Count of 6-credit courses
    //   } else {
    //       if (subject.Term == 1) {
    //         CreditsMap["Term1"] += subject.Credits;
    //       }
    //       if (subject.Term == 2) {
    //         CreditsMap["Term02"] += subject.Credits;
    //       }
    //   }

    //   if (Object.keys(bids).includes(subject.SubCode)) {
    //     throw new Error('❌ Not allowed to bid already assigned subjects!');
    //   }
    // } 

    // Loop 2: New Bids Processing - SPLIT 3-3 logic for 6-credit courses
    // for (const newSubCode of Object.keys(bids)) {
    //   if (bids[newSubCode] > 0) {
    //     const course = subjectMap[newSubCode];

    //     if (course.Credits == 6) {
    //         CreditsMap["Term1"] += 3;
    //         CreditsMap["Term02"] += 3;
    //         CreditsMap["Term03"] += 6;
    //     } else {
    //         if (course.Term == 1) {
    //             CreditsMap["Term1"] += course.Credits;
    //         }
    //         if (course.Term == 2) {
    //             CreditsMap["Term02"] += course.Credits;
    //         }
    //     }
    //   }
    // }

    // 6-cred to min of T1 & T2
    for (const subject of assignedSubjects) {
    
      if (subject.Credits == 6) {
        // Add 6-credit course to the term with fewer credits
        if (CreditsMap["Term1"] <= CreditsMap["Term02"]) {
            CreditsMap["Term1"] += 6;
        } else {
            CreditsMap["Term02"] += 6;
        }
        CreditsMap["Term03"] += 6; // Still track total 6-credit course credits
      } else {
        if (subject.Term == 1) {
            CreditsMap["Term1"] += subject.Credits;
        }
        if (subject.Term == 2) {
            CreditsMap["Term02"] += subject.Credits;
        }
      }

      if (Object.keys(bids).includes(subject.SubCode)) {
        throw new Error('❌ Not allowed to bid already assigned subjects!');
      }
    }

    for (const newSubCode of Object.keys(bids)) {
      if (bids[newSubCode] > 0) {
        const course = subjectMap[newSubCode];

        if (course.Credits == 6) {
            if (CreditsMap["Term1"] <= CreditsMap["Term02"]) {
                CreditsMap["Term1"] += 6;
            } else {
                CreditsMap["Term02"] += 6;
            }
            CreditsMap["Term03"] += 6;
          } else {
            if (course.Term == 1) {
                CreditsMap["Term1"] += course.Credits;
            }
            if (course.Term == 2) {
                CreditsMap["Term02"] += course.Credits;
            }
          }
      }
    }

    
    //Semester 3
    if(CreditsMap["Term03"] == 0 && studentData.project === false)
    {
      if (CreditsMap["Term1"] < 12 || CreditsMap["Term02"] < 12 || CreditsMap["Term1"] + CreditsMap["Term02"] < 30) {
        console.log('%d : %d : %d', CreditsMap["Term1"], CreditsMap["Term02"], CreditsMap["Term03"])
        throw new Error('Your bids did not align with rules! [1]')
      }
    }

    if(CreditsMap["Term03"] == 6 && studentData.project === false)
    {
      if (CreditsMap["Term1"] < 12 || CreditsMap["Term02"] < 12 || CreditsMap["Term1"] + CreditsMap["Term02"] < 30) {
        console.log('%d : %d : %d', CreditsMap["Term1"], CreditsMap["Term02"], CreditsMap["Term03"])
        throw new Error('Your bids did not align with rules! [2]')
      }
    }

    if(CreditsMap["Term03"] == 12 && studentData.project === false)
    {
      if (CreditsMap["Term1"] < 12 || CreditsMap["Term02"] < 12 || CreditsMap["Term1"] + CreditsMap["Term02"] < 30) {
        console.log('%d : %d : %d', CreditsMap["Term1"], CreditsMap["Term02"], CreditsMap["Term03"])
        throw new Error('Your bids did not align with rules! [3]')
      }
    }

    if(CreditsMap["Term03"] == 0 && studentData.project === true)
    {
      if (CreditsMap["Term1"] < 3 || CreditsMap["Term02"] < 3 || CreditsMap["Term1"] + CreditsMap["Term02"] < 7) {
        console.log('%d : %d : %d', CreditsMap["Term1"], CreditsMap["Term02"], CreditsMap["Term03"])
        throw new Error('Your bids did not align with rules!- 4')
      }
    }

    if(CreditsMap["Term03"] == 1 && studentData.project === true)
    {
      if (CreditsMap["Term1"] < 1 || CreditsMap["Term02"] < 1 || CreditsMap["Term1"] + CreditsMap["Term02"] < 5) {
        console.log('%d : %d : %d', CreditsMap["Term1"], CreditsMap["Term02"], CreditsMap["Term03"])
        throw new Error('Your bids did not align with rules! -5')
      }
    }

    if(CreditsMap["Term03"] == 2 && studentData.project === true)
    {
      if (CreditsMap["Term1"] + CreditsMap["Term02"] < 3) {
        console.log('%d : %d : %d', CreditsMap["Term1"], CreditsMap["Term02"], CreditsMap["Term03"])
        throw new Error('Your bids did not align with rules! -6')
      }
    }

    //Semester 4
    // if(CreditsMap["Term03"] == 0 && studentData.project === false)
    // {
    //   if (CreditsMap["Term1"] < 4 || CreditsMap["Term02"] < 4 || CreditsMap["Term1"] + CreditsMap["Term02"] < 9) {
    //     console.log('%d : %d : %d', CreditsMap["Term1"], CreditsMap["Term02"], CreditsMap["Term03"])
    //     throw new Error('Your bids did not align with rules!')
    //   }
    // }

    // if(CreditsMap["Term03"] == 1 && studentData.project === false)
    // {
    //   if (CreditsMap["Term1"] < 2 || CreditsMap["Term02"] < 2 || CreditsMap["Term1"] + CreditsMap["Term02"] < 7) {
    //     console.log('%d : %d : %d', CreditsMap["Term1"], CreditsMap["Term02"], CreditsMap["Term03"])
    //     throw new Error('Your bids did not align with rules!')
    //   }
    // }

    // if(CreditsMap["Term03"] == 2 && studentData.project === false)
    // {
    //   if (CreditsMap["Term1"] + CreditsMap["Term02"] < 5) {
    //     console.log('%d : %d : %d', CreditsMap["Term1"], CreditsMap["Term02"], CreditsMap["Term03"])
    //     throw new Error('Your bids did not align with rules!')
    //   }
    // }

    // if(CreditsMap["Term03"] == 0 && studentData.project === true)
    // {
    //   if (CreditsMap["Term1"] < 2 || CreditsMap["Term02"] < 2 || CreditsMap["Term1"] + CreditsMap["Term02"] < 7) {
    //     console.log('%d : %d : %d', CreditsMap["Term1"], CreditsMap["Term02"], CreditsMap["Term03"])
    //     throw new Error('Your bids did not align with rules!')
    //   }
    // }

    // if(CreditsMap["Term03"] == 1 && studentData.project === true)
    // {
    //   if (/*CreditsMap["Term1"] < 1 || CreditsMap["Term02"] < 1 ||*/ CreditsMap["Term1"] + CreditsMap["Term02"] < 5) {
    //     console.log('%d : %d : %d', CreditsMap["Term1"], CreditsMap["Term02"], CreditsMap["Term03"])
    //     throw new Error('Your bids did not align with rules!')
    //   }
    // }

    // if(CreditsMap["Term03"] == 2 && studentData.project === true)
    // {
    //   if (CreditsMap["Term1"] + CreditsMap["Term02"] < 3) {
    //     console.log('%d : %d : %d', CreditsMap["Term1"], CreditsMap["Term02"], CreditsMap["Term03"])
    //     throw new Error('Your bids did not align with rules!')
    //   }
    // }
    
    if (round === 0) {
      const ReceivedBid = new receivedBid({
        student: student,
        bids: [bids]
      })
      await ReceivedBid.save()

    } else {
      const oldBid = await receivedBid.findOne({
        student: mongoose.Types.ObjectId(student)
      })
      console.log('oldBid.bids.length', oldBid.bids.length, round + 1)
      if (oldBid.bids.length > round) {
        throw new Error('Bid already placed!')
      }
      oldBid.bids.push(bids)
      await oldBid.save()
    }

    // Fetch the user's email
    const user = await User.findById(student);
    
    // Construct the email content
    const subjectList = Object.keys(bids).map(subCode => subCode + ' - ' + subjectMap[subCode].SubjectName + ' - ' + bids[subCode]).join('\n');
    const emailContent = `Hi ${user.name}, \nYour bid was placed successfully for the following subjects: \n${subjectList}`;

    //console.log(bids);
    // Send the email
    sendEmail(user.email, 'Bid Created Successfully - ' + user.name, emailContent);
    
    response.json({
      message: 'Bid Created Successfully!',
      term1Credits: CreditsMap["Term1"],
      term2Credits: CreditsMap["Term02"],
      sixCreditCourseCount: CreditsMap["Term03"],
      totalCredits: CreditsMap["Term1"] + CreditsMap["Term02"]
    })
  } catch (error) {
    console.error(error)
    response.status(500).json({
      message: 'You have your bids placed already. Contact admin to change bids',
      error: error.message
    })
  }
});

//subject Retrieve endpoint
app.get('/subjects', auth, async (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  try {
    const { userEmail } = req.user
    const student = await User.findOne({
      email: userEmail
    })
    const subjects = await Subject.find({
      StudentsList: {
        "$ne": student._id
      }
    });
    return res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'server error' });
  }
})
// authentication endpoint
app.get("/auth-endpoint", auth, (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.json({ message: "Welcome!" });
});

app.get("/userDetails", auth, (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  User.findOne({ email: req.user.userEmail }, function (err, docs) {
    if (err) {
      console.log(err)
    }
    else {
      console.log("Result : ", docs);
      res.send(docs)
    }
  })
});

app.get("/getBids", auth, (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  receivedBid.find(function (err, docs) {
    if (err) {
      console.log(err)
    }
    else {
      console.log("Result : ", docs);
      res.send(docs)
    }
  })
});

function insertionSort(arr, round, subject){
  //Start from the second element.
  for(let i = 1; i < arr.length;i++){

      //Go through the elements behind it.
      for(let j = i - 1; j > -1; j--){
          
          //value comparison using ascending order.
          if((arr[j + 1].bids[round]?.[subject.SubCode] ?? 0) >= (arr[j].bids[round]?.[subject.SubCode] ?? 0)){

              //swap
              [arr[j+1],arr[j]] = [arr[j],arr[j + 1]];

          }
      }
  };

return arr;
}

app.post("/closure/:round", async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  try {
    const round = Number(req.params.round)
    const { securityKey } = req.body
    if (process.env.SECURITY_KEY !== securityKey) {
      throw new Error('Something went wrong')
    }
    const subjects = await Subject.find()
    console.log(subjects)
    let receievedBids = await receivedBid.find().lean()
    for (const subject of subjects) {
      if (subject.AvailableSeats > 0) {
        let excludePoint = -1
        receievedBids = insertionSort(receievedBids, round, subject)
        if (receievedBids.length > subject.AvailableSeats && (receievedBids[subject.AvailableSeats]?.bids[round]?.[subject.SubCode] === receievedBids[subject.AvailableSeats - 1]?.bids[round]?.[subject.SubCode] || receievedBids[subject.AvailableSeats - 1]?.bids[round]?.[subject.SubCode] === receievedBids[subject.AvailableSeats - 2]?.bids[round]?.[subject.SubCode])) {
          excludePoint = receievedBids[subject.AvailableSeats]?.bids[round]?.[subject.SubCode] ?? undefined
        }
        for (i = 0; i < subject.AvailableSeats && i < receievedBids.length; i++) {
          console.log('excludePoint:', excludePoint, subject.SubCode)
          if (excludePoint !== receievedBids[i].bids[round]?.[subject.SubCode]) {
            console.log('subject:', subject.SubCode, receievedBids[i].bids[round]?.[subject.SubCode])
            subject.StudentsList.push(receievedBids[i].student)
            const student = await User.findOne({
              _id: mongoose.Types.ObjectId(receievedBids[i].student)
            })
            student.points -= receievedBids[i].bids[round]?.[subject.SubCode] ?? 0
            student.round = round + 1
            await student.save()
            const subjectUser = new subjectUserModel({
              subject: mongoose.Types.ObjectId(subject._id),
              round,
              user: mongoose.Types.ObjectId(student._id)
            })
            await subjectUser.save()
          }
        }
        subject.AvailableSeats -= subject.StudentsList.length
        await subject.save()
      }
    }
    res.send('success')
  } catch (error) {
    console.error(error)
    res.status(500).send(`FAILED: ${error.message}`)
  }
})

app.get("/subjects/elected/:round", auth, async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  try {
    const round = Number(req.params.round)
    const { userEmail } = req.user
    const student = await User.findOne({
      email: userEmail
    })
    const receievedBids = await receivedBid.findOne({
      student: mongoose.Types.ObjectId(student._id)
    }).lean()
    if (!receievedBids) {
      throw new Error('No bids found')
    }
    if (receievedBids.bids.length - 1 < round) {
      throw new Error('No data found')
    }
    const subjectList = Object.keys(receievedBids.bids[round])
    const subjects = await Subject.find({
      SubCode: {
        "$in": subjectList
      }
    }).lean()
    for (i = 0; i < subjects.length; i++) {
      subjects[i].Points = receievedBids.bids[round][subjects[i].SubCode]
    }
    res.json({
      subjectList: subjects
    })
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
})

app.get("/subjects/elected/export/:round", async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  try {
    const fields = ['Name', 'RollNumber', 'Email', 'SubCode', 'SubjectName', 'Credits', 'Professor', 'Point'];
    const opts = { fields };
    const csvData = []
    const round = Number(req.params.round)
    const students = await User.find().lean()
    for (const student of students) {
      const receievedBids = await receivedBid.findOne({
        student: mongoose.Types.ObjectId(student._id)
      }).lean()
      if (receievedBids?.bids) {
        const subjectList = Object.keys(receievedBids?.bids[round])
        const subjects = await Subject.find({
          SubCode: {
            "$in": subjectList
          }
        }).lean()
        for (i = 0; i < subjects.length; i++) {
          subjects[i].Points = receievedBids?.bids?.[round][subjects[i].SubCode]
          csvData.push({
            Name: student.name,
            RollNumber: student.rollNumber,
            Email: student.email,
            SubCode: subjects[i].SubCode,
            SubjectName: subjects[i].SubjectName,
            Credits: subjects[i].Credits,
            Professor: subjects[i].Professor,
            Point: subjects[i].Points
          })
        }
      }
    }
    const parser = new Parser(opts);
    const csv = parser.parse(csvData);
    console.log(csv);

    res.attachment('sample.csv').send(csv)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: error.message
    })
  }
})


app.get('/subject/export', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  try {
    const fields = ['Name', 'RollNumber', 'Email', 'SubCode', 'SubjectName', 'Credits', 'Professor', 'round', 'bid'];
    const opts = { fields };
    const csvData = []
    const subjects = await Subject.find().lean()
    for (const subject of subjects) {
      const students = await User.find({
        _id: {
          "$in": subject.StudentsList
        }
      }).lean()
      const subjectUser = await subjectUserModel.find({
        subject: mongoose.Types.ObjectId(subject._id),
        user: {
          "$in": subject.StudentsList
        }
      }).lean()
      subjectUserMap = {}
      for (const subUser of subjectUser) {
        subjectUserMap[`${subUser.user}-${subUser.subject}`] = subUser
      }
      const bids = await receivedBid.find({
        student: {
          "$in": subject.StudentsList
        }
      }).lean()
      bidMap = {}
      for (const bid of bids) {
        bidMap[`${bid.student}-${subject._id}`] = bid.bids[subjectUserMap[`${bid.student}-${subject._id}`].round][subject.SubCode]
      }
      for (const student of students) {
        csvData.push({
          Name: student.name,
          RollNumber: student.rollNumber,
          Email: student.email,
          SubCode: subject.SubCode,
          SubjectName: subject.SubjectName,
          Credits: subject.Credits,
          Professor: subject.Professor,
          round: subjectUserMap[`${student._id}-${subject._id}`].round,
          bid: bidMap[`${student._id}-${subject._id}`]
        })
      }
    }
    const parser = new Parser(opts);
    const csv = parser.parse(csvData);
    console.log(csv);

    res.attachment('sample.csv').send(csv)
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message
    })
  }
})

app.post('/subject/unroll', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  //CORS
  try {
    const { studentId, subCode, round } = req.body
    const student = await User.findOne({
      _id: mongoose.Types.ObjectId(studentId)
    })
    const subject = await Subject.findOne({
      SubCode: subCode
    })
    if (!subject) {
      throw new Error('Invalid subject code')
    }
    const receievedBids = await receivedBid.findOne({
      student: mongoose.Types.ObjectId(student._id)
    }).lean()
    if (!receievedBids) {
      throw new Error('No bids found')
    }
    if (receievedBids.bids.length - 1 < round) {
      throw new Error('No data found')
    }
    const refundPoints = receievedBids.bids[round][subCode]
    student.points += refundPoints
    console.log('found:', subject.StudentsList.indexOf(mongoose.Types.ObjectId(studentId)))
    const index = subject.StudentsList.indexOf(mongoose.Types.ObjectId(studentId))
    if (index < 0) {
      throw new Error('Student has not opted for course')
    }
    subject.StudentsList.splice(index, 1)
    subject.AvailableSeats += 1
    await student.save()
    await subject.save()
    res.send('success')
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message
    })
  }
})

module.exports = app;
