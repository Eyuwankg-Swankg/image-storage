const express = require("express");
const ejs = require("ejs");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const path = require("path");
const bodyparser = require("body-parser");
const passwordHash = require("password-hash");
const initializePassport = require("./passport-config");

const fs = require("fs");
const app = express();

var users = [];

initializePassport(passport, (email) =>
  users.find((user) => user.email === email)
);

// seting up view engine
app.set("view engine", "ejs");

// parsing incoming urls
app.use(bodyparser.urlencoded({ extended: false }));

// express flash messages
app.use(flash());

// express session
app.use(
  session({
    secret: "sha1$5dba6ba2$1$18a2610b11263ed2cd212f468ed027cc4c60e2d2",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/login" }),
  function (req, res) {
    console.log("checked");
    res.redirect("/gallery");
  }
);

// serving static files
app.use(express.static(__dirname + "/public"));

//@route  -  GET /
//@desc  -  route to Home page
//@access  -  PUBLIC
app.get("/", (req, res) => {
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
});

//@route  -  GET /register
//@desc  -  route to register page
//@access  -  PUBLIC
app.get("/register", (req, res) => {
  res.render("register.ejs");
});

//@route  -  GET /login
//@desc  -  route to login page
//@access  -  PUBLIC
app.get("/login", (req, res) => {
  res.render("login.ejs");
});

//@route  -  GET /gallery
//@desc  -  route to gallery page
//@access  -  PUBLIC
app.get("/gallery", (req, res) => {
  res.send("Gallery");
});

//@route  -  POST /register
//@desc  -  post route to register page
//@access  -  PRIVATE
app.post("/register", (req, res) => {
  if (users == null) users = [];
  try {
    const hashedPassword = passwordHash.generate(req.body.password);
    users.push({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
    });
    console.log(users);
    fs.writeFile(
      path.join(__dirname, "scratch", "users.txt"),
      JSON.stringify(users),
      (err) => {
        if (err) throw err;
      }
    );
    res.redirect("/login");
  } catch (err) {
    console.log(err);
    res.redirect("register");
  }
});

// listen to PORT 3000
app.listen(3000, () => console.log("Server running at 3000"));
