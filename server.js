const express = require("express");
const ejs = require("ejs");
const path = require("path");
const app = express();

app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/", (req, res) => {
  console.log();
  res.render("index.ejs", { va: __dirname });
});

app.listen(3000, () => console.log("Server running at 3000"));
