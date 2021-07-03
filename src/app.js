const express = require("express");
const app = express();
const session = require('express-session');


app.use(session({
  secret: '3$LpjkF@!MB;>.',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: false }));

app.use(express.static('public'));

app.get("/", (req, res) => {
  console.log(req.session.user);
  if (!req.session.user) {
    res.redirect('/user/login');
    return;
  }
  res.render("index");
});

const userRoutes = require("./routes/user");
const parkingRecordRoutes = require("./routes/parking-record");

app.use("/user", userRoutes);
app.use("/parking-record", parkingRecordRoutes);

app.listen(3000, () => console.log("server is running at port 3000"));
