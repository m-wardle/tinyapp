const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser")

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {};

const  generateRandomString = function() {
  let result = '';
   let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
   let charactersLength = characters.length;
   for ( let i = 0; i < 6; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

const findEmail = function(str) {
  let result = []
  for (let i in users) {
    if (str === users[i].email) {
      return users[i].id;
    }
  }

  return false;
};

app.get("/", (req, res) => {
  res.redirect("/urls")
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
  let templateVars = { userInfo: users[req.cookies["user_id"]] }
  res.render("urls_new", templateVars);
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, userInfo: users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
})

app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], userInfo: users[req.cookies["user_id"]] };
    res.render("urls_show", templateVars);
  } else {
    res.statusCode = 404;
    res.send("Short URL not found! Please try again.");
  }
})

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
  res.statusCode = 303;
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL];
    res.redirect(longURL);
    res.statusCode = 303;
  } else {
    res.statusCode = 404;
    res.send("Short URL not found! Please try again.");
  }
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect('/urls')
})

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
})

app.get("/register", (req, res) => {
  let templateVars = { userInfo: users[req.cookies["user_id"]] };
  res.render("register", templateVars)
})

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.statusCode = 400;
    res.send("Please enter a valid email and password.")
  } else if (findEmail(req.body.email) === true) {
    res.statusCode = 400;
    res.send("An account already exists with that email. Please try again, or log in to your account.")
  } else {
    let userID = generateRandomString();
    users[userID] = {
    "id": userID,
    "email": req.body.email,
    "password": req.body.password
    };
    res.cookie("user_id", userID);
    console.log(users);
    res.redirect("/urls");
  }
})

app.get("/login", (req, res) => {
  let templateVars = { userInfo: users[req.cookies["user_id"]] };
  res.render("login", templateVars);
})

app.post("/login", (req, res) => {
  if (!findEmail(req.body.email)) {
    res.statusCode = 403;
    res.send("Email not found. Please try again.");
  } else if (req.body.password !== users[findEmail(req.body.email)].password) {
    res.statusCode = 403;
    res.send("Incorrect password. Please try again.");
  } else {
    res.cookie("user_id", findEmail(req.body.email));
    res.redirect("/urls")
  }
})

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("back");
})