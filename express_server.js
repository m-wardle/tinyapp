const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require("bcrypt");
const { findUserByEmail,
  urlsForUserId,
  generateRandomString,
  findUserById
} = require("./helpers");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));

const urlDatabase = {
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = {};

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
  if (findUserById(req.session.user_id, users)) {
    let templateVars = { userInfo: users[req.session.user_id] };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlsForUserId(req.session.user_id, urlDatabase), userInfo: users[req.session.user_id] };
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  if (!findUserById(req.session.user_id, users)) {
    res.statusCode = 404;
    let templateVars = {error1: "You are not logged in 😔", error2: "Please log in to view specific URLs.", userInfo: users[req.session.user_id], goHere: "/login"}
    res.render("error", templateVars);
  } else if (urlDatabase[req.params.shortURL]) {
    let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]["longURL"], urlID: urlDatabase[req.params.shortURL]["userID"], userInfo: users[req.session.user_id] };
    res.render("urls_show", templateVars);
  } else {
    res.statusCode = 404;
    let templateVars = {error1: "Short URL not found 🕵️‍♀️", error2: "Please try again 🔁", userInfo: users[req.session.user_id], goHere: "/urls"}
    res.render("error", templateVars);
  }
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    "longURL": req.body.longURL,
    "userID": req.session.user_id
  };
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
  res.statusCode = 303;
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL]["longURL"];
    res.redirect(longURL);
    res.statusCode = 303;
  } else {
    res.statusCode = 404;
    let templateVars = {error1: "Short URL not found 🕵️‍♀️", error2: "Please try again 🔁", userInfo: users[req.session.user_id], goHere: "/urls"}
    res.render("error", templateVars);
  }
});

app.post("/urls/:shortURL", (req, res) => {
  if (!findUserById(req.session.user_id, users)) {
    res.statusCode = 404;
    let templateVars = {error1: "You are not logged in 😔", error2: "Please log in to create and edit URLs.", userInfo: users[req.session.user_id], goHere: "/login"}
    res.render("error", templateVars);
  } else if (urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
    res.statusCode = 404;
    res.send("You don't have the proper permissions to edit that.\nEither <a href='/login'>log in</a> to the correct account, or <a href='/urls'>go back.</a>\n");
  }
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect('/urls');
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID === req.session.user_id) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.send("You don't have the proper permissions to do that!\n😡 Don't 😡 delete 😡 other 😡 people's 😡 links 😡\n");
  }
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.statusCode = 302;
    res.redirect("/urls");
  } else {
    let templateVars = { userInfo: users[req.session.user_id] };
    res.render("register", templateVars);
  }
});

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.statusCode = 400;
    let templateVars = {error1: "Whoops!", error2: "Please enter a valid username and password.", userInfo: users[req.session.user_id], goHere: "/register"}
    res.render("error", templateVars);
  } else if (findUserByEmail(req.body.email, users)) {
    res.statusCode = 400;
    let templateVars = {error1: "An account already exists with that email.", error2: "Please try again, or log in to your account.", userInfo: users[req.session.user_id], goHere: "/register"}
    res.render("error", templateVars);
  } else {
    let userID = generateRandomString();
    users[userID] = {
      "id": userID,
      "email": req.body.email,
      "password": bcrypt.hashSync(req.body.password, 10)
    };

    req.session.user_id = userID;
    console.log(users);
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.statusCode = 302;
    res.redirect("/urls");
  } else {
    let templateVars = { userInfo: users[req.session.user_id] };
    res.render("login", templateVars);
  }
});

app.post("/login", (req, res) => {
  if (!findUserByEmail(req.body.email, users)) {
    res.statusCode = 403;
    let templateVars = {error1: "Email not found 📩", error2: "Please try again.", userInfo: users[req.session.user_id], goHere: "/login"}
    res.render("error", templateVars);
  } else if (!bcrypt.compareSync(req.body.password, users[findUserByEmail(req.body.email, users)].password)) {
    res.statusCode = 403;
    let templateVars = {error1: "Incorrect password 🔑", error2: "Please try again.", userInfo: users[req.session.user_id], goHere: "/login"}
    res.render("error", templateVars);
  } else {
    req.session.user_id = findUserByEmail(req.body.email, users);
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("back");
});