const express = require("express");
const ejs = require("ejs");
const passport = require("passport");
const flash = require("connect-flash");
const session = require("express-session");
const path = require("path");
const multer = require("multer");
const { v4 } = require("uuid");
const bodyparser = require("body-parser");
const LocalStrategy = require("passport-local").Strategy;
const passwordHash = require("password-hash");
const fs = require("fs");
const app = express();

const PORT = process.env.PORT || 3000;

// multer diskstorage
var storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: function (req, file, cb) {
    cb(
      null,
      // file.fieldname + "-" + Date.now() + path.extname(file.originalname)
      user.username + "-" + v4() + path.extname(file.originalname)
    );
  },
});

var upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("image");

// variable declarations
var users = [];
var user;
var userIndex;

// Check File Type
function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}

// function get user Index by email
const getUserIndex = (email) => users.findIndex((user) => user.email == email);

// passport function
passport.use(
  new LocalStrategy({ usernameField: "email" }, function (
    email,
    password,
    done
  ) {
    userIndex = getUserIndex(email);
    if (userIndex != -1) user = users[userIndex];
    if (user == null) {
      return done(null, false, {});
    }
    if (passwordHash.verify(password, user.password)) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  })
);
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// seting up view engine
app.set("view engine", "ejs");

// parsing incoming urls
app.use(bodyparser.urlencoded({ extended: false }));

// express session
app.use(
  session({
    secret: "sha1$5dba6ba2$1$18a2610b11263ed2cd212f468ed027cc4c60e2d2",
    resave: false,
    saveUninitialized: false,
  })
);

// flash for messages
app.use(flash());

//@route  -  GET /login/failure
//@desc  -  route to add fail message
//@access  -  PRIVATE
app.get("/login/failure", (req, res) => {
  req.flash("info", "invalid username or password");
  res.redirect("/login");
});

//@route  -  GET /register/failure
//@desc  -  route to add fail message
//@access  -  PRIVATE
app.get("/register/failure", (req, res) => {
  req.flash("info", "user already exists");
  res.redirect("/register");
});

// initializa passport
app.use(passport.initialize());

// serving static files
app.use(express.static(__dirname + "/public"));

//@route  -  POST /login
//@desc  -  route to verify user
//@access  -  PRIVATE
app.post(
  "/login",
  (req, res, next) => {
    if (user != null) res.redirect("/gallery");
    else next();
  },
  passport.authenticate("local", {
    successRedirect: "/gallery",
    failureRedirect: "/login/failure",
  })
);

//@route  -  GET /
//@desc  -  route to Home page
//@access  -  PUBLIC
app.get(
  "/",
  (req, res, next) => {
    if (user != null) res.redirect("/gallery");
    else next();
  },
  (req, res) => {
    fs.readFile(
      path.join(__dirname, "scratch", "users.txt"),
      "utf8",
      (err, data) => {
        if (err) {
          throw err;
        }
        if (data !== "") users = JSON.parse(data);
      }
    );
    res.render("index.ejs");
  }
);

//@route  -  GET /register
//@desc  -  route to register page
//@access  -  PUBLIC
app.get(
  "/register",
  (req, res, next) => {
    if (user != null) res.redirect("/gallery");
    else next();
  },
  (req, res) => {
    if (users.length == 0) res.redirect("/");
    if (user != null) res.redirect("/gallery");
    res.render("register.ejs", { messages: req.flash("info") });
  }
);

//@route  -  GET /login
//@desc  -  route to login page
//@access  -  PUBLIC
app.get(
  "/login",
  (req, res, next) => {
    if (user != null) res.redirect("/gallery");
    else next();
  },
  (req, res) => {
    console.log("---------------------");
    if (users.length == 0) res.redirect("/");
    res.render("login.ejs", {
      messages: req.flash("info"),
    });
  }
);

//@route  -  GET /gallery
//@desc  -  route to gallery page
//@access  -  PUBLIC
app.get("/gallery", (req, res) => {
  // console.log(user);
  if (user == null) res.redirect("/");
  res.render("gallery.ejs", { user: user });
});

//@route  -  POST /upload
//@desc  -  post route to upload a image
//@access  -  PRIVATE
app.post("/upload", (req, res) => {
  if (user == null) res.redirect("/");
  upload(req, res, (err) => {
    if (err) {
      res.redirect("/gallery");
    } else {
      if (req.file == undefined) {
        res.redirect("/gallery");
      } else {
        user.photos.push(`uploads/${req.file.filename}`);
        users[userIndex] = user;
        // update to file
        fs.writeFile(
          path.join(__dirname, "scratch", "users.txt"),
          JSON.stringify(users),
          (err) => {
            if (err) throw err;
          }
        );
        res.redirect("/gallery");
      }
    }
  });
});

//@route  -  POST /register
//@desc  -  post route to register page
//@access  -  PRIVATE
app.post(
  "/register",
  (req, res, next) => {
    if (user != null) res.redirect("/gallery");
    else next();
  },
  (req, res) => {
    if (users == null) users = [];
    if (users !== []) {
      if (users.findIndex((user) => user.email === req.body.email) !== -1)
        res.redirect("/register/failure");
    }
    try {
      const hashedPassword = passwordHash.generate(req.body.password);
      users.push({
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
        photos: [],
      });
      // console.log(users);
      fs.writeFile(
        path.join(__dirname, "scratch", "users.txt"),
        JSON.stringify(users),
        (err) => {
          if (err) throw err;
        }
      );
      res.redirect("/login");
    } catch (err) {
      console.log("error", err);
      res.redirect("register");
    }
  }
);

// listen to PORT
app.listen(PORT, () => console.log("Server running at 3000"));
