// Require dependencies as necessary

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

// Set variables

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

// Routes

// Set up server

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Root directory redirects to URL index if logged in, otherwise prompts login

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// Checks login status/verify user before allowing for creation of a new URL. Error page if logged out with link to login.

app.get("/urls/new", (req, res) => {
  if (findUserById(req.session.user_id, users)) {
    let templateVars = { userInfo: users[req.session.user_id] };
    res.render("urls_new", templateVars);
  } else {
    res.statusCode = 404;
    let templateVars = {
      error1: "You are not logged in 😔",
      error2: "Please log in to create URLs.",
      userInfo: users[req.session.user_id],
      goHere: "/login"
    }
    res.render("error", templateVars);
  }
});

// URLs index has its own check for login status within its template.

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlsForUserId(req.session.user_id, urlDatabase), userInfo: users[req.session.user_id] };
  res.render("urls_index", templateVars);
});

// Checks first if correct user is logged in, if user is logged in and shortURL is correct, presents page. Otherwise, renders error page.

app.get("/urls/:shortURL", (req, res) => {
  if (!findUserById(req.session.user_id, users)) {
    res.statusCode = 404;
    let templateVars = {
      error1: "You are not logged in 😔",
      error2: "Please log in to view specific URLs.",
      userInfo: users[req.session.user_id],
      goHere: "/login"
    }
    res.render("error", templateVars);

  } else if (urlDatabase[req.params.shortURL]) {
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL]["longURL"],
      createTime: urlDatabase[req.params.shortURL]["createTime"],
      visitCount: urlDatabase[req.params.shortURL]["visitCount"],
      urlID: urlDatabase[req.params.shortURL]["userID"],
      userInfo: users[req.session.user_id]
    };
    res.render("urls_show", templateVars);

  } else {
    res.statusCode = 404;
    let templateVars = {
    error1: "Short URL not found 🕵️‍♀️",
    error2: "Please try again 🔁",
    userInfo: users[req.session.user_id],
    goHere: "/urls"
  };
    res.render("error", templateVars);
  }
});

// Adds new URL to database.

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  // Getting readable date in dd/mm/yyyy format.
  let today = new Date();
  let dd = String(today.getDate()).padStart(2, '0');
  let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  let yyyy = today.getFullYear();

  today = dd + '/' + mm + '/' + yyyy;

  urlDatabase[shortURL] = {
    "longURL": req.body.longURL,
    "userID": req.session.user_id,
    "createTime": today,
    "visitCount": 0
  };
  res.redirect(`/urls/${shortURL}`);
  res.statusCode = 303;
});

// If shortURL exists, links to the shortened website. If not, renders error page.

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL]["longURL"];
    urlDatabase[req.params.shortURL]["visitCount"]++;
    res.redirect(longURL);
    res.statusCode = 303;
  } else {
    res.statusCode = 404;
    let templateVars = {
      error1: "Short URL not found 🕵️‍♀️",
      error2: "Please try again 🔁",
      userInfo: users[req.session.user_id],
      goHere: "/urls"
    }
    res.render("error", templateVars);
  }
});

// Checks first if correct user is logged in, then whether they own the shortURL requested. If everything is ok, updates URL.

app.post("/urls/:shortURL", (req, res) => {
  if (!findUserById(req.session.user_id, users)) {
    res.statusCode = 404;
    let templateVars = {
      error1: "You are not logged in 😔",
      error2: "Please log in to create and edit URLs.",
      userInfo: users[req.session.user_id],
      goHere: "/login"
    }
    res.render("error", templateVars);
  } else if (urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
    res.statusCode = 404;
    res.send("You don't have the proper permissions to edit that.\nEither <a href='/login'>log in</a> to the correct account, or <a href='/urls'>go back.</a>\n");
  }
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect('/urls');
});

// Checks if current user owns requested URL. If not, render an error.

app.post("/urls/:shortURL/delete", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID === req.session.user_id) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    let templateVars = {
      error1: "You don't have the proper permissions to do that!",
      error2: "😡 Don't 😡 delete 😡 other 😡 people's 😡 links 😡",
      userInfo: users[req.session.user_id],
      goHere: "/login"
    }
    res.render("error", templateVars);
  }
});

// If user is logged in, redirects to /urls since there's no need to register. Otherwise, renders registration.

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.statusCode = 302;
    res.redirect("/urls");
  } else {
    let templateVars = { userInfo: users[req.session.user_id] };
    res.render("register", templateVars);
  }
});

// Checks for no email/password and existing email. If everything is OK, adds new user to database and creates cookie.
app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.statusCode = 400;
    let templateVars = {
      error1: "Whoops!",
      error2: "Please enter a valid username and password.",
      userInfo: users[req.session.user_id],
      goHere: "/register"
    }
    res.render("error", templateVars);
  } else if (findUserByEmail(req.body.email, users)) {
    res.statusCode = 400;
    let templateVars = {
      error1: "An account already exists with that email.",
      error2: "Please try again, or log in to your account.",
      userInfo: users[req.session.user_id],
      goHere: "/register"
    }
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

// Redirects to URL index if user is logged in already, otherwise renders login.

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.statusCode = 302;
    res.redirect("/urls");
  } else {
    let templateVars = { userInfo: users[req.session.user_id] };
    res.render("login", templateVars);
  }
});

// Checks if email exists, then if password matches (rendering appropriate error pages). If both match, send to URLs.

app.post("/login", (req, res) => {
  if (!findUserByEmail(req.body.email, users)) {
    res.statusCode = 403;
    let templateVars = {error1: "Email not found 📩",
      error2: "Please try again.",
      userInfo: users[req.session.user_id],
      goHere: "/login"
    }
    res.render("error", templateVars);
  } else if (!bcrypt.compareSync(req.body.password, users[findUserByEmail(req.body.email, users)].password)) {
    res.statusCode = 403;
    let templateVars = {
      error1: "Incorrect password 🔑",
      error2: "Please try again.",
      userInfo: users[req.session.user_id],
      goHere: "/login"
    }
    res.render("error", templateVars);
  } else {
    req.session.user_id = findUserByEmail(req.body.email, users);
    res.redirect("/urls");
  }
});

// Clear cookies and logout.

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("back");
});