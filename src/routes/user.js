const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const usersDbFile = path.join(__dirname, "../data/users.json");

let users = [];

router.get("/register", (req, res) => {
  res.render("register", { msg: null });
});

router.post("/register", (req, res) => {
  let { username, password } = req.body;
  for (let user of users) {
    if (user.username === username) {
      console.log("here");
      res.render("register", { msg: "Username already exists!" });
      return;
    }
  }
  let user = { username, password };
  users.push(user);
  saveUsersDb();

  res.redirect("/user/login");
});

router.get("/login", (req, res) => {
  res.render("login", { msg: null });
});

router.post("/login", (req, res) => {
  let { username, password } = req.body;
  for (let user of users) {
    if (user.username === username && user.password === password) {
      req.session.user = {
        username: user.username,
        password: user.password,
      };
      console.log(req.session.user);
      res.redirect("/");
      return;
    }
  }
  res.render("login", { msg: "Incorrect username or/and password!" });
});

router.get("/logout", (req, res) => {
  req.session.user = null;
  res.redirect("/");
});

function initUsersDb() {
  fs.readFile(usersDbFile, "utf-8", (err, data) => {
    if (err) {
      fs.writeFile(usersDbFile, "[]", (err) => {
        if (err) {
          console.log("successfully initialized users database");
          return;
        }
        console.log("cannot initialize users database");
      });
      return;
    }
    users = JSON.parse(data);
    console.log("successfully loaded users from database");
  });
}

function saveUsersDb() {
  fs.writeFile(usersDbFile, JSON.stringify(users), (err) => {
    if (err) {
      console.log("cannot save users into database");
      return;
    }
    console.log("successfully saved users into database");
  });
}

initUsersDb();

module.exports = router;
